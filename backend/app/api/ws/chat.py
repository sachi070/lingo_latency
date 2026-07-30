import uuid
import asyncio
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.ws_manager import ws_manager
from app.core.redis_pubsub import subscribe_to_room, publish_event
from app.services.presence import (
    add_user_presence,
    remove_user_presence,
    heartbeat_user_presence
)
from app.core.db import AsyncSessionLocal
from app.services.chat_db import save_message
from app.core.rate_limiter import is_rate_limited

router = APIRouter()


async def _persist_message(
    room_id: str,
    sender: str,
    original_text: str,
    source_lang: str,
    translated_text: str = "",
    target_lang: str = ""
):
    """Background task to asynchronously persist messages to PostgreSQL."""
    try:
        async with AsyncSessionLocal() as db:
            await save_message(
                db=db,
                room_id=room_id,
                sender=sender,
                original_text=original_text,
                source_lang=source_lang,
                translated_text=translated_text or original_text,
                target_lang=target_lang or source_lang
            )
    except Exception as e:
        print(f"⚠️ Failed to persist message to Postgres: {e}")


@router.websocket("/ws/chat/{room_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    room_id: str,
    user_id: str = Query("anonymous"),
    display_name: str = Query("User"),
    language: str = Query("en")
):
    await ws_manager.connect(
        websocket=websocket,
        room_id=room_id,
        user_id=user_id,
        display_name=display_name,
        language=language
    )

    await subscribe_to_room(room_id)

    # 1. On Connect: Add user to Redis Presence & Broadcast to Room
    updated_presence = await add_user_presence(room_id, user_id, display_name, language)
    await publish_event(
        room_id=room_id,
        event_type="presence_update",
        payload={"online_users": [u.model_dump() for u in updated_presence]}
    )

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            # A. Normal Chat Message
            # A. Normal Chat Message
            if msg_type == "message" and data.get("text"):
                # Safe Rate Limit Check
                try:
                    limited, _ = await is_rate_limited(
                        key=f"ws:msg:{user_id}",
                        max_requests=10,
                        window_seconds=10
                    )
                    if limited:
                        await websocket.send_json({
                            "type": "error",
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "You are sending messages too quickly. Please wait a few seconds."
                        })
                        continue
                except Exception as limiter_err:
                    print(f"⚠️ Rate limiter error ignored: {limiter_err}")

                msg_payload = {
                    "message_id": str(uuid.uuid4()),
                    "room_id": room_id,
                    "sender_id": user_id,
                    "sender_name": display_name,
                    "source_text": data["text"],
                    "source_lang": language,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # 1. Low-latency Redis Pub/Sub broadcast
                await publish_event(room_id, "message", msg_payload)

                # 2. Async background persistence to PostgreSQL
                asyncio.create_task(
                    _persist_message(
                        room_id=room_id,
                        sender=user_id,
                        original_text=data["text"],
                        source_lang=language
                    )
                )

            # B. Typing Indicator
            elif msg_type == "typing":
                is_typing = bool(data.get("is_typing", False))
                typing_payload = {
                    "user_id": user_id,
                    "display_name": display_name,
                    "is_typing": is_typing
                }
                await publish_event(room_id, "user_typing", typing_payload)

            # C. Connection Heartbeat (Keeps presence score fresh)
            elif msg_type == "heartbeat":
                await heartbeat_user_presence(room_id, user_id, display_name, language)

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, room_id)
        
        # 2. On Disconnect: Remove user from Redis Presence & Broadcast to Room
        remaining_presence = await remove_user_presence(room_id, user_id)
        await publish_event(
            room_id=room_id,
            event_type="presence_update",
            payload={"online_users": [u.model_dump() for u in remaining_presence]}
        )
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.ws_manager import ws_manager
from app.core.redis_pubsub import subscribe_to_room, publish_message

router = APIRouter()


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

    # Subscribe this node process to the Redis Pub/Sub channel
    await subscribe_to_room(room_id)

    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle incoming user text
            if data.get("type") == "message" and data.get("text"):
                msg_payload = {
                    "message_id": str(uuid.uuid4()),
                    "room_id": room_id,
                    "sender_id": user_id,
                    "sender_name": display_name,
                    "source_text": data["text"],
                    "source_lang": language,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Publish event to Redis Pub/Sub cross-instance bus
                await publish_message(room_id, msg_payload)

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, room_id)
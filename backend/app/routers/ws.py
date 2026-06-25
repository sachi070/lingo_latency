import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from app.services.connection import manager
from app.services.pubsub import pubsub_manager
from app.services.translation import translation_service
from app.dependencies import get_redis, get_current_user_ws
from bleach import clean

router = APIRouter()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    ws: WebSocket,
    room_id: str,
    user=Depends(get_current_user_ws),
    redis=Depends(get_redis)
):
    if not user:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(ws, room_id, str(user.id))

    async def redis_listener_task(payload: dict):
        if str(payload["sender_id"]) == str(user.id):
            return

        translation_result = await translation_service.translate_message(
            text=payload["original_text"],
            source_lang=payload["source_lang"],
            target_lang=user.preferred_language,
            redis=redis
        )

        await manager.send_to_user(
            user_id=str(user.id),
            room_id=room_id,
            payload={
                "type": "message",
                "sender_id": payload["sender_id"],
                "sender_name": payload["sender_name"],
                "text": translation_result["translated"],
                "original_text": payload["original_text"],
                "source_lang": payload["source_lang"],
                "target_lang": user.preferred_language,
                "cached": translation_result["cached"],
                "confidence": translation_result.get("confidence", 1.0),
                "timestamp": payload["timestamp"]
            }
        )

    sub_task = asyncio.create_task(
        pubsub_manager.subscribe(room_id, redis_listener_task)
    )

    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "message":
                raw_text = data.get("text", "").strip()
                if not raw_text or len(raw_text) > 1000:
                    continue
                
                clean_text = clean(raw_text, tags=[], strip=True)

                await pubsub_manager.publish(room_id, {
                    "sender_id": str(user.id),
                    "sender_name": user.username,
                    "original_text": clean_text,
                    "source_lang": user.preferred_language,
                    "timestamp": data.get("timestamp")
                })

            elif msg_type == "typing":
                await pubsub_manager.publish(room_id, {
                    "type": "typing",
                    "sender_id": str(user.id),
                    "sender_name": user.username
                })

    except WebSocketDisconnect:
        pass
    finally:
        sub_task.cancel()
        manager.disconnect(room_id, str(user.id))

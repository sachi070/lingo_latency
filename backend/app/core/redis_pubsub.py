import asyncio
import json
from app.core.redis import get_redis
from app.core.ws_manager import ws_manager
from app.services.translation import get_or_translate

active_subscriptions = set()

async def publish_event(room_id: str, event_type: str, payload: dict):
    """Generic publisher for messages, presence, and typing events."""
    redis = await get_redis()
    channel = f"room:{room_id}"
    data = {"event_type": event_type, "payload": payload}
    await redis.publish(channel, json.dumps(data))

async def subscribe_to_room(room_id: str):
    if room_id in active_subscriptions:
        return

    redis = await get_redis()
    pubsub = redis.pubsub()
    channel = f"room:{room_id}"
    await pubsub.subscribe(channel)
    active_subscriptions.add(room_id)

    asyncio.create_task(_listen_channel(pubsub, room_id))

async def _listen_channel(pubsub, room_id: str):
    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            raw_event = json.loads(message["data"])
            event_type = raw_event.get("event_type")
            payload = raw_event.get("payload")

            local_clients = ws_manager.get_local_clients_for_room(room_id)
            if not local_clients:
                break

            
            # 1. EVENT: CHAT MESSAGE (Translated per client)
            
            if event_type == "message":
                msg_id = payload["message_id"]
                sender_id = payload["sender_id"]
                sender_name = payload["sender_name"]
                source_text = payload["source_text"]
                source_lang = payload["source_lang"]
                timestamp = payload["timestamp"]

                for ws, client_info in local_clients:
                    target_lang = client_info["language"]

                    translated = await get_or_translate(
                        message_id=msg_id,
                        source_text=source_text,
                        source_lang=source_lang,
                        target_lang=target_lang
                    )

                    outbound = {
                        "type": "message",
                        "message_id": msg_id,
                        "room_id": room_id,
                        "sender_id": sender_id,
                        "sender_name": sender_name,
                        "source_lang": source_lang,
                        "target_lang": target_lang,
                        "translated_text": translated,
                        "timestamp": timestamp
                    }
                    await ws.send_text(json.dumps(outbound))

            
            # 2. EVENT: PRESENCE UPDATE (Who's online list)
            
            elif event_type == "presence_update":
                outbound = {
                    "type": "presence_update",
                    "room_id": room_id,
                    "online_users": payload["online_users"]
                }
                for ws, _ in local_clients:
                    await ws.send_text(json.dumps(outbound))

            
            # 3. EVENT: USER TYPING (Forwarded to all except sender)
            elif event_type == "user_typing":
                sender_id = payload["user_id"]
                outbound = {
                    "type": "user_typing",
                    "room_id": room_id,
                    "user_id": sender_id,
                    "display_name": payload["display_name"],
                    "is_typing": payload["is_typing"]
                }
                for ws, client_info in local_clients:
                    # Don't send typing status back to the person typing
                    if client_info["user_id"] != sender_id:
                        await ws.send_text(json.dumps(outbound))

    except asyncio.CancelledError:
        pass
    finally:
        active_subscriptions.discard(room_id)
        await pubsub.unsubscribe(f"room:{room_id}")
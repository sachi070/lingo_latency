import asyncio
import json
from app.core.redis import get_redis
from app.core.ws_manager import ws_manager
from app.services.translation import get_or_translate

active_subscriptions = set()


async def publish_message(room_id: str, payload: dict):
    """Publishes a raw message event to the Redis room channel."""
    redis = await get_redis()
    channel = f"room:{room_id}"
    await redis.publish(channel, json.dumps(payload))


async def subscribe_to_room(room_id: str):
    """Ensures this node is listening to the Redis pub/sub channel for room_id."""
    if room_id in active_subscriptions:
        return

    redis = await get_redis()
    pubsub = redis.pubsub()
    channel = f"room:{room_id}"
    await pubsub.subscribe(channel)
    active_subscriptions.add(room_id)

    # Spawn background listener loop for this room
    asyncio.create_task(_listen_channel(pubsub, room_id))


async def _listen_channel(pubsub, room_id: str):
    """Loops on Redis messages and fans them out translated to local WebSockets."""
    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            raw_data = json.loads(message["data"])
            
            # Extract fields
            msg_id = raw_data["message_id"]
            sender_id = raw_data["sender_id"]
            sender_name = raw_data["sender_name"]
            source_text = raw_data["source_text"]
            source_lang = raw_data["source_lang"]
            timestamp = raw_data["timestamp"]

            # Local connections for this node
            local_clients = ws_manager.get_local_clients_for_room(room_id)
            if not local_clients:
                break

            # Deduplicated translation lazy dispatch
            for ws, client_info in local_clients:
                target_lang = client_info["language"]

                # Fetch/Cache Translation
                translated = await get_or_translate(
                    message_id=msg_id,
                    source_text=source_text,
                    source_lang=source_lang,
                    target_lang=target_lang
                )

                outbound_data = {
                    "message_id": msg_id,
                    "room_id": room_id,
                    "sender_id": sender_id,
                    "sender_name": sender_name,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "translated_text": translated,
                    "timestamp": timestamp
                }

                await ws.send_text(json.dumps(outbound_data))

    except asyncio.CancelledError:
        pass
    finally:
        active_subscriptions.discard(room_id)
        await pubsub.unsubscribe(f"room:{room_id}")
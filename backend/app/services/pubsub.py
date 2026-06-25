import asyncio
import json
import logging
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger(__name__)

class PubSubManager:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self._redis = None

    async def get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def publish(self, room_id: str, message: dict):
        try:
            client = await self.get_redis()
            await client.publish(f"room:{room_id}", json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to publish to Redis Pub/Sub: {e}")

    async def subscribe(self, room_id: str, callback):
        client = await self.get_redis()
        pubsub = client.pubsub()
        await pubsub.subscribe(f"room:{room_id}")
        
        try:
            async for msg in pubsub.listen():
                if msg["type"] == "message":
                    try:
                        data = json.loads(msg["data"])
                        await callback(data)
                    except (json.JSONDecodeError, Exception) as e:
                        logger.error(f"Error handling message payload: {e}")
        except asyncio.CancelledError:
            await pubsub.unsubscribe(f"room:{room_id}")
            await pubsub.close()
        except Exception as e:
            logger.error(f"PubSub connection error in room {room_id}: {e}")
            await asyncio.sleep(2)

pubsub_manager = PubSubManager()

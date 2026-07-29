import redis.asyncio as aioredis
from typing import Optional
from app.config import settings

redis_client: Optional[aioredis.Redis] = None


async def init_redis() -> None:
    global redis_client
    redis_client = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis() -> None:
    global redis_client
    if redis_client:
        await redis_client.close()


async def get_redis() -> aioredis.Redis:
    if redis_client is None:
        raise RuntimeError("Redis pool is not initialized.")
    return redis_client
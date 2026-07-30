import time
import uuid
import redis.asyncio as aioredis
from app.config import settings


async def is_rate_limited(
    key: str,
    max_requests: int = 10,
    window_seconds: int = 10
) -> tuple[bool, int]:
    """Sliding window rate limiter using Redis sorted sets."""
    r = None
    try:
        # Create a direct connection to Redis using app settings
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        now = time.time()
        clear_before = now - window_seconds
        redis_key = f"rate_limit:{key}"
        member_id = f"{now}:{uuid.uuid4()}"

        async with r.pipeline(transaction=True) as pipe:
            pipe.zremrangebyscore(redis_key, 0, clear_before)
            pipe.zcard(redis_key)
            pipe.zadd(redis_key, {member_id: now})
            pipe.expire(redis_key, window_seconds)
            results = await pipe.execute()

        current_requests = results[1]
        remaining = max(0, max_requests - current_requests - 1)

        if current_requests >= max_requests:
            return True, 0

        return False, remaining
    except Exception as e:
        print(f"⚠️ Rate limiter error: {e}")
        return False, max_requests
    finally:
        if r:
            await r.aclose()
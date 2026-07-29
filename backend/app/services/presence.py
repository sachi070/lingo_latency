import json
import time
from typing import List
from app.core.redis import get_redis
from app.models.schemas import UserPresence

PRESENCE_TTL_SECONDS = 35  # Purge users missing heartbeats for >35s

async def add_user_presence(room_id: str, user_id: str, display_name: str, language: str) -> List[UserPresence]:
    redis = await get_redis()
    key = f"presence:{room_id}"
    member = json.dumps({"user_id": user_id, "display_name": display_name, "language": language})
    
    # ZADD with current timestamp
    await redis.zadd(key, {member: time.time()})
    return await get_room_presence(room_id)

async def remove_user_presence(room_id: str, user_id: str) -> List[UserPresence]:
    redis = await get_redis()
    key = f"presence:{room_id}"
    
    # Get members and remove matching user_id
    members = await redis.zrange(key, 0, -1)
    for m in members:
        data = json.loads(m)
        if data["user_id"] == user_id:
            await redis.zrem(key, m)
            break
            
    return await get_room_presence(room_id)

async def heartbeat_user_presence(room_id: str, user_id: str, display_name: str, language: str):
    await add_user_presence(room_id, user_id, display_name, language)

async def get_room_presence(room_id: str) -> List[UserPresence]:
    redis = await get_redis()
    key = f"presence:{room_id}"
    
    # Clean up stale connections older than TTL
    cutoff = time.time() - PRESENCE_TTL_SECONDS
    await redis.zremrangebyscore(key, 0, cutoff)
    
    # Fetch active users
    members = await redis.zrange(key, 0, -1)
    users = []
    for m in members:
        data = json.loads(m)
        users.append(UserPresence(**data))
    return users
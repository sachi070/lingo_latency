import json
from groq import AsyncGroq
from app.config import settings
from app.core.redis import get_redis

groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)


async def get_or_translate(
    message_id: str,
    source_text: str,
    source_lang: str,
    target_lang: str
) -> str:
    """Checks Redis cache first. On miss, calls Groq LLM and caches the result for 1 hour."""
    if source_lang.lower() == target_lang.lower():
        return source_text

    redis = await get_redis()
    cache_key = f"translation:{message_id}:{target_lang.lower()}"

    # 1. Try Redis Cache
    cached_text = await redis.get(cache_key)
    if cached_text:
        return cached_text

    # 2. Cache Miss — Call Groq
    system_prompt = (
        "You are a hyper-fast real-time chat translator. "
        "Translate the input accurately into the requested target language. "
        "Maintain tone, formatting, and emojis. Return ONLY the translated string — "
        "no conversational intro, quotes, or explanation."
    )

    user_prompt = f"Source language: {source_lang}\nTarget language: {target_lang}\nText: {source_text}"

    try:
        response = await groq_client.chat.completions.create(
            model=settings.DEFAULT_TRANSLATION_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=256
        )
        translated = response.choices[0].message.content.strip()
        
        # 3. Store in Redis with 1-hour TTL
        await redis.set(cache_key, translated, ex=3600)
        return translated

    except Exception as e:
        print(f"[Groq Error] Falling back to raw source text: {e}")
        return source_text
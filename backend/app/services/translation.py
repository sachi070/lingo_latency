import hashlib
import json
import logging
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama3-8b-8192"

    async def translate_message(self, text: str, source_lang: str, target_lang: str, redis) -> dict:
        if source_lang.lower() == target_lang.lower():
            return {"translated": text, "cached": False, "confidence": 1.0}

        hash_input = f"{text}:{source_lang}:{target_lang}".encode("utf-8")
        cache_key = f"xlat:{hashlib.md5(hash_input).hexdigest()}"
        
        try:
            cached_result = await redis.get(cache_key)
            if cached_result:
                return {**json.loads(cached_result), "cached": True}
        except Exception as e:
            logger.error(f"Redis cache read failed: {e}")

        system_prompt = (
            f"You are a low-latency real-time chat translation engine.\n"
            f"Translate the incoming text from {source_lang} to {target_lang}.\n"
            f"Preserve conversational context, slang, emojis, and emotional tone.\n"
            f"Return EXACTLY a valid JSON object matching this schema:\n"
            f'{{"translated": "string", "confidence": float}}'
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Text to translate: {text}"}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            raw_content = response.choices[0].message.content
            result = json.loads(raw_content)
            
            try:
                await redis.setex(cache_key, 3600, json.dumps(result))
            except Exception as e:
                logger.error(f"Redis cache write failed: {e}")

            return {**result, "cached": False}
        except Exception as e:
            logger.error(f"Groq API pipeline failed: {e}")
            return {"translated": text, "cached": False, "confidence": 0.0}

translation_service = TranslationService()

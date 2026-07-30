import io
from groq import AsyncGroq
from app.config import settings

groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)


async def transcribe_audio(audio_bytes: bytes, filename: str = "input.webm") -> str:
    """Transcribes audio bytes into text using Groq's low-latency Whisper endpoint."""
    try:
        audio_file = (filename, audio_bytes, "audio/webm")
        
        transcription = await groq_client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3-turbo",
            response_format="text",
            temperature=0.0
        )
        return transcription.strip() if isinstance(transcription, str) else transcription.text.strip()
    except Exception as e:
        print(f"[Whisper STT Error]: {e}")
        raise RuntimeError("Speech-to-text processing failed.")
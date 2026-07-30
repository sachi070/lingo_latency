import edge_tts
import io

# Map ISO language codes to edge-tts voice profiles
VOICE_MAPPING = {
    "en": "en-US-AvaNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "ja": "ja-JP-NanamiNeural",
    "hi": "hi-IN-SwaraNeural",
    "zh": "zh-CN-XiaoxiaoNeural"
}


async def text_to_speech_bytes(text: str, target_lang: str) -> bytes:
    """Generates MP3 audio bytes from text using edge-tts for the target language."""
    voice = VOICE_MAPPING.get(target_lang.lower()[:2], "en-US-AvaNeural")
    
    communicate = edge_tts.Communicate(text, voice)
    audio_stream = io.BytesIO()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])
            
    return audio_stream.getvalue()
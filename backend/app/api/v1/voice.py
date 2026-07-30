from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.stt import transcribe_audio
from app.services.tts import text_to_speech_bytes
from fastapi.responses import Response

router = APIRouter(tags=["Voice"])


@router.post("/transcribe")
async def process_voice_input(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """Receives recorded webm audio, runs Whisper STT, and returns transcription."""
    try:
        contents = await file.read()
        transcription = await transcribe_audio(contents, filename=file.filename or "audio.webm")
        return {
            "status": "success",
            "transcription": transcription,
            "detected_language": language
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tts")
async def generate_speech(text: str, target_lang: str = "en"):
    """Generates audio for TTS playback in target language."""
    try:
        audio_bytes = await text_to_speech_bytes(text, target_lang)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {e}")
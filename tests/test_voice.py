import asyncio
import httpx

async def test_voice_pipeline():
    base_url = "http://127.0.0.1:8080/api/v1/voice"
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        # 1. Test TTS Endpoint (Text -> German Speech Audio)
        print("🔊 Testing TTS Endpoint...")
        tts_resp = await client.get(
            f"{base_url}/tts",
            params={"text": "Guten Morgen! Das ist ein Test.", "target_lang": "de"}
        )
        
        if tts_resp.status_code == 200:
            print(f"✅ TTS Success! Received {len(tts_resp.content)} bytes of MP3 audio.")
        else:
            print(f"❌ TTS Failed: {tts_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_voice_pipeline())
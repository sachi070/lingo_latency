import asyncio
import json
import httpx
import websockets

BASE_HTTP_URL = "http://127.0.0.1:8080"
BASE_WS_URL = "ws://127.0.0.1:8080"
ROOM_ID = "rate-limit-room"
USER_ID = "spammer_99"


async def test_websocket_rate_limit():
    print("\n--- 1. Testing WebSocket Rate Limiter ---")
    ws_url = f"{BASE_WS_URL}/ws/chat/{ROOM_ID}?user_id={USER_ID}&display_name=Spammer&language=en"

    async with websockets.connect(ws_url) as ws:
        # Drain initial presence event
        await ws.recv()

        # Send 12 messages rapid-fire (Limit is 10 per 10s)
        rate_limit_triggered = False
        print("⚡ Sending 12 rapid-fire messages...")

        for i in range(1, 13):
            msg = {"type": "message", "text": f"Rapid message #{i}"}
            await ws.send(json.dumps(msg))

            # Read response
            resp_raw = await ws.recv()
            resp = json.loads(resp_raw)

            if resp.get("type") == "error" and resp.get("code") == "RATE_LIMIT_EXCEEDED":
                print(f"🛑 Message #{i} blocked! Received: {resp['message']}")
                rate_limit_triggered = True
            else:
                # Resolve text safely across flat or nested payloads
                text = (
                    resp.get("text")
                    or resp.get("source_text")
                    or resp.get("payload", {}).get("source_text", "received")
                )
                print(f"✅ Message #{i} allowed: {text}")

        if rate_limit_triggered:
            print("🎉 WEBSOCKET RATE LIMITER VERIFIED!")
        else:
            print("ℹ️ All messages went through (Check rate limit threshold/window settings).")


async def test_http_rate_limit():
    print("\n--- 2. Testing HTTP Rate Limiter ---")
    async with httpx.AsyncClient() as client:
        limited_status_found = False
        print("⚡ Spamming GET /api/v1/voice/tts...")

        # Send 65 rapid requests (Limit is 60 per minute)
        for i in range(1, 65):
            res = await client.get(
                f"{BASE_HTTP_URL}/api/v1/voice/tts",
                params={"text": "Rate limit test", "target_lang": "en"},
            )
            if res.status_code == 429:
                print(f"🛑 Request #{i} throttled! HTTP 429: {res.json()}")
                limited_status_found = True
                break
            elif i % 15 == 0:
                print(
                    f"  • Request #{i} status: {res.status_code} (Remaining: {res.headers.get('X-RateLimit-Remaining')})"
                )

        if limited_status_found:
            print("🎉 HTTP RATE LIMITER VERIFIED!")
        else:
            print("ℹ️ HTTP limits not exceeded or middleware not active.")


async def main():
    await test_websocket_rate_limit()
    await test_http_rate_limit()


if __name__ == "__main__":
    asyncio.run(main())
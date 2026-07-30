import asyncio
import json
import httpx
import websockets

BASE_HTTP_URL = "http://127.0.0.1:8080"
BASE_WS_URL = "ws://127.0.0.1:8080"
ROOM_ID = "test-room-101"
USER_ID = "tester_sachi"
DISPLAY_NAME = "Sachi"
TEST_MESSAGE = "Hello from automated WebSocket history test!"

async def test_websocket_history_flow():
    ws_url = f"{BASE_WS_URL}/ws/chat/{ROOM_ID}?user_id={USER_ID}&display_name={DISPLAY_NAME}&language=en"
    
    # 1. Connect to WebSocket and send a message
    print(f"🔌 Connecting to WebSocket room: {ROOM_ID}...")
    async with websockets.connect(ws_url) as ws:
        # Read initial presence update broadcast
        presence_event = await ws.recv()
        print("📥 Received event on connect:", presence_event)

        # Send test chat message
        payload = {
            "type": "message",
            "text": TEST_MESSAGE
        }
        print(f"📤 Sending message: '{TEST_MESSAGE}'")
        await ws.send(json.dumps(payload))

        # Receive broadcast confirmation
        broadcast_response = await ws.recv()
        print("📡 Received Pub/Sub broadcast:", broadcast_response)

    # 2. Wait 500ms for background task (_persist_message) to commit to PostgreSQL
    print("⏳ Waiting for async background persistence to Postgres...")
    await asyncio.sleep(0.5)

    # 3. Query REST endpoint for chat history
    print(f"🔍 Fetching chat history via GET /api/v1/chat/history/{ROOM_ID}...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_HTTP_URL}/api/v1/chat/history/{ROOM_ID}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ REST Endpoint Success! Found {data['count']} message(s) in room '{ROOM_ID}':")
            
            matched = False
            for msg in data["messages"]:
                print(f"  • [{msg['created_at']}] {msg['sender']}: {msg['original_text']}")
                if msg["original_text"] == TEST_MESSAGE:
                    matched = True
            
            if matched:
                print("\n🎉 PERSISTENCE VERIFIED: Message sent via WS exists in PostgreSQL database!")
            else:
                print("\n❌ Error: Message sent via WS was not found in fetched history.")
        else:
            print(f"\n❌ History request failed ({response.status_code}): {response.text}")

if __name__ == "__main__":
    asyncio.run(test_websocket_history_flow())
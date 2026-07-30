import asyncio
import json
import websockets

async def connect_client(user_id, name, lang):
    url = f"ws://127.0.0.1:8080/ws/chat/room-test?user_id={user_id}&display_name={name}&language={lang}"
    
    headers = {"Origin": "http://127.0.0.1:8080"}
    
    try:
        async with websockets.connect(url, additional_headers=headers, open_timeout=15) as ws:
            print(f"✅ [{name} - {lang}] Connected through Nginx Load Balancer!")
            
            if name == "Alice":
                await asyncio.sleep(2)
                msg = {"type": "message", "text": "Good morning my friends! Distributed WebSockets work!"}
                print(f"\n📤 [{name} (en)] Sending: {msg['text']}")
                await ws.send(json.dumps(msg))
                
            # Wait for translated fan-out message
            response = await ws.recv()
            data = json.loads(response)
            print(f"📥 [{name} ({data['target_lang']}) received]: {data['translated_text']}")
            
    except Exception as e:
        print(f"❌ [{name}] Connection failed: {e}")

async def main():
    await asyncio.gather(
        connect_client("u1", "Alice", "en"),
        connect_client("u2", "Bob", "de"),
        connect_client("u3", "Carlos", "fr"),
    )

if __name__ == "__main__":
    asyncio.run(main())
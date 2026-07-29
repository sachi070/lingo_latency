import asyncio
import json
import websockets

async def test_presence_and_typing():
    url_alice = "ws://127.0.0.1:8080/ws/chat/room-presence?user_id=u1&display_name=Alice&language=en"
    url_bob = "ws://127.0.0.1:8080/ws/chat/room-presence?user_id=u2&display_name=Bob&language=es"
    headers = {"Origin": "http://127.0.0.1:8080"}

    async with websockets.connect(url_alice, additional_headers=headers) as ws_alice:
        print("Alice connected.")
        msg1 = json.loads(await ws_alice.recv())
        print(f"Alice received presence update: {len(msg1['online_users'])} online user(s).")

        async with websockets.connect(url_bob, additional_headers=headers) as ws_bob:
            print("Bob connected.")
            
            # Alice receives updated presence showing 2 users
            msg2 = json.loads(await ws_alice.recv())
            print(f"Alice saw Bob join: {len(msg2['online_users'])} users online now!")

            # Bob sends typing indicator
            print("Bob starts typing...")
            await ws_bob.send(json.dumps({"type": "typing", "is_typing": True}))

            # Alice receives typing indicator
            typing_event = json.loads(await ws_alice.recv())
            print(f"Alice received typing notification: {typing_event['display_name']} is typing ({typing_event['is_typing']})")

if __name__ == "__main__":
    asyncio.run(test_presence_and_typing())
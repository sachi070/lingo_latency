from collections import defaultdict
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)

    async def connect(self, ws: WebSocket, room_id: str, user_id: str):
        await ws.accept()
        self.active_connections[room_id][user_id] = ws

    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(user_id, None)
            if not self.active_connections[room_id]:
                self.active_connections.pop(room_id, None)

    async def send_to_user(self, user_id: str, room_id: str, payload: dict):
        ws = self.active_connections.get(room_id, {}).get(user_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                self.disconnect(room_id, user_id)

    async def broadcast_to_room(self, room_id: str, payload: dict, exclude_user_id: str = None):
        connections = list(self.active_connections.get(room_id, {}).items())
        for uid, ws in connections:
            if uid == exclude_user_id:
                continue
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(room_id, uid)

manager = ConnectionManager()

import json
from typing import Dict, List, Set
from fastapi import WebSocket

class ConnectionManager:
    """Manages active WebSocket connections local to this FastAPI worker process."""
    
    def __init__(self):
        # Maps room_id -> Dict[WebSocket, dict(user_id, language, display_name)]
        self.active_connections: Dict[str, Dict[WebSocket, dict]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, display_name: str, language: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        
        self.active_connections[room_id][websocket] = {
            "user_id": user_id,
            "display_name": display_name,
            "language": language.lower()
        }

    def disconnect(self, websocket: WebSocket, room_id: str) -> bool:
        """Removes connection. Returns True if room is now empty on this node."""
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(websocket, None)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
                return True
        return False

    def get_local_languages_for_room(self, room_id: str) -> Set[str]:
        """Returns unique languages requested by users connected to THIS node in room_id."""
        if room_id not in self.active_connections:
            return set()
        return {info["language"] for info in self.active_connections[room_id].values()}

    def get_local_clients_for_room(self, room_id: str) -> List[tuple[WebSocket, dict]]:
        """Returns all active (websocket, client_metadata) tuples for a room on this node."""
        if room_id not in self.active_connections:
            return []
        return list(self.active_connections[room_id].items())


ws_manager = ConnectionManager()
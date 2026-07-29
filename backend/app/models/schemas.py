# backend/app/models/schemas.py
from pydantic import BaseModel
from typing import Optional, Literal, List

class UserPresence(BaseModel):
    user_id: str
    display_name: str
    language: str

class WSMessageIncoming(BaseModel):
    type: Literal["message", "typing", "heartbeat"] = "message"
    room_id: Optional[str] = None
    text: Optional[str] = None
    is_typing: Optional[bool] = None

class WSMessageOutgoing(BaseModel):
    type: Literal["message", "presence_update", "user_typing"]
    # Message fields
    message_id: Optional[str] = None
    room_id: Optional[str] = None
    sender_id: Optional[str] = None
    sender_name: Optional[str] = None
    source_lang: Optional[str] = None
    target_lang: Optional[str] = None
    translated_text: Optional[str] = None
    timestamp: Optional[str] = None
    # Presence fields
    online_users: Optional[List[UserPresence]] = None
    # Typing fields
    user_id: Optional[str] = None
    display_name: Optional[str] = None
    is_typing: Optional[bool] = None
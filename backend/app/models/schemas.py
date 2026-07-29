from pydantic import BaseModel, Field
from typing import Optional, Literal, List

class WSMessageIncoming(BaseModel):
    type: Literal["message", "typing"] = "message"
    room_id: str
    text: Optional[str] = None
    is_typing: Optional[bool] = None

class WSMessageOutgoing(BaseModel):
    message_id: str
    room_id: str
    sender_id: str
    sender_name: str
    source_lang: str
    target_lang: str
    translated_text: str
    timestamp: str

class RoomPresence(BaseModel):
    user_id: str
    display_name: str
    language: str
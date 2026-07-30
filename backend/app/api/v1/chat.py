from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.services.chat_db import get_room_history

router = APIRouter(tags=["Chat"])


@router.get("/history/{room_id}")
async def fetch_chat_history(room_id: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Returns past message history for a specific room."""
    try:
        messages = await get_room_history(db, room_id=room_id, limit=limit)
        return {
            "status": "success",
            "room_id": room_id,
            "count": len(messages),
            "messages": [
                {
                    "id": msg.id,
                    "sender": msg.sender,
                    "original_text": msg.original_text,
                    "source_lang": msg.source_lang,
                    "translated_text": msg.translated_text,
                    "target_lang": msg.target_lang,
                    "created_at": msg.created_at.isoformat(),
                }
                for msg in messages
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {e}")
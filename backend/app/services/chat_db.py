import uuid
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chat import MessageModel


async def save_message(
    db: AsyncSession,
    room_id: str,
    sender: str,
    original_text: str,
    source_lang: str,
    translated_text: str,
    target_lang: str,
) -> MessageModel:
    """Persists a translated message into PostgreSQL."""
    msg = MessageModel(
        id=str(uuid.uuid4()),
        room_id=room_id,
        sender=sender,
        original_text=original_text,
        source_lang=source_lang,
        translated_text=translated_text,
        target_lang=target_lang,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def get_room_history(db: AsyncSession, room_id: str, limit: int = 50):
    """Retrieves the latest messages for a given room."""
    result = await db.execute(
        select(MessageModel)
        .filter(MessageModel.room_id == room_id)
        .order_by(MessageModel.created_at.asc())
        .limit(limit)
    )
    return result.scalars().all()
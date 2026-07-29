import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    display_name: Mapped[str] = mapped_column(String(50), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # Room code e.g. "room-123"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id: Mapped[str] = mapped_column(String, ForeignKey("rooms.id"), nullable=False)
    sender_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    sender_name: Mapped[str] = mapped_column(String(50), nullable=False)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_lang: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
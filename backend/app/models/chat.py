from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    room_id = Column(String, index=True, nullable=False)
    sender = Column(String, nullable=False)
    original_text = Column(Text, nullable=False)
    source_lang = Column(String(10), nullable=False)
    translated_text = Column(Text, nullable=False)
    target_lang = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
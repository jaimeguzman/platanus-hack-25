from sqlalchemy import Column, Integer, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from .database import Base


class Memory(Base):
    __tablename__ = "memory"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(1536))  # text-embedding-3-small
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MemoryEdge(Base):
    __tablename__ = "memory_edge"

    source_id = Column(
        Integer,
        ForeignKey("memory.id", ondelete="CASCADE"),
        primary_key=True,
    )
    target_id = Column(
        Integer,
        ForeignKey("memory.id", ondelete="CASCADE"),
        primary_key=True,
    )
    weight = Column(Float, nullable=False)

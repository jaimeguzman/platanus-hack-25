from typing import List, Optional, Tuple, Dict, Any

import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select

from .database import SessionLocal, Base, engine
from .models import Memory, MemoryEdge
from .embeddings import EmbeddingGenerator
from .graph_store import MemoryGraphStore


class RagMemoryService:
    """
    Core RAG memory graph service.
    """

    def __init__(self, auto_create_schema: bool = True):
        self.embedding_generator = EmbeddingGenerator()
        self.graph_store = MemoryGraphStore()

        if auto_create_schema:
            Base.metadata.create_all(bind=engine)

    def _get_session(self) -> Session:
        return SessionLocal()

    # -------- Memory operations --------

    def add_memory(self, text: str) -> Memory:
        embedding = self.embedding_generator.generate_embedding(text)

        session = self._get_session()
        try:
            memory = Memory(text=text, embedding=embedding)
            session.add(memory)
            session.commit()
            session.refresh(memory)

            self.graph_store.add_memory_node(memory.id)

            similar_memories = self._get_similar_memories_by_embedding(
                session=session,
                embedding=embedding,
                limit=5,
                exclude_id=memory.id,
            )

            for sim in similar_memories:
                similarity_score = self._estimate_similarity_score(
                    memory_a_embedding=embedding,
                    memory_b_embedding=sim.embedding,
                )

                self.graph_store.add_similarity_edge(
                    memory.id,
                    sim.id,
                    similarity_score,
                )

                edge = MemoryEdge(
                    source_id=memory.id,
                    target_id=sim.id,
                    weight=similarity_score,
                )
                session.merge(edge)

            session.commit()
            session.refresh(memory)
            # Ensure all attributes are loaded before closing session
            _ = memory.id
            _ = memory.text
            _ = memory.embedding
            _ = memory.created_at
            session.expunge(memory)
            return memory
        finally:
            session.close()

    def get_memory(self, memory_id: int) -> Optional[Memory]:
        session = self._get_session()
        try:
            memory = session.get(Memory, memory_id)
            if memory:
                # Ensure all attributes are loaded before closing session
                _ = memory.id
                _ = memory.text
                _ = memory.embedding
                _ = memory.created_at
                session.expunge(memory)
            return memory
        finally:
            session.close()

    # -------- Similarity search --------

    def _get_similar_memories_by_embedding(
        self,
        session: Session,
        embedding: List[float],
        limit: int = 5,
        exclude_id: Optional[int] = None,
    ) -> List[Memory]:
        distance_expr = Memory.embedding.op("<->")(embedding)

        stmt = (
            select(Memory)
            .order_by(distance_expr)
            .limit(limit + (1 if exclude_id is not None else 0))
        )

        results = session.execute(stmt).scalars().all()

        if exclude_id is not None:
            results = [m for m in results if m.id != exclude_id]

        return results[:limit]

    def search_similar_by_text(
        self,
        query_text: str,
        limit: int = 5,
    ) -> List[Memory]:
        embedding = self.embedding_generator.generate_embedding(query_text)

        session = self._get_session()
        try:
            memories = self._get_similar_memories_by_embedding(
                session=session,
                embedding=embedding,
                limit=limit,
            )
            # Ensure all attributes are loaded before closing session
            for memory in memories:
                _ = memory.id
                _ = memory.text
                _ = memory.embedding
                _ = memory.created_at
                session.expunge(memory)
            return memories
        finally:
            session.close()

    # -------- Graph-level operations --------

    def _estimate_similarity_score(
        self,
        memory_a_embedding: List[float],
        memory_b_embedding: List[float],
    ) -> float:
        va = np.array(memory_a_embedding, dtype=float)
        vb = np.array(memory_b_embedding, dtype=float)

        denom = (np.linalg.norm(va) * np.linalg.norm(vb)) or 1.0
        cos_sim = float(np.dot(va, vb) / denom)

        normalized = (cos_sim + 1.0) / 2.0
        return normalized

    def get_memory_neighbors(
        self,
        memory_id: int,
        limit: int = 5,
    ) -> List[Tuple[int, float]]:
        return self.graph_store.get_neighbors(memory_id, limit=limit)

    def export_graph_json(
        self,
        max_nodes: int = 500,
    ) -> Dict[str, Any]:
        session = self._get_session()
        try:
            rows = session.execute(
                select(Memory.id, Memory.text)
                .order_by(Memory.id)
                .limit(max_nodes)
            ).all()

            node_ids = {row.id for row in rows}

            nodes = [
                {
                    "id": row.id,
                    "label": (row.text[:80] + "...") if len(row.text) > 80 else row.text,
                }
                for row in rows
            ]

            edges_rows = session.execute(
                select(MemoryEdge.source_id, MemoryEdge.target_id, MemoryEdge.weight)
                .where(MemoryEdge.source_id.in_(node_ids))
                .where(MemoryEdge.target_id.in_(node_ids))
            ).all()

            edges = [
                {
                    "source": row.source_id,
                    "target": row.target_id,
                    "weight": row.weight,
                }
                for row in edges_rows
            ]

            return {
                "nodes": nodes,
                "edges": edges,
            }
        finally:
            session.close()

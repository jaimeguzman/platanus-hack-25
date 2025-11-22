from typing import List, Optional, Tuple, Dict, Any
from contextlib import contextmanager
import logging

import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select, func, delete
from sqlalchemy.exc import SQLAlchemyError

from .database import SessionLocal, Base, engine
from .models import Memory, MemoryEdge
from .embeddings import EmbeddingGenerator
from .graph_store import MemoryGraphStore

logger = logging.getLogger(__name__)


class RagMemoryService:
    """
    Core RAG memory graph service.
    
    Provides functionality for:
    - Adding and retrieving memories
    - Semantic search using vector embeddings
    - Graph-based similarity relationships
    - Memory clustering and traversal
    """

    def __init__(
        self,
        auto_create_schema: bool = True,
        similarity_threshold: float = 0.7,
        max_similar_connections: int = 5,
        load_graph: bool = True,
    ):
        """
        Initialize the RAG memory service.
        
        Args:
            auto_create_schema: Whether to create database tables automatically
            similarity_threshold: Minimum similarity score to create an edge (0.0 to 1.0)
            max_similar_connections: Maximum number of similar memories to connect
            load_graph: Whether to load the graph from database on initialization
        """
        self.embedding_generator = EmbeddingGenerator()
        self.graph_store = MemoryGraphStore()
        self.similarity_threshold = similarity_threshold
        self.max_similar_connections = max_similar_connections

        if auto_create_schema:
            try:
                Base.metadata.create_all(bind=engine)
                logger.info("Database schema created/verified")
            except SQLAlchemyError as e:
                logger.error(f"Failed to create schema: {e}")
                raise
        
        if load_graph:
            try:
                with self._get_session_context() as session:
                    self.graph_store.load_from_database(session)
            except SQLAlchemyError as e:
                logger.warning(f"Failed to load graph from database: {e}")

    @contextmanager
    def _get_session_context(self):
        """
        Context manager for database sessions.
        Ensures proper cleanup and error handling.
        """
        session = SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Session error: {e}")
            raise
        finally:
            session.close()

    def _get_session(self) -> Session:
        """
        Get a database session.
        Note: Caller is responsible for closing the session.
        """
        return SessionLocal()

    # -------- Memory operations --------

    def add_memory(
        self,
        text: str,
        category: Optional[str] = None,
        source: Optional[str] = None,
    ) -> Memory:
        """
        Add a new memory to the system.
        
        Args:
            text: The text content of the memory
            category: Optional category/tag for the memory
            source: Optional source identifier
            
        Returns:
            The created Memory object
            
        Raises:
            ValueError: If text is empty or invalid
            SQLAlchemyError: If database operation fails
        """
        if not text or not text.strip():
            raise ValueError("Memory text cannot be empty")
        
        text = text.strip()
        
        try:
            embedding = self.embedding_generator.generate_embedding(text)
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

        session = self._get_session()
        try:
            memory = Memory(
                text=text,
                embedding=embedding,
                category=category,
                source=source,
            )
            session.add(memory)
            session.commit()
            session.refresh(memory)
            
            logger.info(f"Created memory {memory.id}")

            # Add to graph
            self.graph_store.add_memory_node(memory.id)

            # Find and connect similar memories
            similar_memories = self._get_similar_memories_by_embedding(
                session=session,
                embedding=embedding,
                limit=self.max_similar_connections,
                exclude_id=memory.id,
            )

            edges_created = 0
            for sim in similar_memories:
                similarity_score = self._calculate_cosine_similarity(
                    embedding_a=embedding,
                    embedding_b=sim.embedding,
                )

                # Only create edge if similarity exceeds threshold
                if similarity_score < self.similarity_threshold:
                    continue

                # Check if edges already exist
                existing_forward = session.get(MemoryEdge, (memory.id, sim.id))
                existing_backward = session.get(MemoryEdge, (sim.id, memory.id))
                
                if existing_forward:
                    # Update existing edge weight
                    existing_forward.weight = similarity_score
                    logger.debug(f"Updated edge {memory.id} -> {sim.id}")
                else:
                    # Create new forward edge
                    edge_forward = MemoryEdge(
                        source_id=memory.id,
                        target_id=sim.id,
                        weight=similarity_score,
                    )
                    session.add(edge_forward)
                
                if existing_backward:
                    # Update existing edge weight
                    existing_backward.weight = similarity_score
                    logger.debug(f"Updated edge {sim.id} -> {memory.id}")
                else:
                    # Create new backward edge
                    edge_backward = MemoryEdge(
                        source_id=sim.id,
                        target_id=memory.id,
                        weight=similarity_score,
                    )
                    session.add(edge_backward)
                
                # Add/update in-memory graph
                self.graph_store.add_similarity_edge(
                    memory.id,
                    sim.id,
                    similarity_score,
                )
                
                edges_created += 1

            session.commit()
            session.refresh(memory)
            
            logger.info(f"Memory {memory.id} connected to {edges_created} similar memories")
            
            # Ensure all attributes are loaded before closing session
            _ = memory.id
            _ = memory.text
            _ = memory.embedding
            _ = memory.created_at
            _ = memory.category
            _ = memory.source
            session.expunge(memory)
            
            return memory
            
        except SQLAlchemyError as e:
            logger.error(f"Database error adding memory: {e}")
            raise
        finally:
            session.close()

    def add_memories_batch(
        self,
        texts: List[str],
        categories: Optional[List[str]] = None,
        sources: Optional[List[str]] = None,
    ) -> List[Memory]:
        """
        Add multiple memories efficiently in a batch.
        
        Args:
            texts: List of text contents
            categories: Optional list of categories (must match length of texts)
            sources: Optional list of sources (must match length of texts)
            
        Returns:
            List of created Memory objects
        """
        if not texts:
            return []
        
        if categories and len(categories) != len(texts):
            raise ValueError("Categories list must match texts length")
        if sources and len(sources) != len(texts):
            raise ValueError("Sources list must match texts length")
        
        # Generate all embeddings in batch
        try:
            embeddings = self.embedding_generator.generate_embeddings_batch(texts)
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise
        
        memories = []
        session = self._get_session()
        
        try:
            # Create all memory objects
            for i, (text, embedding) in enumerate(zip(texts, embeddings)):
                memory = Memory(
                    text=text.strip(),
                    embedding=embedding,
                    category=categories[i] if categories else None,
                    source=sources[i] if sources else None,
                )
                session.add(memory)
                memories.append(memory)
            
            session.commit()
            
            # Refresh to get IDs
            for memory in memories:
                session.refresh(memory)
                self.graph_store.add_memory_node(memory.id)
            
            logger.info(f"Created {len(memories)} memories in batch")
            
            # Connect similar memories
            # Track edges created in this batch to avoid duplicates
            edges_in_batch = set()
            
            for memory in memories:
                similar_memories = self._get_similar_memories_by_embedding(
                    session=session,
                    embedding=memory.embedding,
                    limit=self.max_similar_connections,
                    exclude_id=memory.id,
                )
                
                for sim in similar_memories:
                    similarity_score = self._calculate_cosine_similarity(
                        embedding_a=memory.embedding,
                        embedding_b=sim.embedding,
                    )
                    
                    if similarity_score < self.similarity_threshold:
                        continue
                    
                    # Create edge keys for tracking
                    edge_forward_key = (memory.id, sim.id)
                    edge_backward_key = (sim.id, memory.id)
                    
                    # Check if edges already exist in DB
                    existing_forward = session.get(MemoryEdge, edge_forward_key)
                    existing_backward = session.get(MemoryEdge, edge_backward_key)
                    
                    # Handle forward edge
                    if existing_forward:
                        # Update existing edge weight
                        existing_forward.weight = similarity_score
                        edges_in_batch.add(edge_forward_key)
                    elif edge_forward_key not in edges_in_batch:
                        # Create new forward edge only if not already created in this batch
                        edge_forward = MemoryEdge(
                            source_id=memory.id,
                            target_id=sim.id,
                            weight=similarity_score,
                        )
                        session.add(edge_forward)
                        edges_in_batch.add(edge_forward_key)
                    
                    # Handle backward edge
                    if existing_backward:
                        # Update existing edge weight
                        existing_backward.weight = similarity_score
                        edges_in_batch.add(edge_backward_key)
                    elif edge_backward_key not in edges_in_batch:
                        # Create new backward edge only if not already created in this batch
                        edge_backward = MemoryEdge(
                            source_id=sim.id,
                            target_id=memory.id,
                            weight=similarity_score,
                        )
                        session.add(edge_backward)
                        edges_in_batch.add(edge_backward_key)
                    
                    # Add/update in-memory graph
                    self.graph_store.add_similarity_edge(
                        memory.id,
                        sim.id,
                        similarity_score,
                    )
            
            session.commit()
            
            # Expunge all memories
            for memory in memories:
                _ = memory.id
                _ = memory.text
                session.expunge(memory)
            
            return memories
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in batch add: {e}")
            raise
        finally:
            session.close()

    def get_memory(self, memory_id: int) -> Optional[Memory]:
        """
        Retrieve a memory by its ID.
        
        Args:
            memory_id: The ID of the memory to retrieve
            
        Returns:
            The Memory object if found, None otherwise
        """
        session = self._get_session()
        try:
            memory = session.get(Memory, memory_id)
            if memory:
                # Ensure all attributes are loaded before closing session
                _ = memory.id
                _ = memory.text
                _ = memory.embedding
                _ = memory.created_at
                _ = memory.category
                _ = memory.source
                session.expunge(memory)
            return memory
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving memory {memory_id}: {e}")
            raise
        finally:
            session.close()

    def delete_memory(self, memory_id: int) -> bool:
        """
        Delete a memory and all its edges.
        
        Args:
            memory_id: The ID of the memory to delete
            
        Returns:
            True if deleted, False if not found
        """
        session = self._get_session()
        try:
            memory = session.get(Memory, memory_id)
            if not memory:
                logger.warning(f"Memory {memory_id} not found for deletion")
                return False
            
            session.delete(memory)
            session.commit()
            
            # Remove from graph
            self.graph_store.remove_memory_node(memory_id)
            
            logger.info(f"Deleted memory {memory_id}")
            return True
            
        except SQLAlchemyError as e:
            logger.error(f"Database error deleting memory {memory_id}: {e}")
            raise
        finally:
            session.close()

    def update_memory(
        self,
        memory_id: int,
        text: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
    ) -> Optional[Memory]:
        """
        Update a memory's content and/or metadata.
        If text is updated, embeddings and edges are recalculated.
        
        Args:
            memory_id: The ID of the memory to update
            text: New text content (triggers embedding recalculation)
            category: New category
            source: New source
            
        Returns:
            The updated Memory object, or None if not found
        """
        session = self._get_session()
        try:
            memory = session.get(Memory, memory_id)
            if not memory:
                logger.warning(f"Memory {memory_id} not found for update")
                return None
            
            # Update metadata
            if category is not None:
                memory.category = category
            if source is not None:
                memory.source = source
            
            # If text changed, recalculate embedding and edges
            if text is not None and text.strip() != memory.text:
                text = text.strip()
                if not text:
                    raise ValueError("Memory text cannot be empty")
                
                memory.text = text
                
                # Generate new embedding
                try:
                    embedding = self.embedding_generator.generate_embedding(text)
                    memory.embedding = embedding
                except Exception as e:
                    logger.error(f"Failed to generate embedding for update: {e}")
                    raise
                
                # Delete old edges
                session.execute(
                    delete(MemoryEdge).where(
                        (MemoryEdge.source_id == memory_id) | (MemoryEdge.target_id == memory_id)
                    )
                )
                
                # Recreate edges
                similar_memories = self._get_similar_memories_by_embedding(
                    session=session,
                    embedding=embedding,
                    limit=self.max_similar_connections,
                    exclude_id=memory_id,
                )
                
                for sim in similar_memories:
                    similarity_score = self._calculate_cosine_similarity(
                        embedding_a=embedding,
                        embedding_b=sim.embedding,
                    )
                    
                    if similarity_score < self.similarity_threshold:
                        continue
                    
                    # Check if edges already exist
                    existing_forward = session.get(MemoryEdge, (memory_id, sim.id))
                    existing_backward = session.get(MemoryEdge, (sim.id, memory_id))
                    
                    if existing_forward:
                        # Update existing edge weight
                        existing_forward.weight = similarity_score
                    else:
                        # Create new forward edge
                        edge_forward = MemoryEdge(
                            source_id=memory_id,
                            target_id=sim.id,
                            weight=similarity_score,
                        )
                        session.add(edge_forward)
                    
                    if existing_backward:
                        # Update existing edge weight
                        existing_backward.weight = similarity_score
                    else:
                        # Create new backward edge
                        edge_backward = MemoryEdge(
                            source_id=sim.id,
                            target_id=memory_id,
                            weight=similarity_score,
                        )
                        session.add(edge_backward)
            
            session.commit()
            session.refresh(memory)
            
            # Reload graph if text changed
            if text is not None:
                self.graph_store.load_from_database(session)
            
            logger.info(f"Updated memory {memory_id}")
            
            # Expunge before returning
            _ = memory.id
            _ = memory.text
            session.expunge(memory)
            
            return memory
            
        except SQLAlchemyError as e:
            logger.error(f"Database error updating memory {memory_id}: {e}")
            raise
        finally:
            session.close()

    def get_all_memories(
        self,
        limit: Optional[int] = None,
        offset: int = 0,
        category: Optional[str] = None,
    ) -> List[Memory]:
        """
        Retrieve all memories with optional filtering and pagination.
        
        Args:
            limit: Maximum number of memories to return
            offset: Number of memories to skip
            category: Filter by category
            
        Returns:
            List of Memory objects
        """
        session = self._get_session()
        try:
            stmt = select(Memory).order_by(Memory.created_at.desc())
            
            if category:
                stmt = stmt.where(Memory.category == category)
            
            if offset:
                stmt = stmt.offset(offset)
            
            if limit:
                stmt = stmt.limit(limit)
            
            memories = session.execute(stmt).scalars().all()
            
            # Expunge all
            for memory in memories:
                _ = memory.id
                _ = memory.text
                session.expunge(memory)
            
            return memories
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving memories: {e}")
            raise
        finally:
            session.close()

    def count_memories(self, category: Optional[str] = None) -> int:
        """
        Count total number of memories.
        
        Args:
            category: Optional category filter
            
        Returns:
            Number of memories
        """
        session = self._get_session()
        try:
            stmt = select(func.count(Memory.id))
            
            if category:
                stmt = stmt.where(Memory.category == category)
            
            count = session.execute(stmt).scalar()
            return count or 0
            
        except SQLAlchemyError as e:
            logger.error(f"Database error counting memories: {e}")
            raise
        finally:
            session.close()

    # -------- Similarity search --------

    def _get_similar_memories_by_embedding(
        self,
        session: Session,
        embedding: List[float],
        limit: int = 5,
        exclude_id: Optional[int] = None,
        category: Optional[str] = None,
        min_similarity: Optional[float] = None,
    ) -> List[Memory]:
        """
        Find similar memories using cosine distance.
        
        Args:
            session: Database session
            embedding: Query embedding vector
            limit: Maximum number of results
            exclude_id: Memory ID to exclude from results
            category: Filter by category
            min_similarity: Minimum similarity threshold (0.0 to 1.0)
            
        Returns:
            List of similar Memory objects
        """
        # Use cosine distance operator for better semantic search
        distance_expr = Memory.embedding.op("<=>")(embedding)

        stmt = select(Memory).order_by(distance_expr)
        
        if category:
            stmt = stmt.where(Memory.category == category)
        
        # Request extra to account for exclusion
        stmt = stmt.limit(limit + (1 if exclude_id is not None else 0))

        results = session.execute(stmt).scalars().all()

        # Filter out excluded ID
        if exclude_id is not None:
            results = [m for m in results if m.id != exclude_id]

        # Apply similarity threshold if specified
        if min_similarity is not None:
            filtered_results = []
            for memory in results:
                similarity = self._calculate_cosine_similarity(embedding, memory.embedding)
                if similarity >= min_similarity:
                    filtered_results.append(memory)
            results = filtered_results

        return results[:limit]

    def search_similar_by_text(
        self,
        query_text: str,
        limit: int = 5,
        category: Optional[str] = None,
        min_similarity: Optional[float] = None,
    ) -> List[Tuple[Memory, float]]:
        """
        Search for memories similar to the query text.
        
        Args:
            query_text: The text to search for
            limit: Maximum number of results
            category: Filter by category
            min_similarity: Minimum similarity threshold (0.0 to 1.0)
            
        Returns:
            List of (Memory, similarity_score) tuples, sorted by similarity descending
        """
        if not query_text or not query_text.strip():
            raise ValueError("Query text cannot be empty")
        
        try:
            embedding = self.embedding_generator.generate_embedding(query_text.strip())
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            raise

        session = self._get_session()
        try:
            memories = self._get_similar_memories_by_embedding(
                session=session,
                embedding=embedding,
                limit=limit,
                category=category,
                min_similarity=min_similarity,
            )
            
            # Calculate similarity scores
            results = []
            for memory in memories:
                similarity = self._calculate_cosine_similarity(embedding, memory.embedding)
                results.append((memory, similarity))
                
                # Ensure all attributes are loaded before closing session
                _ = memory.id
                _ = memory.text
                _ = memory.embedding
                _ = memory.created_at
                _ = memory.category
                session.expunge(memory)
            
            # Sort by similarity descending
            results.sort(key=lambda x: x[1], reverse=True)
            
            logger.info(f"Found {len(results)} similar memories for query")
            return results
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in similarity search: {e}")
            raise
        finally:
            session.close()

    def search_by_category(self, category: str, limit: Optional[int] = None) -> List[Memory]:
        """
        Search memories by category.
        
        Args:
            category: The category to search for
            limit: Maximum number of results
            
        Returns:
            List of Memory objects
        """
        return self.get_all_memories(limit=limit, category=category)

    # -------- Graph-level operations --------

    def _calculate_cosine_similarity(
        self,
        embedding_a: List[float],
        embedding_b: List[float],
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.
        Returns a value between 0.0 (completely dissimilar) and 1.0 (identical).
        
        Args:
            embedding_a: First embedding vector
            embedding_b: Second embedding vector
            
        Returns:
            Cosine similarity score (0.0 to 1.0)
        """
        va = np.array(embedding_a, dtype=float)
        vb = np.array(embedding_b, dtype=float)

        # Calculate cosine similarity
        denom = (np.linalg.norm(va) * np.linalg.norm(vb))
        if denom == 0:
            return 0.0
        
        cos_sim = float(np.dot(va, vb) / denom)

        # Normalize to 0-1 range (cosine similarity is -1 to 1)
        normalized = (cos_sim + 1.0) / 2.0
        return max(0.0, min(1.0, normalized))

    def get_memory_neighbors(
        self,
        memory_id: int,
        limit: int = 5,
    ) -> List[Tuple[int, float]]:
        """
        Get the most similar neighbors of a memory from the graph.
        
        Args:
            memory_id: The memory to find neighbors for
            limit: Maximum number of neighbors to return
            
        Returns:
            List of (neighbor_id, similarity_score) tuples
        """
        return self.graph_store.get_neighbors(memory_id, limit=limit)

    def get_memory_cluster(self, memory_id: int) -> List[int]:
        """
        Get all memories in the same connected component as the given memory.
        Useful for finding clusters of related memories.
        
        Args:
            memory_id: The memory to find cluster for
            
        Returns:
            List of memory IDs in the same cluster
        """
        component = self.graph_store.get_connected_component(memory_id)
        return list(component)

    def find_path_between_memories(
        self,
        source_id: int,
        target_id: int,
    ) -> Optional[List[Memory]]:
        """
        Find the shortest path between two memories in the similarity graph.
        
        Args:
            source_id: Starting memory ID
            target_id: Target memory ID
            
        Returns:
            List of Memory objects representing the path, or None if no path exists
        """
        path_ids = self.graph_store.get_shortest_path(source_id, target_id)
        
        if not path_ids:
            return None
        
        # Fetch all memories in the path
        session = self._get_session()
        try:
            memories = []
            for memory_id in path_ids:
                memory = session.get(Memory, memory_id)
                if memory:
                    _ = memory.id
                    _ = memory.text
                    session.expunge(memory)
                    memories.append(memory)
            
            return memories
            
        except SQLAlchemyError as e:
            logger.error(f"Database error finding path: {e}")
            raise
        finally:
            session.close()

    def get_graph_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the memory graph.
        
        Returns:
            Dictionary with graph statistics
        """
        graph_stats = self.graph_store.get_graph_stats()
        
        session = self._get_session()
        try:
            total_memories = session.execute(select(func.count(Memory.id))).scalar() or 0
            total_edges = session.execute(select(func.count(MemoryEdge.source_id))).scalar() or 0
            
            # Get category distribution
            category_counts = session.execute(
                select(Memory.category, func.count(Memory.id))
                .group_by(Memory.category)
            ).all()
            
            return {
                "total_memories": total_memories,
                "total_edges": total_edges,
                "graph_nodes": graph_stats["nodes"],
                "graph_edges": graph_stats["edges"],
                "connected_components": graph_stats["connected_components"],
                "average_degree": graph_stats["average_degree"],
                "graph_density": graph_stats["density"],
                "categories": {cat or "uncategorized": count for cat, count in category_counts},
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Database error getting statistics: {e}")
            raise
        finally:
            session.close()

    def export_graph_json(
        self,
        max_nodes: int = 500,
        category: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Export the memory graph as JSON for visualization.
        
        Args:
            max_nodes: Maximum number of nodes to include
            category: Optional category filter
            
        Returns:
            Dictionary with 'nodes' and 'edges' lists
        """
        session = self._get_session()
        try:
            stmt = select(Memory.id, Memory.text, Memory.category).order_by(Memory.id)
            
            if category:
                stmt = stmt.where(Memory.category == category)
            
            stmt = stmt.limit(max_nodes)
            
            rows = session.execute(stmt).all()
            node_ids = {row.id for row in rows}

            nodes = [
                {
                    "id": row.id,
                    "label": (row.text[:80] + "...") if len(row.text) > 80 else row.text,
                    "category": row.category,
                }
                for row in rows
            ]

            edges_rows = session.execute(
                select(MemoryEdge.source_id, MemoryEdge.target_id, MemoryEdge.weight)
                .where(MemoryEdge.source_id.in_(node_ids))
                .where(MemoryEdge.target_id.in_(node_ids))
                .order_by(MemoryEdge.weight.desc())
            ).all()

            # Filter duplicate edges (keep only one direction per pair)
            # Since edges are bidirectional, we only need source_id < target_id
            seen_pairs = set()
            edges = []
            
            for row in edges_rows:
                # Create a normalized pair (smaller id first)
                pair = tuple(sorted([row.source_id, row.target_id]))
                
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    edges.append({
                        "source": row.source_id,
                        "target": row.target_id,
                        "weight": row.weight,
                    })

            logger.info(f"Exported graph: {len(nodes)} nodes, {len(edges)} edges")

            return {
                "nodes": nodes,
                "edges": edges,
                "metadata": {
                    "total_nodes": len(nodes),
                    "total_edges": len(edges),
                    "category": category,
                },
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Database error exporting graph: {e}")
            raise
        finally:
            session.close()

    def rebuild_graph(self):
        """
        Rebuild the entire in-memory graph from the database.
        Useful after manual database modifications.
        """
        session = self._get_session()
        try:
            self.graph_store.clear()
            self.graph_store.load_from_database(session)
            logger.info("Graph rebuilt from database")
        except SQLAlchemyError as e:
            logger.error(f"Database error rebuilding graph: {e}")
            raise
        finally:
            session.close()

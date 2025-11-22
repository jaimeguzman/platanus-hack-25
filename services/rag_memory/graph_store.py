from typing import List, Tuple
import networkx as nx


class MemoryGraphStore:
    """
    In-memory graph of memories.
    Nodes = memory ids
    Edges = similarity relationships (weight = similarity score 0..1)
    """

    def __init__(self):
        self.graph = nx.Graph()

    def add_memory_node(self, memory_id: int):
        self.graph.add_node(memory_id)

    def add_similarity_edge(self, memory_a_id: int, memory_b_id: int, score: float):
        self.graph.add_edge(memory_a_id, memory_b_id, weight=score)

    def get_neighbors(self, memory_id: int, limit: int = 5) -> List[Tuple[int, float]]:
        if memory_id not in self.graph:
            return []

        neighbors = self.graph[memory_id].items()
        sorted_neighbors = sorted(
            neighbors,
            key=lambda item: item[1].get("weight", 0.0),
            reverse=True,
        )

        return [
            (neighbor_id, data.get("weight", 0.0))
            for neighbor_id, data in sorted_neighbors[:limit]
        ]

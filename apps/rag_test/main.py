import sys
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()


# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from services.rag_memory import RagMemoryService


def main():
    service = RagMemoryService(auto_create_schema=False)

    m1 = service.add_memory("I like building RAG systems in Python.")
    m2 = service.add_memory("RAG systems use embeddings, vector databases, and graphs.")
    m3 = service.add_memory("Sometimes I also build projects with JavaScript and PHP.")

    print("Memories created:", m1.id, m2.id, m3.id)

    similar = service.search_similar_by_text(
        "I love Python hackathon projects.",
        limit=3,
    )
    print("Similar to query:")
    for mem in similar:
        print(mem.id, "->", mem.text)

    graph_json = service.export_graph_json(max_nodes=100)
    print("Graph JSON:", graph_json)


if __name__ == "__main__":
    main()

"""
Advanced usage examples for RAG Memory Service.
Demonstrates real-world use cases and patterns.
"""
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from services.rag_memory import RagMemoryService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def example_knowledge_base():
    """
    Example: Building a knowledge base with categorized information.
    """
    logger.info("=== Knowledge Base Example ===")
    
    service = RagMemoryService(
        auto_create_schema=False,
        similarity_threshold=0.75,
        max_similar_connections=10,
    )
    
    # Add programming knowledge
    programming_facts = [
        "Python is a high-level, interpreted programming language.",
        "JavaScript is the language of the web, running in browsers.",
        "Rust provides memory safety without garbage collection.",
        "Go is designed for concurrent programming and scalability.",
        "TypeScript adds static typing to JavaScript.",
    ]
    
    service.add_memories_batch(
        texts=programming_facts,
        categories=["programming"] * len(programming_facts),
        sources=["documentation"] * len(programming_facts),
    )
    
    # Add database knowledge
    database_facts = [
        "PostgreSQL is a powerful open-source relational database.",
        "MongoDB is a document-oriented NoSQL database.",
        "Redis is an in-memory data structure store.",
        "Elasticsearch is a distributed search and analytics engine.",
    ]
    
    service.add_memories_batch(
        texts=database_facts,
        categories=["databases"] * len(database_facts),
        sources=["documentation"] * len(database_facts),
    )
    
    # Query the knowledge base
    query = "What database should I use for caching?"
    results = service.search_similar_by_text(query, limit=3)
    
    logger.info(f"\nQuery: {query}")
    logger.info("Results:")
    for memory, score in results:
        logger.info(f"  [{score:.3f}] {memory.text}")
    
    # Get statistics by category
    stats = service.get_graph_statistics()
    logger.info(f"\nKnowledge base statistics:")
    logger.info(f"  Total memories: {stats['total_memories']}")
    logger.info(f"  Categories: {stats['categories']}")


def example_conversation_memory():
    """
    Example: Storing and retrieving conversation history.
    """
    logger.info("\n=== Conversation Memory Example ===")
    
    service = RagMemoryService(
        auto_create_schema=False,
        similarity_threshold=0.6,  # Lower threshold for conversations
    )
    
    # Simulate a conversation
    conversation = [
        ("user", "I'm interested in learning machine learning"),
        ("assistant", "Great! Machine learning is about training models on data."),
        ("user", "What programming language should I use?"),
        ("assistant", "Python is the most popular choice for ML with libraries like TensorFlow and PyTorch."),
        ("user", "Can you recommend some resources?"),
        ("assistant", "Check out Andrew Ng's course on Coursera and the FastAI course."),
    ]
    
    # Store conversation turns
    for speaker, text in conversation:
        service.add_memory(
            text=f"{speaker}: {text}",
            category="conversation",
            source="chat_session_123",
        )
    
    # Retrieve relevant context for a new question
    new_question = "What was recommended for learning ML?"
    results = service.search_similar_by_text(
        new_question,
        limit=3,
        category="conversation",
    )
    
    logger.info(f"\nNew question: {new_question}")
    logger.info("Relevant conversation context:")
    for memory, score in results:
        logger.info(f"  [{score:.3f}] {memory.text}")


def example_document_clustering():
    """
    Example: Clustering related documents/memories.
    """
    logger.info("\n=== Document Clustering Example ===")
    
    service = RagMemoryService(
        auto_create_schema=False,
        similarity_threshold=0.7,
    )
    
    # Add documents from different topics
    documents = [
        # AI/ML cluster
        ("Neural networks are inspired by biological neurons.", "ai"),
        ("Deep learning uses multiple layers of neural networks.", "ai"),
        ("Transformers revolutionized natural language processing.", "ai"),
        
        # Web development cluster
        ("React is a popular JavaScript library for building UIs.", "webdev"),
        ("Next.js is a React framework for production.", "webdev"),
        ("Tailwind CSS is a utility-first CSS framework.", "webdev"),
        
        # DevOps cluster
        ("Docker containers package applications with dependencies.", "devops"),
        ("Kubernetes orchestrates containerized applications.", "devops"),
        ("CI/CD automates software deployment pipelines.", "devops"),
    ]
    
    memory_ids = []
    for text, category in documents:
        memory = service.add_memory(text, category=category)
        memory_ids.append(memory.id)
    
    # Analyze clusters
    logger.info("\nCluster analysis:")
    for memory_id in memory_ids[:3]:  # Check first few
        cluster = service.get_memory_cluster(memory_id)
        memory = service.get_memory(memory_id)
        logger.info(f"\nMemory {memory_id} ({memory.category}): '{memory.text[:40]}...'")
        logger.info(f"  Cluster size: {len(cluster)} memories")
        logger.info(f"  Cluster members: {cluster}")


def example_semantic_navigation():
    """
    Example: Navigate between related concepts using the graph.
    """
    logger.info("\n=== Semantic Navigation Example ===")
    
    service = RagMemoryService(
        auto_create_schema=False,
        similarity_threshold=0.65,
    )
    
    # Create a chain of related concepts
    concepts = [
        "Programming is the process of writing computer code.",
        "Code is written in programming languages like Python.",
        "Python is popular for data science and machine learning.",
        "Machine learning trains models to make predictions.",
        "Predictions are made using trained neural networks.",
        "Neural networks are inspired by the human brain.",
        "The brain processes information through neurons.",
    ]
    
    concept_ids = []
    for concept in concepts:
        memory = service.add_memory(concept, category="concepts")
        concept_ids.append(memory.id)
    
    # Find path between distant concepts
    start_id = concept_ids[0]  # "Programming"
    end_id = concept_ids[-1]   # "The brain"
    
    path = service.find_path_between_memories(start_id, end_id)
    
    if path:
        logger.info(f"\nPath from concept {start_id} to {end_id}:")
        for i, memory in enumerate(path):
            logger.info(f"  {i+1}. {memory.text}")
    else:
        logger.info("No path found between concepts")
    
    # Show neighbors of a concept
    middle_id = concept_ids[len(concept_ids)//2]
    neighbors = service.get_memory_neighbors(middle_id, limit=3)
    
    logger.info(f"\nNeighbors of memory {middle_id}:")
    for neighbor_id, similarity in neighbors:
        neighbor = service.get_memory(neighbor_id)
        logger.info(f"  [{similarity:.3f}] {neighbor.text[:50]}...")


def example_memory_updates():
    """
    Example: Updating memories and seeing how relationships change.
    """
    logger.info("\n=== Memory Updates Example ===")
    
    service = RagMemoryService(
        auto_create_schema=False,
        similarity_threshold=0.7,
    )
    
    # Create initial memory
    memory = service.add_memory(
        "Python is a programming language.",
        category="draft"
    )
    
    logger.info(f"Created memory {memory.id}: {memory.text}")
    
    # Get initial neighbors
    neighbors_before = service.get_memory_neighbors(memory.id, limit=3)
    logger.info(f"Neighbors before update: {len(neighbors_before)}")
    
    # Update with more detailed content
    updated = service.update_memory(
        memory.id,
        text="Python is a versatile programming language used for web development, data science, machine learning, and automation.",
        category="complete"
    )
    
    logger.info(f"\nUpdated memory {updated.id}: {updated.text}")
    
    # Get new neighbors (should be different due to new embedding)
    neighbors_after = service.get_memory_neighbors(memory.id, limit=3)
    logger.info(f"Neighbors after update: {len(neighbors_after)}")
    
    if neighbors_after:
        logger.info("New neighbors:")
        for neighbor_id, similarity in neighbors_after:
            neighbor = service.get_memory(neighbor_id)
            logger.info(f"  [{similarity:.3f}] {neighbor.text[:50]}...")


def example_graph_visualization_data():
    """
    Example: Export graph data for visualization.
    """
    logger.info("\n=== Graph Visualization Example ===")
    
    service = RagMemoryService(auto_create_schema=False)
    
    # Export graph for visualization
    graph_data = service.export_graph_json(max_nodes=50)
    
    logger.info(f"\nGraph export:")
    logger.info(f"  Nodes: {len(graph_data['nodes'])}")
    logger.info(f"  Edges: {len(graph_data['edges'])}")
    logger.info(f"  Metadata: {graph_data['metadata']}")
    
    # Show sample nodes
    logger.info("\nSample nodes:")
    for node in graph_data['nodes'][:3]:
        logger.info(f"  ID {node['id']}: {node['label']}")
    
    # Show sample edges
    logger.info("\nSample edges:")
    for edge in graph_data['edges'][:3]:
        logger.info(f"  {edge['source']} -> {edge['target']} (weight: {edge['weight']:.3f})")
    
    # Get detailed statistics
    stats = service.get_graph_statistics()
    logger.info(f"\nGraph statistics:")
    logger.info(f"  Total memories: {stats['total_memories']}")
    logger.info(f"  Total edges: {stats['total_edges']}")
    logger.info(f"  Connected components: {stats['connected_components']}")
    logger.info(f"  Average degree: {stats['average_degree']:.2f}")
    logger.info(f"  Graph density: {stats['graph_density']:.4f}")


def main():
    """Run all advanced examples."""
    try:
        example_knowledge_base()
        example_conversation_memory()
        example_document_clustering()
        example_semantic_navigation()
        example_memory_updates()
        example_graph_visualization_data()
        
        logger.info("\n=== All Advanced Examples Completed ===")
        
    except Exception as e:
        logger.error(f"Example failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()


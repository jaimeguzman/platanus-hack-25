"""
Create sample data for RAG Memory Service visualization.
Populates the database with interesting interconnected memories.
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


def create_programming_memories(service: RagMemoryService):
    """Create memories about programming languages and concepts."""
    logger.info("Creating programming memories...")
    
    memories = [
        "Python is a high-level, interpreted programming language known for its simplicity.",
        "JavaScript is the language of the web, running in browsers and servers via Node.js.",
        "TypeScript adds static typing to JavaScript, making code more maintainable.",
        "Rust provides memory safety without garbage collection through ownership.",
        "Go is designed for concurrent programming and scalability at Google.",
        "Java is a class-based, object-oriented language that runs on the JVM.",
        "C++ is a powerful systems programming language with manual memory management.",
        "Swift is Apple's modern language for iOS and macOS development.",
        "Kotlin is a modern language for Android development, interoperable with Java.",
        "Ruby is known for its elegant syntax and the Rails web framework.",
    ]
    
    service.add_memories_batch(
        texts=memories,
        categories=["programming"] * len(memories),
        sources=["documentation"] * len(memories)
    )


def create_ai_ml_memories(service: RagMemoryService):
    """Create memories about AI and machine learning."""
    logger.info("Creating AI/ML memories...")
    
    memories = [
        "Machine learning is a subset of AI that learns patterns from data.",
        "Deep learning uses neural networks with multiple layers for complex tasks.",
        "Neural networks are inspired by biological neurons in the human brain.",
        "Transformers revolutionized NLP with attention mechanisms.",
        "GPT models use transformer architecture for text generation.",
        "BERT is a bidirectional transformer model for understanding context.",
        "Convolutional Neural Networks (CNNs) excel at image recognition.",
        "Recurrent Neural Networks (RNNs) process sequential data like text.",
        "Reinforcement learning trains agents through rewards and penalties.",
        "Transfer learning reuses pre-trained models for new tasks.",
        "Embeddings represent words or concepts as dense vectors.",
        "Vector databases enable fast similarity search for embeddings.",
        "RAG combines retrieval and generation for better AI responses.",
        "Fine-tuning adapts pre-trained models to specific domains.",
        "Prompt engineering optimizes inputs for language models.",
    ]
    
    service.add_memories_batch(
        texts=memories,
        categories=["ai"] * len(memories),
        sources=["research"] * len(memories)
    )


def create_database_memories(service: RagMemoryService):
    """Create memories about databases."""
    logger.info("Creating database memories...")
    
    memories = [
        "PostgreSQL is a powerful open-source relational database with ACID compliance.",
        "MySQL is a popular open-source relational database management system.",
        "MongoDB is a document-oriented NoSQL database for flexible schemas.",
        "Redis is an in-memory data structure store used for caching.",
        "Elasticsearch is a distributed search and analytics engine.",
        "SQLite is a lightweight embedded database for local storage.",
        "Cassandra is a distributed NoSQL database for high availability.",
        "DynamoDB is AWS's managed NoSQL database service.",
        "Neo4j is a graph database for connected data relationships.",
        "Vector databases like pgvector enable semantic search.",
    ]
    
    service.add_memories_batch(
        texts=memories,
        categories=["databases"] * len(memories),
        sources=["documentation"] * len(memories)
    )


def create_web_development_memories(service: RagMemoryService):
    """Create memories about web development."""
    logger.info("Creating web development memories...")
    
    memories = [
        "React is a JavaScript library for building user interfaces.",
        "Vue.js is a progressive framework for building web applications.",
        "Angular is a comprehensive framework by Google for web apps.",
        "Next.js is a React framework with server-side rendering.",
        "Svelte compiles components to efficient vanilla JavaScript.",
        "Tailwind CSS is a utility-first CSS framework.",
        "GraphQL is a query language for APIs with precise data fetching.",
        "REST APIs use HTTP methods for CRUD operations.",
        "WebSockets enable real-time bidirectional communication.",
        "Progressive Web Apps (PWAs) work offline and feel native.",
    ]
    
    service.add_memories_batch(
        texts=memories,
        categories=["webdev"] * len(memories),
        sources=["documentation"] * len(memories)
    )


def create_devops_memories(service: RagMemoryService):
    """Create memories about DevOps and infrastructure."""
    logger.info("Creating DevOps memories...")
    
    memories = [
        "Docker containers package applications with their dependencies.",
        "Kubernetes orchestrates containerized applications at scale.",
        "CI/CD pipelines automate testing and deployment processes.",
        "GitHub Actions provides CI/CD integrated with Git repositories.",
        "Terraform enables infrastructure as code for cloud resources.",
        "Ansible automates configuration management and deployment.",
        "Prometheus monitors systems and collects metrics.",
        "Grafana visualizes metrics and creates dashboards.",
        "Load balancers distribute traffic across multiple servers.",
        "Microservices architecture splits applications into small services.",
    ]
    
    service.add_memories_batch(
        texts=memories,
        categories=["devops"] * len(memories),
        sources=["documentation"] * len(memories)
    )


def create_data_science_memories(service: RagMemoryService):
    """Create memories about data science."""
    logger.info("Creating data science memories...")
    
    memories = [
        "Pandas is a Python library for data manipulation and analysis.",
        "NumPy provides support for large multi-dimensional arrays.",
        "Matplotlib creates static, animated, and interactive visualizations.",
        "Scikit-learn offers machine learning algorithms for Python.",
        "Jupyter notebooks enable interactive data analysis.",
        "Data cleaning prepares raw data for analysis.",
        "Feature engineering creates informative input variables.",
        "Cross-validation evaluates model performance reliably.",
        "A/B testing compares two versions to determine which performs better.",
        "Statistical significance determines if results are meaningful.",
    ]
    
    service.add_memories_batch(
        texts=memories,
        categories=["datascience"] * len(memories),
        sources=["documentation"] * len(memories)
    )


def create_security_memories(service: RagMemoryService):
    """Create memories about security."""
    logger.info("Creating security memories...")
    
    memories = [
        "Encryption protects data by converting it into unreadable format.",
        "HTTPS secures web communication with SSL/TLS certificates.",
        "OAuth 2.0 is an authorization framework for secure API access.",
        "JWT tokens authenticate users in stateless applications.",
        "SQL injection attacks exploit database vulnerabilities.",
        "Cross-Site Scripting (XSS) injects malicious scripts.",
        "CSRF attacks trick users into unwanted actions.",
        "Password hashing uses algorithms like bcrypt for security.",
        "Two-factor authentication adds extra security layer.",
        "Zero-trust security assumes no implicit trust.",
    ]
    
    service.add_memories_batch(
        texts=memories,
        categories=["security"] * len(memories),
        sources=["documentation"] * len(memories)
    )


def main():
    """Create all sample data."""
    logger.info("🚀 Starting sample data creation...")
    
    service = RagMemoryService(
        auto_create_schema=False,
        similarity_threshold=0.65,  # Lower threshold for more connections
        max_similar_connections=8,  # More connections for interesting graph
        load_graph=True,
    )
    
    # Create different categories of memories
    create_programming_memories(service)
    create_ai_ml_memories(service)
    create_database_memories(service)
    create_web_development_memories(service)
    create_devops_memories(service)
    create_data_science_memories(service)
    create_security_memories(service)
    
    # Get final statistics
    stats = service.get_graph_statistics()
    
    logger.info("\n" + "="*60)
    logger.info("✅ Sample data creation complete!")
    logger.info("="*60)
    logger.info(f"📊 Total memories: {stats['total_memories']}")
    logger.info(f"🔗 Total edges: {stats['total_edges']}")
    logger.info(f"🌐 Connected components: {stats['connected_components']}")
    logger.info(f"📈 Average degree: {stats['average_degree']:.2f}")
    logger.info(f"📉 Graph density: {stats['graph_density']:.4f}")
    logger.info(f"\n📁 Categories:")
    for category, count in stats['categories'].items():
        logger.info(f"   • {category}: {count} memories")
    logger.info("="*60)
    logger.info("\n💡 Next step: Run visualize_graph.py to create the visualization!")


if __name__ == "__main__":
    main()


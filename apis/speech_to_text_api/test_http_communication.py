#!/usr/bin/env python3
"""
Test script to verify HTTP communication between Speech-to-Text and RAG services.
"""
import asyncio
import httpx
import json
import sys
import os

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from transcription_service import TranscriptionService
from config import config

async def test_rag_service_connection():
    """Test if RAG service is accessible."""
    print(f"Testing connection to RAG service at: {config.rag_service_url}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{config.rag_service_url}/health")
            response.raise_for_status()
            print("✅ RAG service is accessible")
            print(f"Response: {response.json()}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to RAG service: {e}")
            return False

async def test_add_memory():
    """Test adding a memory via HTTP."""
    print("\nTesting memory creation via HTTP...")
    
    service = TranscriptionService()
    
    try:
        memory = await service._add_memory_via_http(
            text="This is a test transcription from HTTP communication",
            category="test_transcription",
            source="test_http_communication.py"
        )
        print("✅ Memory created successfully")
        print(f"Memory ID: {memory['id']}")
        print(f"Memory text: {memory['text']}")
        return memory['id']
    except Exception as e:
        print(f"❌ Failed to create memory: {e}")
        return None

async def test_get_memory(memory_id):
    """Test retrieving a memory via HTTP."""
    print(f"\nTesting memory retrieval via HTTP (ID: {memory_id})...")
    
    service = TranscriptionService()
    
    try:
        memory = await service._get_memory_via_http(memory_id)
        if memory:
            print("✅ Memory retrieved successfully")
            print(f"Memory: {json.dumps(memory, indent=2)}")
            return True
        else:
            print("❌ Memory not found")
            return False
    except Exception as e:
        print(f"❌ Failed to retrieve memory: {e}")
        return False

async def test_search_memories():
    """Test searching memories via HTTP."""
    print("\nTesting memory search via HTTP...")
    
    service = TranscriptionService()
    
    try:
        results = await service._search_memories_via_http(
            query="test transcription",
            limit=5,
            category="test_transcription"
        )
        print(f"✅ Search completed, found {len(results)} results")
        for i, (memory, score) in enumerate(results):
            print(f"  Result {i+1}: Score {score:.3f} - {memory['text'][:50]}...")
        return True
    except Exception as e:
        print(f"❌ Failed to search memories: {e}")
        return False

async def test_full_transcription_flow():
    """Test the full transcription flow (without actual audio)."""
    print("\nTesting full transcription service initialization...")
    
    try:
        service = TranscriptionService()
        print("✅ TranscriptionService initialized successfully")
        print(f"RAG Service URL: {service.rag_service_url}")
        print(f"ElevenLabs API URL: {service.elevenlabs_api_url}")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize TranscriptionService: {e}")
        return False

async def main():
    """Run all tests."""
    print("🧪 Testing HTTP Communication Between Services")
    print("=" * 50)
    
    # Test 1: RAG service connection
    rag_accessible = await test_rag_service_connection()
    if not rag_accessible:
        print("\n❌ Cannot proceed with tests - RAG service is not accessible")
        print("Make sure the RAG service is running on:", config.rag_service_url)
        return
    
    # Test 2: Service initialization
    service_init = await test_full_transcription_flow()
    if not service_init:
        return
    
    # Test 3: Add memory
    memory_id = await test_add_memory()
    if not memory_id:
        return
    
    # Test 4: Get memory
    memory_retrieved = await test_get_memory(memory_id)
    if not memory_retrieved:
        return
    
    # Test 5: Search memories
    search_success = await test_search_memories()
    
    print("\n" + "=" * 50)
    if search_success:
        print("🎉 All tests passed! HTTP communication is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    # Check if required environment variables are set
    if not config.elevenlabs_api_key:
        print("❌ ELEVENLABS_API_KEY environment variable is not set")
        print("This is required for the TranscriptionService to initialize")
        sys.exit(1)
    
    asyncio.run(main())

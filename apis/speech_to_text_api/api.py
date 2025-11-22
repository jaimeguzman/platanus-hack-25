"""
FastAPI application for Speech to Text Service.
Provides REST API endpoints for audio transcription using ElevenLabs.
"""
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl
import logging

from transcription_service import TranscriptionService
from config import config

# Configure logging
logging.basicConfig(level=getattr(logging, config.log_level))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Speech to Text Service API",
    description="API for transcribing audio files using ElevenLabs and storing in RAG memory",
    version="1.0.0",
)

# Configure CORS - completely open
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize transcription service
transcription_service = TranscriptionService()

# Pydantic models for request/response
class TranscriptionRequest(BaseModel):
    audio_url: str = Field(..., description="URL of the audio file to transcribe")
    category: Optional[str] = Field(None, description="Optional category for the memory")
    source: Optional[str] = Field(None, description="Optional source identifier")

class DirectTranscriptionRequest(BaseModel):
    audio_url: str = Field(..., description="URL of the audio file to transcribe")

class MemoryResponse(BaseModel):
    id: int
    text: str
    category: Optional[str]
    source: Optional[str]
    created_at: str

class TranscriptionResponse(BaseModel):
    transcription: Dict[str, Any] = Field(..., description="Raw transcription result from ElevenLabs")
    memory: MemoryResponse = Field(..., description="Created memory object")
    audio_url: str = Field(..., description="Original audio URL")

class DirectTranscriptionResponse(BaseModel):
    transcription: Dict[str, Any] = Field(..., description="Raw transcription result from ElevenLabs")
    audio_url: str = Field(..., description="Original audio URL")

class SearchResult(BaseModel):
    memory: MemoryResponse
    similarity_score: float

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "speech_to_text"}

# Transcription endpoints
@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(request: TranscriptionRequest):
    """
    Transcribe audio from URL and store in RAG memory.
    
    This endpoint:
    1. Downloads and transcribes the audio using ElevenLabs API
    2. Stores the transcription in the RAG memory system
    3. Returns both the transcription and memory details
    """
    try:
        result = await transcription_service.transcribe_from_url(
            audio_url=request.audio_url,
            category=request.category,
            source=request.source,
            language_code="es",
            model_id="scribe_v1",
        )
        
        memory = result["memory"]
        memory_response = MemoryResponse(
            id=memory["id"],
            text=memory["text"],
            category=memory.get("category"),
            source=memory.get("source"),
            created_at=memory.get("created_at", ""),
        )
        
        return TranscriptionResponse(
            transcription=result["transcription"],
            memory=memory_response,
            audio_url=result["audio_url"],
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/transcribe/direct", response_model=DirectTranscriptionResponse)
async def transcribe_audio_direct(request: DirectTranscriptionRequest):
    """
    Transcribe audio from URL without storing in memory.
    
    This endpoint only transcribes the audio and returns the result
    without storing it in the RAG memory system.
    """
    try:
        transcription_result = await transcription_service.transcribe_from_url_direct(
            audio_url=request.audio_url,
        )
        
        return DirectTranscriptionResponse(
            transcription=transcription_result,
            audio_url=request.audio_url,
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error transcribing audio directly: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

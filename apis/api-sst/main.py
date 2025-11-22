import os
import tempfile
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        # Add your production domain when deployed
        # "https://your-app.amplifyapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)


@app.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    model: str = "whisper-1",
    language: Optional[str] = None,
):
    if file.content_type is None or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    tmp_path: Optional[str] = None

    try:
        suffix = ""
        if file.filename:
            from os.path import splitext

            _, ext = splitext(file.filename)
            suffix = ext or ""

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            data = await file.read()
            tmp.write(data)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            params = {"model": model, "file": audio_file}
            if language:
                params["language"] = language

            result = client.audio.transcriptions.create(**params)

        text = getattr(result, "text", None)
        if not text and isinstance(result, dict):
            text = result.get("text")

        if not text:
            raise HTTPException(status_code=500, detail="Transcription failed")

        return {"text": text}

    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


handler = Mangum(app)

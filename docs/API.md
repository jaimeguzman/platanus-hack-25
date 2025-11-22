# Speech-to-Text API Documentation

## Overview

FastAPI-based audio transcription service using OpenAI Whisper.

**Location**: `/apis/api-sst/`

## Endpoints

### POST /speech-to-text

Transcribe audio file to text.

#### Request
```
Method: POST
Content-Type: multipart/form-data

Parameters:
  file        (File)    : Audio file [REQUIRED]
  model       (string)  : Whisper model, default "whisper-1"
  language    (string)  : ISO 639-1 code (e.g., "en", "es")
```

#### Supported Audio Formats
- MP3, WAV, M4A, WEBM, FLAC, OGG
- Max size: 25 MB (OpenAI limit)
- Content-Type must start with `audio/`

#### Response (200 OK)
```json
{
  "text": "Transcribed text here..."
}
```

#### Error Responses
```json
{
  "detail": "Error message"
}
```

| Status | Reason |
|--------|--------|
| 400 | Invalid file, wrong content-type, >25MB |
| 500 | OpenAI API error, server error |

#### Example (cURL)
```bash
curl -X POST http://localhost:8000/speech-to-text \
  -F "file=@audio.mp3" \
  -F "language=es"
```

## Setup

### Prerequisites
- Python 3.9+
- OpenAI API key

### Installation

```bash
cd apis/api-sst
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### Environment

Create `.env`:
```
OPENAI_API_KEY=sk-proj-xxxxx...
```

Auto-create from template:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

## Development

### Start Server
```bash
./dev.sh
```

The script automatically:
- Checks Python installation
- Creates/activates venv
- Installs dependencies
- Creates .env from .env.example
- Starts hot-reload server

**Access**:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs (Swagger UI)
- ReDoc: http://localhost:8000/redoc

### Testing

```bash
./test-api.sh
```

Tests endpoint with sample audio file.

## Code Structure

```
api-sst/
├── main.py              # FastAPI app, endpoints, error handling
├── requirements.txt     # Dependencies
├── .env.example        # Environment template
├── .env                # [GITIGNORED] Secret keys
├── .gitignore          # Git ignore rules
├── dev.sh              # Dev server startup
├── test-api.sh         # Test script
├── README.md           # API documentation
└── venv/               # Python environment
```

## Implementation Details

### Error Handling
- Content-type validation
- File size check (>25MB rejected)
- Temporary file cleanup in finally block
- HTTPException with appropriate status codes
- Descriptive error messages

### File Processing
- Temporary files (`tempfile.NamedTemporaryFile`)
- Preserves original extension
- Automatic cleanup after transcription
- Prevents file handle leaks

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | >=0.110.0 | Web framework |
| uvicorn | >=0.24.0 | ASGI server |
| openai | >=1.0.0 | OpenAI client |
| python-multipart | >=0.0.6 | Form data parsing |
| python-dotenv | >=1.0.0 | .env loading |
| mangum | >=0.17.0 | AWS Lambda adapter |

## Deployment

### Local
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### AWS Lambda

Mangum handler configured in `main.py`:
```python
handler = Mangum(app)
```

Setup:
1. Install dependencies: `pip install -r requirements.txt -t package/`
2. Package: `zip -r function.zip package/ main.py`
3. Deploy to Lambda
4. API Gateway trigger for HTTP access
5. Environment variables: `OPENAI_API_KEY`

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY main.py .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build:
```bash
docker build -t api-sst .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-proj-... api-sst
```

## Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| OPENAI_API_KEY | OpenAI secret key | sk-proj-xxxxx... |

No other configuration needed for basic setup.

## Security

1. **API Key**: Stored in .env (never in code)
2. **File Validation**: Size + content-type checks
3. **Temp Files**: Automatic cleanup
4. **Error Messages**: Descriptive but safe
5. **CORS**: Add CORSMiddleware if needed

### CORS Configuration

Add if frontend is on different origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## API Response Examples

### Successful Transcription
```json
{
  "text": "This is a transcribed text from the audio file."
}
```

### Missing File
```json
{
  "detail": "No file provided"
}
```

### Invalid Format
```json
{
  "detail": "Invalid file format. Must be audio file."
}
```

### File Too Large
```json
{
  "detail": "File size exceeds 25 MB limit"
}
```

## Rate Limiting

Currently: **No rate limiting** (add if needed with slowapi)

## Monitoring

Add logging in production:
```python
import logging

logger = logging.getLogger(__name__)
logger.info(f"Transcribing file: {file.filename}")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| ModuleNotFoundError | Activate venv: `source venv/bin/activate` |
| OPENAI_API_KEY not found | Check .env file exists in api-sst/ directory |
| Port already in use | Change port: `uvicorn main:app --port 8001` |
| CORS errors | Add CORSMiddleware (see Security section) |
| File upload fails | Check max file size (25 MB limit) and content-type |

## Next Steps

1. Add authentication (API key, JWT)
2. Add request logging and monitoring
3. Implement rate limiting
4. Add metrics collection (processing time, usage)
5. Setup CI/CD pipeline
6. Add request validation middleware

---

**Frontend Integration**: See `docs/INTEGRATION.md`

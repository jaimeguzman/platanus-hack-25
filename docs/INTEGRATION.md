# Frontend-API Integration Guide

## Overview

Connecting `fe-webapp` (Next.js frontend) with `api-sst` (FastAPI backend) for real audio transcription.

**Status**: AudioTranscriber currently uses mock data
**Goal**: Real API integration
**Effort**: ~1-2 hours

## Architecture

```
┌──────────────────────┐
│  fe-webapp Frontend  │
│                      │
│  AudioTranscriber    │ ─────FormData──────┐
│  (React Component)   │     (multipart)    │
└──────────────────────┘                    │
                                            │
                                            ▼
┌────────────────────────────────┐
│   API Gateway / Load Balancer  │
└────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────┐
│      api-sst (FastAPI)         │
│  POST /speech-to-text          │
│  └─ OpenAI Whisper API         │
└────────────────────────────────┘
```

## Step-by-Step Integration

### Phase 1: Configure Environment

**Frontend** (`apps/fe-webapp/.env.local`):

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production (after deployment)
# NEXT_PUBLIC_API_URL=https://api-sst.yourdomain.com
```

**API** (`apis/api-sst/.env`):

```env
OPENAI_API_KEY=sk-proj-xxxxx...
```

### Phase 2: Update AudioTranscriber Component

**File**: `apps/fe-webapp/src/components/notes/AudioTranscriber.tsx`

Replace the mock `transcribeAudio()` function:

**Current (Mock)**:
```typescript
const transcribeAudio = async () => {
  setIsTranscribing(true);

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 3000));

  setTranscription('Mock transcription text');
  setIsTranscribing(false);
};
```

**New (Real API)**:
```typescript
const transcribeAudio = async () => {
  if (!audioBlob) {
    alert('No audio to transcribe');
    return;
  }

  setIsTranscribing(true);

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('language', 'es'); // or detect from app

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(`${apiUrl}/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Transcription failed');
    }

    const data = await response.json();
    setTranscription(data.text);

    // Auto-create note from transcription
    handleCreateNote(data.text);
  } catch (error) {
    console.error('Transcription error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setIsTranscribing(false);
  }
};
```

### Phase 3: Enable CORS (If Needed)

If frontend and API are on **different domains**, update API:

**File**: `apis/api-sst/main.py`

Add after imports:
```python
from fastapi.middleware.cors import CORSMiddleware

# After: app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local development
        "https://yourdomain.com",      # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Note**: Keep CORS restrictive in production (specific domains only)

### Phase 4: Test Locally

**Terminal 1** - Start API:
```bash
cd apis/api-sst
./dev.sh
# API runs on http://localhost:8000
```

**Terminal 2** - Start Frontend:
```bash
cd apps/fe-webapp
npm run dev
# Frontend runs on http://localhost:3000
```

**Browser**:
1. Open http://localhost:3000
2. Click "Transcribe Audio" button
3. Record or upload audio
4. Click "Transcribe"
5. Check browser console for logs
6. Verify transcription appears

### Phase 5: Error Handling

Add user-friendly error messages:

```typescript
const handleTranscriptionError = (error: Error) => {
  const messages: Record<string, string> = {
    'No file provided': 'Please select an audio file',
    'Invalid file format': 'File must be audio (MP3, WAV, etc)',
    'File size exceeds': 'Audio file must be smaller than 25 MB',
    'OPENAI_API_KEY': 'API key not configured',
    'NetworkError': 'Connection failed. Check API URL',
  };

  for (const [key, message] of Object.entries(messages)) {
    if (error.message.includes(key)) {
      return message;
    }
  }

  return 'Unknown error. Check console logs.';
};
```

## Network Flow

### 1. User Records Audio
```
User records in browser
     ↓
MediaRecorder API captures blob
     ↓
Audio stored in state (audioBlob)
```

### 2. User Clicks "Transcribe"
```
FormData created
  ├─ file: audioBlob
  ├─ language: 'es'
  └─ model: 'whisper-1' (optional)
     ↓
POST to ${API_URL}/speech-to-text
```

### 3. API Processes
```
Validate file (size, type)
     ↓
Create temporary file
     ↓
Send to OpenAI Whisper API
     ↓
Get transcription text
     ↓
Return JSON: { "text": "..." }
     ↓
Clean up temp file
```

### 4. Frontend Receives
```
Parse JSON response
     ↓
Set transcription state
     ↓
Auto-create note with tags
     ↓
Show in UI
```

## Request/Response Examples

### Successful Request
```http
POST http://localhost:8000/speech-to-text
Content-Type: multipart/form-data

file: <binary audio data>
language: es

---

200 OK
Content-Type: application/json

{
  "text": "Hola mundo, esto es una prueba de transcripción."
}
```

### Error Response
```http
400 Bad Request

{
  "detail": "File size exceeds 25 MB limit"
}
```

## Troubleshooting

### CORS Errors

**Error**: `Access to XMLHttpRequest... has been blocked by CORS policy`

**Solution**:
1. Check API CORS configuration
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Restart API server after CORS changes

```bash
# Terminal with API
Ctrl+C
./dev.sh
```

### 404 Endpoint Not Found

**Error**: `POST /speech-to-text 404`

**Solution**:
1. Verify API is running: `curl http://localhost:8000/docs`
2. Check endpoint path in code (should be `/speech-to-text`)
3. Verify API URL in `.env.local`

### Connection Refused

**Error**: `Failed to fetch... Connection refused`

**Solution**:
1. Ensure API is running: `./dev.sh`
2. Check port 8000 is not in use: `lsof -i :8000`
3. Check firewall settings

### Timeout

**Error**: `Request timeout after 30s`

**Solution**:
1. Check network connectivity
2. Test with curl: `curl -X POST http://localhost:8000/speech-to-text -F "file=@audio.mp3"`
3. Check OpenAI API status
4. Add timeout handling in code:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeoutId);
}
```

### API Key Issues

**Error**: `OpenAI API key not found`

**Solution**:
1. Verify `.env` exists in `apis/api-sst/`
2. Add `OPENAI_API_KEY` to `.env`
3. Restart API server
4. Check key is valid at https://platform.openai.com/account/api-keys

## Production Deployment

### Frontend (Vercel)

```bash
cd apps/fe-webapp
npm run build
# Deploy to Vercel (GitHub push or vercel deploy)
```

**Environment Variables** (Vercel Dashboard):
```
NEXT_PUBLIC_API_URL=https://api-sst-xxxxx.lambda-url.us-east-1.on.aws
```

### API (AWS Lambda)

```bash
cd apis/api-sst
pip install -r requirements.txt -t package/
zip -r function.zip package/ main.py
# Upload to AWS Lambda
```

**Environment Variables** (Lambda):
```
OPENAI_API_KEY=sk-proj-xxxxx...
```

**API Gateway**:
1. Create API Gateway → Lambda integration
2. Setup CORS on ALL/OPTIONS
3. Get public URL: `https://xxxxx.lambda-url.region.on.aws`
4. Add to Vercel env vars as `NEXT_PUBLIC_API_URL`

## Performance Considerations

### Request Size
- Max file: 25 MB (OpenAI limit)
- No compression needed for audio
- Streaming upload for large files:

```typescript
const uploadLarge = async (blob: Blob) => {
  const chunkSize = 1024 * 1024; // 1MB
  const chunks = Math.ceil(blob.size / chunkSize);

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, blob.size);
    const chunk = blob.slice(start, end);

    // Upload chunk
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('index', i.toString());

    await fetch(`${apiUrl}/upload-chunk`, { method: 'POST', body: formData });
  }
};
```

### Response Time
- Transcription: 10-30s (depends on audio length and OpenAI)
- Add user feedback (progress bar, spinner)
- Implement timeout (60s recommended)

### Caching
- Cache transcriptions client-side (by audio hash)
- Never cache same audio → different text

```typescript
const transcriptionCache = new Map<string, string>();

const getCachedOrTranscribe = async (blob: Blob) => {
  const hash = await getHash(blob);

  if (transcriptionCache.has(hash)) {
    return transcriptionCache.get(hash)!;
  }

  const text = await transcribeAudio();
  transcriptionCache.set(hash, text);
  return text;
};
```

## Security Considerations

1. **API Key Protection**:
   - ✅ Stored on server (.env, gitignored)
   - ❌ Never expose in frontend code
   - ✅ OPENAI_API_KEY never in NEXT_PUBLIC_*

2. **File Validation**:
   - ✅ Size limit (25 MB)
   - ✅ Content-type check
   - ✅ File extension check
   - ✅ Malware scan (optional, third-party service)

3. **CORS**:
   - ✅ Restrict to known origins
   - ✅ No * in production
   - ✅ Specific domains only

4. **Rate Limiting**:
   - Add per-user/IP rate limit (optional)
   - Prevent abuse of OpenAI API

## Monitoring

### Logging

**Frontend**:
```typescript
console.log('Transcription started', { fileSize, duration });
console.error('Transcription failed', error);
```

**API**:
```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"Transcribing {file.filename}")
logger.error(f"Failed: {str(e)}")
```

### Metrics

Track in production:
- Success/failure rate
- Average transcription time
- API quota usage
- Error types

### Sentry Integration (Optional)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://xxxxx@sentry.io/xxxxx",
  environment: process.env.NODE_ENV,
});
```

## Testing

### Unit Tests (Jest)

```typescript
describe('AudioTranscriber', () => {
  it('should transcribe audio correctly', async () => {
    const blob = new Blob(['test'], { type: 'audio/webm' });
    const result = await transcribeAudio(blob);
    expect(result).toContain('test');
  });

  it('should handle API errors', async () => {
    // Mock API error
    // Assert error message shown
  });
});
```

### E2E Tests (Playwright/Cypress)

```typescript
test('audio transcription flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Record audio
  await page.click('[data-testid="record-button"]');
  await page.waitForTimeout(2000);
  await page.click('[data-testid="stop-button"]');

  // Transcribe
  await page.click('[data-testid="transcribe-button"]');

  // Verify result
  const transcription = await page.textContent('[data-testid="transcription"]');
  expect(transcription).toBeTruthy();
});
```

## Rollback Plan

If API integration fails in production:

1. **Temporary Rollback**:
   ```typescript
   const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

   const transcribeAudio = async () => {
     if (USE_MOCK) {
       // Use mock
     } else {
       // Use real API
     }
   };
   ```

2. **Quick Fix**:
   - Check API logs
   - Verify OpenAI API status
   - Check CORS configuration
   - Restart API

3. **Emergency**:
   - Revert frontend deployment
   - Switch to mock mode
   - Fix API independently

## Next Steps

1. ✅ Update `.env.local` with API URL
2. ✅ Modify `AudioTranscriber.tsx` with real API call
3. ✅ Add CORS to API if needed
4. ✅ Test locally (both terminals running)
5. ✅ Handle errors gracefully
6. ✅ Deploy to production
7. ✅ Monitor for issues
8. ✅ Setup alerts

---

**See Also**:
- `docs/API.md` - API documentation
- `docs/FRONTEND.md` - Frontend setup
- `docs/DEPLOYMENT.md` - Production deployment

# Architecture Overview

## Project Structure

**SecondBrain** - Personal Knowledge Management (PKM) system

```
platanus-hack-25/
├── apis/
│   └── api-sst/           # Speech-to-Text API (FastAPI)
├── apps/
│   └── fe-webapp/         # Frontend (Next.js + React)
└── docs/                  # Documentation
```

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│           Frontend (Next.js + React)                │
│  • Monaco Editor (code/markdown)                    │
│  • Graph View (knowledge visualization)             │
│  • Audio Recorder & Uploader                        │
│  • Sidebar Navigation                               │
│  • Zustand State Management                         │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/REST
                 │ FormData (multipart)
                 ▼
┌─────────────────────────────────────────────────────┐
│        Speech-to-Text API (FastAPI/Python)         │
│  • POST /speech-to-text                            │
│  • OpenAI Whisper Integration                      │
│  • Audio File Validation                           │
│  • AWS Lambda Ready (Mangum)                       │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Frontend Framework** | Next.js | 15.5.6 | App Router, SSR |
| **UI Library** | React | 19.2.0 | Component framework |
| **UI Components** | shadcn/ui | Latest | Accessible components |
| **Styling** | Tailwind CSS | 4.1.17 | Utility-first CSS |
| **State** | Zustand | 5.0.8 | Lightweight state mgmt |
| **Editor** | Monaco Editor | 4.7.0 | VS Code editor |
| **Markdown** | React Markdown | 10.1.0 | MD rendering |
| **Animations** | Framer Motion | 12.23.24 | Smooth animations |
| **Icons** | Lucide React | 0.554.0 | Icon library |
| **Language** | TypeScript | 5.9.3 | Type safety |
| **API Framework** | FastAPI | 0.110.0+ | Modern Python web |
| **ASGI Server** | Uvicorn | 0.24.0+ | ASGI runtime |
| **AI Service** | OpenAI Whisper | API | Speech-to-text |
| **Serverless** | Mangum | 0.17.0+ | ASGI→Lambda |

## Data Flow

### Input Channels
1. **Text Input** → Monaco Editor → Store → Auto-save
2. **Audio Recording** → Recorder API → Blob → API Upload
3. **Audio Upload** → File Input → FormData → API Upload
4. **Search Query** → Global search → Filter notes

### Processing
- **Frontend**: Zustand store manages UI state
- **API**: FastAPI processes audio → Whisper → text
- **Integration**: FormData POST with multipart/form-data

### Output
- Transcriptions create new notes
- Notes persist in Zustand (in-memory)
- Export to Markdown files
- Graph visualization of connections

## Key Features

### MVP (Must Have)
✅ Text note input with auto-save
✅ Audio transcription API ready
✅ Project organization
✅ Basic full-text search
✅ Recent notes view
✅ Export to Markdown

### Phase 2 (Should Have)
✅ Manual tags
✅ Knowledge graph visualization
⚠️ Advanced search (date, tags combined)
❌ Note templates
❌ Offline mode + sync

## State Management

**Zustand Store** (`pkmStore.ts`)
- **Notes**: CRUD operations, filtering, search
- **Projects**: Organization, grouping
- **UI State**: Sidebar, view mode, active note
- **Computed**: Recent notes, filtered notes, backlinks

Key characteristic: **All in-memory** (no persistence yet)

## Design System

### Spacing
- Header: 64px (h-16)
- Sidebar: 256px (w-64)
- Gap: 4px–32px (Tailwind scale)
- See: `/src/constants/spacing.ts`

### Colors
- Theme-aware CSS variables
- Dark mode (default) + Light mode
- Semantic colors: primary, secondary, destructive, muted

### Components
- **shadcn/ui**: Button, Input, Dialog, Badge, Card
- **Custom**: NoteEditor, GraphView, AudioTranscriber, Sidebar
- **Icons**: Lucide React
- **Accessibility**: ARIA labels, semantic HTML

## Deployment Architecture

### Frontend
- **Build**: `next build` → Static + Server functions
- **Host**: Vercel (recommended) or any Node.js host
- **Output**: Standalone (optimized bundle)

### API
- **Build**: Python venv + requirements.txt
- **Local**: Uvicorn server
- **Production**: AWS Lambda (Mangum handler)
- **Serverless**: Event-driven, scales to zero

## Integration Points

### Frontend ↔ API
- **Endpoint**: `POST /speech-to-text`
- **Format**: `multipart/form-data`
- **Authentication**: OPENAI_API_KEY (server-side)
- **CORS**: Must be configured
- **See**: `docs/INTEGRATION.md`

## Code Organization Principles

1. **YAGNI**: No unnecessary features
2. **KISS**: Simple, understandable code
3. **DRY**: Constants, utilities, reusable components
4. **No Magic Numbers**: Everything configurable
5. **Type Safety**: TypeScript strict mode
6. **Accessibility**: WCAG 2.1 AA standard

## Entry Points

| Component | Command | URL |
|-----------|---------|-----|
| Frontend Dev | `npm run dev` | http://localhost:3000 |
| API Dev | `./dev.sh` | http://localhost:8000 |
| API Docs | Swagger UI | http://localhost:8000/docs |

## Next Steps

1. Connect AudioTranscriber to API (see INTEGRATION.md)
2. Add data persistence (localStorage or backend)
3. Deploy frontend (Vercel) and API (AWS Lambda)
4. Implement advanced search and templates
5. Add tests and CI/CD

---

**For detailed information**:
- **API**: See `docs/API.md`
- **Frontend**: See `docs/FRONTEND.md`
- **Integration**: See `docs/INTEGRATION.md`
- **Patterns**: See `docs/PATTERNS.md`
- **Deployment**: See `docs/DEPLOYMENT.md`

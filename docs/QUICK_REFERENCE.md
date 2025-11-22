# Quick Reference Guide

## Start Here (2 min)

```bash
# Frontend development
cd apps/fe-webapp && npm run dev
# → http://localhost:3000

# API development
cd apis/api-sst && ./dev.sh
# → http://localhost:8000

# Validate before deploy
npm run validate
```

---

## Project Structure

```
platanus-hack-25/
├── apis/api-sst/              # Speech-to-Text API (FastAPI)
│   ├── main.py               # FastAPI app
│   ├── requirements.txt       # Python dependencies
│   ├── .env                  # OpenAI API key (gitignored)
│   ├── .env.example          # Template
│   ├── dev.sh                # Start dev server
│   └── test-api.sh           # Test endpoint
│
├── apps/fe-webapp/            # Frontend (Next.js)
│   ├── src/
│   │   ├── app/              # Pages & layouts
│   │   ├── components/       # React components
│   │   ├── stores/           # Zustand state
│   │   ├── types/            # TypeScript interfaces
│   │   ├── constants/        # Spacing, colors, mock data
│   │   ├── utils/            # Helper functions
│   │   └── hooks/            # Custom hooks
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── docs/                      # Documentation
    ├── INDEX.md              # Start here
    ├── ARCHITECTURE.md       # System overview
    ├── FRONTEND.md           # Frontend docs
    ├── API.md                # API docs
    ├── INTEGRATION.md        # API connection
    ├── PATTERNS.md           # Code standards
    ├── DEPLOYMENT.md         # Production deploy
    └── QUICK_REFERENCE.md    # This file
```

---

## Key Commands

### Frontend
```bash
cd apps/fe-webapp

npm run dev           # Start dev server (port 3000)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Check code style
npm run type-check    # TypeScript checking
npm run validate      # lint + type-check + build
```

### API
```bash
cd apis/api-sst

./dev.sh              # Start dev server (port 8000, hot-reload)
pip install -r requirements.txt  # Install dependencies
python3 -m venv venv  # Create virtual environment
source venv/bin/activate  # Activate venv (macOS/Linux)
```

---

## Important Files

### Frontend
| File | Purpose |
|------|---------|
| `src/stores/pkmStore.ts` | Global state (notes, projects) |
| `src/components/editor/NoteEditor.tsx` | Note editor with Monaco |
| `src/components/notes/AudioTranscriber.tsx` | Audio recording & upload |
| `src/components/graph/GraphView.tsx` | Knowledge graph visualization |
| `src/components/sidebar/Sidebar.tsx` | Navigation sidebar |
| `src/app/page.tsx` | Main application page |
| `src/app/globals.css` | Theme colors, global styles |
| `src/constants/spacing.ts` | Layout dimensions |
| `src/types/note.ts` | TypeScript interfaces |

### API
| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, endpoints |
| `requirements.txt` | Python dependencies |
| `.env` | Environment variables (gitignored) |
| `.env.example` | Template for .env |

---

## Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### API (`.env`)
```env
OPENAI_API_KEY=sk-proj-xxxxx...
```

Get key: https://platform.openai.com/account/api-keys

---

## Code Patterns

### React Component
```typescript
interface ComponentProps {
  title: string;
  onSave?: (data: string) => void;
}

const MyComponent: React.FC<ComponentProps> = ({ title, onSave }) => {
  const [state, setState] = useState('');

  const handleSave = useCallback(() => {
    onSave?.(state);
  }, [state, onSave]);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default MyComponent;
```

### Zustand Hook
```typescript
const { notes, addNote, updateNote } = usePkmStore();

// Add note
addNote({ title: 'New Note', content: '', tags: [] });

// Update note
updateNote(noteId, { content: 'Updated' });
```

### FastAPI Endpoint
```python
from fastapi import FastAPI, UploadFile, HTTPException

app = FastAPI()

@app.post("/endpoint")
async def my_endpoint(file: UploadFile) -> dict:
    """Endpoint description."""
    if not file:
        raise HTTPException(400, detail="File required")
    # Process...
    return {"result": "data"}
```

---

## API Endpoints

### POST /speech-to-text
Transcribe audio to text.

**Request**:
```bash
curl -X POST http://localhost:8000/speech-to-text \
  -F "file=@audio.mp3" \
  -F "language=es"
```

**Response**:
```json
{
  "text": "Transcribed text here..."
}
```

**Docs**: http://localhost:8000/docs

---

## Keyboard Shortcuts (Frontend)

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + N | New note |
| Ctrl/Cmd + K | Search focus |
| Ctrl/Cmd + 1 | Editor view |
| Ctrl/Cmd + 2 | Graph view |
| Ctrl/Cmd + 3 | Split view |
| Escape | Close modals |

---

## Common Tasks

### Add Environment Variable
1. Create/edit `.env` or `.env.local`
2. Add: `VAR_NAME=value`
3. Restart dev server
4. Access in code:
   - Frontend: `process.env.NEXT_PUBLIC_*`
   - API: `os.getenv("VAR_NAME")`

### Connect to Real API
See: `docs/INTEGRATION.md`

1. Update `.env.local` with `NEXT_PUBLIC_API_URL`
2. Modify `AudioTranscriber.tsx` to use real API
3. Add CORS to `main.py` if needed
4. Test locally with both servers running

### Deploy
See: `docs/DEPLOYMENT.md`

**Frontend (Vercel)**:
1. Push to GitHub
2. Connect at vercel.com
3. Set `NEXT_PUBLIC_API_URL` env var
4. Deploy

**API (AWS Lambda)**:
1. Create Lambda function
2. Upload zip file
3. Set `OPENAI_API_KEY` env var
4. Add API Gateway trigger

### Debug
```bash
# Frontend
# Open DevTools (F12)
# Check Console, Network tabs
# Use Redux DevTools (Zustand)

# API
# Check logs: tail -f logs.txt
# Or: aws logs tail /aws/lambda/function-name
# Test endpoint: curl -X POST http://localhost:8000/speech-to-text ...
```

---

## TypeScript Types

```typescript
// Note
interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  projectId?: string
  isPinned?: boolean
}

// Project
interface Project {
  id: string
  name: string
  color: string
  createdAt: Date
}

// Store State
interface PKMState {
  notes: Note[]
  projects: Project[]
  activeNoteId: string | null
  selectedProjectId: string | null
  // ... actions and getters
}
```

---

## Styling (Tailwind)

### Colors (CSS Variables)
```css
bg-background     /* Background color */
text-foreground   /* Text color */
border-border     /* Border color */
bg-primary        /* Primary color (#3B82F6) */
```

### Spacing System
```typescript
// From src/constants/spacing.ts
SPACING.header.height    // h-16 (64px)
SPACING.sidebar.width    // w-64 (256px)
SPACING.gaps.md          // gap-4 (16px)
```

### Component Example
```tsx
<div className="flex gap-4 p-4 bg-background rounded-lg border">
  <h2 className="text-xl font-semibold text-foreground">Title</h2>
  <button className="px-4 py-2 bg-primary text-white rounded">
    Action
  </button>
</div>
```

---

## Error Handling

### Frontend
```typescript
try {
  const result = await api.call();
  setData(result);
} catch (error) {
  console.error('Error:', error);
  setError(error.message);
  // Show user-friendly message
}
```

### API
```python
try:
    result = process(data)
except ValueError as e:
    raise HTTPException(400, detail=str(e))
except Exception as e:
    logger.error(f"Error: {e}")
    raise HTTPException(500, detail="Internal server error")
```

---

## Validation Checklist

Before committing:
- [ ] No `console.log` or `debugger` statements
- [ ] No hardcoded values (use constants)
- [ ] Error handling present
- [ ] Types complete (no implicit any)
- [ ] Accessibility considered
- [ ] No unused imports/variables
- [ ] Tests pass: `npm run validate`

Before deploying:
- [ ] Run `npm run validate`
- [ ] Manual testing complete
- [ ] Environment variables set correctly
- [ ] API key is valid
- [ ] CORS configured if needed

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change port: `PORT=3001 npm run dev` |
| Port 8000 in use | Change port in dev.sh or `lsof -i :8000` |
| OPENAI_API_KEY error | Create .env with valid key |
| ModuleNotFoundError | Activate venv: `source venv/bin/activate` |
| CORS errors | Add CORSMiddleware to main.py |
| Types failing | `npm run type-check` to see errors |
| Build fails | Run `npm run validate` to see issues |

---

## Getting Help

- **Architecture**: Read `docs/ARCHITECTURE.md`
- **Frontend**: Read `docs/FRONTEND.md`
- **API**: Read `docs/API.md`
- **Integration**: Read `docs/INTEGRATION.md`
- **Patterns**: Read `docs/PATTERNS.md`
- **Deployment**: Read `docs/DEPLOYMENT.md`
- **Full Index**: Read `docs/INDEX.md`

---

## Resources

- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- FastAPI Docs: https://fastapi.tiangolo.com
- Zustand Docs: https://github.com/pmndrs/zustand
- Tailwind Docs: https://tailwindcss.com/docs
- shadcn/ui Docs: https://ui.shadcn.com

---

**Last Updated**: 2025-11-22
**Project**: SecondBrain PKM
**Status**: MVP Complete (80%)

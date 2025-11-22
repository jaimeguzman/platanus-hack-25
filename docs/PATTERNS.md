# Design Patterns & Code Standards

## Principles

### YAGNI (You Aren't Gonna Need It)
- ❌ Don't implement features not explicitly requested
- ❌ Don't over-engineer solutions
- ✅ Build for current requirements only
- ✅ Refactor when pattern emerges (rule of three)

### KISS (Keep It Simple, Stupid)
- Simple is better than complex
- Readable code > clever code
- Prefer straightforward solutions
- Question every abstraction

### DRY (Don't Repeat Yourself)
- Centralize constants, utils, components
- Reusable functions for common logic
- Avoid copy-paste patterns
- Extract common patterns into utilities

### No Magic Numbers
- **Bad**: `if (items.length > 10)`
- **Good**: `const RECENT_NOTES_LIMIT = 10`
- All configurable values in `constants/` or `config`
- Semantic naming for readability

### No Hardcoded Values
- **Bad**: `const apiUrl = "http://localhost:8000"`
- **Good**: Use environment variables
- **Better**: Configuration files or .env

### No Static Fallbacks
- Don't provide fake/placeholder data in code
- If a value can't be determined, fail explicitly
- Use `mockData.ts` only for development
- Production: real data or meaningful error

## Frontend Patterns

### Component Organization

**Structure**:
```
components/
├── ui/              # Reusable UI primitives (shadcn/ui)
├── editor/          # Feature-specific (Note editor)
├── graph/           # Feature-specific (Graph view)
├── notes/           # Feature-specific (Audio)
├── sidebar/         # Feature-specific (Navigation)
└── theme/           # Cross-cutting (Theme)
```

**Naming**:
- Components: PascalCase (`NoteEditor.tsx`)
- Utils: camelCase (`cn.ts`, `export.ts`)
- Hooks: camelCase with `use` prefix (`useTheme.ts`)
- Types: PascalCase (`Note`, `Project`)

### Zustand Store Pattern

```typescript
// ✅ Good: Clear, organized, immutable updates
export const usePkmStore = create<PKMState>((set, get) => ({
  // State
  notes: [],
  activeNoteId: null,

  // Actions
  addNote: (note) => set(state => ({
    notes: [...state.notes, note]
  })),

  // Getters
  getNoteById: (id) => {
    const state = get();
    return state.notes.find(n => n.id === id);
  },

  // DevTools for debugging
  devtools: (set) => set,
}));

// Usage in component
const { notes, addNote } = usePkmStore();
```

**Rules**:
1. Spread operator for immutability
2. Getters for derived state
3. Actions keep logic minimal
4. DevTools enabled in dev mode

### Component Patterns

**Functional Components Only**
```typescript
// ✅ Good
const NoteEditor: React.FC<Props> = ({ note }) => {
  const [content, setContent] = useState(note.content);
  return <div>{content}</div>;
};

// ❌ Bad (class components outdated)
class NoteEditor extends React.Component { }
```

**Hooks**
```typescript
// ✅ Good
const useTheme = () => {
  const [theme, setTheme] = useState('dark');
  // ... logic
  return { theme, setTheme };
};

// ❌ Bad (props drilling)
function App({ theme, setTheme }) {
  return <Child theme={theme} setTheme={setTheme} />;
}
```

**Props Interface**
```typescript
// ✅ Good
interface NoteEditorProps {
  noteId: string;
  onSave?: (content: string) => void;
  className?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ ... }) => { };

// ❌ Bad (implicit any)
const NoteEditor = ({ noteId, onSave, className }) => { };
```

### Event Handler Pattern

```typescript
// ✅ Good: Named handlers, clear intent
const handleSaveNote = useCallback(() => {
  updateNote(activeNoteId, content);
}, [activeNoteId, content, updateNote]);

return <button onClick={handleSaveNote}>Save</button>;

// ❌ Bad: Inline complex logic
return <button onClick={() => {
  const updated = { ...note, content };
  updateNote(activeNoteId, updated);
}}>Save</button>;
```

### Error Handling

```typescript
// ✅ Good: Try-catch, user feedback
const transcribeAudio = async () => {
  try {
    const result = await fetchTranscription(audio);
    setTranscription(result);
  } catch (error) {
    console.error('Transcription failed:', error);
    showErrorMessage('Failed to transcribe. Please try again.');
  }
};

// ❌ Bad: Silent failure
const transcribeAudio = async () => {
  const result = await fetchTranscription(audio);
  setTranscription(result);
};
```

### Accessibility Pattern

```typescript
// ✅ Good: Full accessibility
<button
  aria-label="Save note"
  aria-pressed={isSaved}
  onClick={handleSave}
  disabled={!hasChanges}
>
  <SaveIcon aria-hidden="true" />
  Save
</button>

// ❌ Bad: No accessibility
<button onClick={handleSave}>
  <SaveIcon />
</button>
```

## API Patterns

### FastAPI Endpoint Structure

```python
# ✅ Good: Type hints, validation, error handling
from fastapi import FastAPI, UploadFile, HTTPException

app = FastAPI()

@app.post("/speech-to-text")
async def transcribe(file: UploadFile) -> dict:
    """Transcribe audio to text."""

    # Validation
    if not file:
        raise HTTPException(400, detail="No file provided")

    if file.content_type not in ["audio/mpeg", "audio/wav"]:
        raise HTTPException(400, detail="Invalid file format")

    # Processing
    try:
        text = await process_audio(file)
        return {"text": text}
    except Exception as e:
        raise HTTPException(500, detail=str(e))

# ❌ Bad: No validation, no error handling
@app.post("/transcribe")
async def transcribe(file: UploadFile):
    return {"text": process_audio(file)}
```

**Rules**:
1. Type hints on all parameters and returns
2. Docstrings for all endpoints
3. Explicit error handling
4. Validation at API boundary
5. HTTP status codes are meaningful

### Error Response Pattern

```python
# ✅ Good: Structured error
try:
    result = process(data)
except ValueError as e:
    raise HTTPException(
        status_code=400,
        detail=f"Invalid input: {str(e)}"
    )
except Exception as e:
    raise HTTPException(
        status_code=500,
        detail="Internal server error"
    )

# ❌ Bad: Generic error
raise Exception("Something went wrong")
```

### Logging Pattern

```python
# ✅ Good: Structured logging
import logging

logger = logging.getLogger(__name__)

logger.info(f"Processing audio: {filename}", extra={
    "size": file.size,
    "type": file.content_type
})

# ❌ Bad: Print statements
print(f"Processing {filename}")
```

## Type Safety

### TypeScript Strict Mode

All files use `strict: true`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Rules**:
1. No `any` without justification
2. Explicit return types on functions
3. Optional fields use `?`
4. Unions for multiple types

### Type Examples

```typescript
// ✅ Good: Explicit types
const addNote = (title: string, content: string): Note => {
  return {
    id: crypto.randomUUID(),
    title,
    content,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// ❌ Bad: Implicit any
const addNote = (title, content) => {
  return { id: Math.random(), ...};
};
```

## Constants Organization

### Location Pattern

```
constants/
├── colors.ts      # Color palette
├── spacing.ts     # Layout dimensions
├── mockData.ts    # Development test data
└── index.ts       # Re-exports (optional)
```

### Value Pattern

```typescript
// ✅ Good: Named constants, no magic values
export const SPACING = {
  header: { height: 'h-16' },     // 64px
  sidebar: { width: 'w-64' },      // 256px
  gaps: { sm: 'gap-2', md: 'gap-4' },
};

export const LIMITS = {
  RECENT_NOTES: 10,
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
};

// ❌ Bad: Magic numbers
if (notes.length > 10) { }
if (file.size > 26214400) { }
```

## Testing Patterns

### Unit Test Structure

```typescript
// ✅ Good: Clear test structure
describe('NoteEditor', () => {
  it('should save note when Save button clicked', () => {
    const onSave = jest.fn();
    const { getByText } = render(
      <NoteEditor initialContent="test" onSave={onSave} />
    );

    fireEvent.click(getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('test');
  });

  it('should show error on failed save', async () => {
    const onSave = jest.fn(() => Promise.reject('Error'));
    const { getByText } = render(
      <NoteEditor initialContent="test" onSave={onSave} />
    );

    fireEvent.click(getByText('Save'));
    await waitFor(() => {
      expect(getByText('Save failed')).toBeInTheDocument();
    });
  });
});
```

## Performance Patterns

### Memoization

```typescript
// ✅ Good: Memoize expensive operations
const expensiveCompute = useMemo(() => {
  return filterAndSortNotes(notes);
}, [notes]);

// ✅ Good: Stable callback references
const handleSave = useCallback(() => {
  updateNote(content);
}, [content, updateNote]);

// ❌ Bad: No memoization
const filtered = filterAndSortNotes(notes); // Every render
const handleSave = () => updateNote(content); // New function each time
```

### Virtual Scrolling

```typescript
// ✅ For large lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      {items[index]}
    </div>
  )}
</FixedSizeList>

// ❌ Bad: All items rendered
<ul>
  {items.map(item => <li>{item}</li>)}
</ul>
```

## Code Organization

### File Naming

| File Type | Pattern | Example |
|-----------|---------|---------|
| Component | PascalCase | `NoteEditor.tsx` |
| Hook | camelCase + `use` | `useTheme.ts` |
| Utility | camelCase | `export.ts` |
| Constant | camelCase | `mockData.ts` |
| Type | PascalCase | `note.ts` |

### Import Organization

```typescript
// ✅ Good: Organized imports
// 1. External packages
import React from 'react';
import { create } from 'zustand';

// 2. Internal components
import { NoteEditor } from '@/components/editor';

// 3. Internal utilities
import { usePkmStore } from '@/stores';
import { cn } from '@/utils';

// 4. Types
import type { Note } from '@/types';

// 5. Constants
import { SPACING } from '@/constants';
```

### Export Pattern

```typescript
// ✅ Good: Named exports for tree-shaking
export const NoteEditor = ({ ... }) => { };
export const NotePreview = ({ ... }) => { };

// ❌ Bad: Default export (harder to refactor)
export default NoteEditor;
```

## Environment Variables

### Naming Convention

```bash
# Frontend (exposed to client)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (server-only secrets)
OPENAI_API_KEY=sk-proj-xxxxx
DATABASE_URL=postgresql://...
```

**Rules**:
1. `NEXT_PUBLIC_*` only for non-sensitive values
2. Never commit `.env` (use `.env.example`)
3. Environment-specific files (`.env.local`, `.env.production`)

## Git & Commits

### Commit Message Pattern

```
feat: add audio transcription feature
^--^  ^--------------------------------^
type  subject (imperative, lowercase, no period)

Optional body:
- Added AudioTranscriber component
- Integrated OpenAI Whisper API
- Added audio recording and upload

Fixes #123
```

**Types**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code reorganization
- `test:` Test additions
- `chore:` Build, dependencies

## Documentation Patterns

### Inline Comments

```typescript
// ✅ Good: Why, not what
// Memoize to prevent re-renders on every parent change
const handleSave = useCallback(() => {
  updateNote(content);
}, [content]);

// ❌ Bad: Stating the obvious
// Handle save
const handleSave = () => {
  updateNote(content);
};
```

### Function Documentation

```typescript
/**
 * Transcribe audio file to text using OpenAI Whisper.
 *
 * @param audio - Audio blob from MediaRecorder
 * @param language - ISO 639-1 language code (optional)
 * @returns Promise resolving to transcribed text
 * @throws Error if API request fails
 */
export const transcribeAudio = async (
  audio: Blob,
  language?: string
): Promise<string> => {
  // Implementation
};
```

## Code Review Checklist

Before committing, verify:

- ✅ No console.log or debugger statements
- ✅ No hardcoded values (use constants)
- ✅ Error handling present
- ✅ Types complete (no implicit any)
- ✅ Accessibility considered (ARIA, semantic HTML)
- ✅ Performance optimized (memoization, virtual lists)
- ✅ Comments explain why, not what
- ✅ No unused imports or variables
- ✅ Tests pass (`npm run validate`)

## Anti-Patterns (What to Avoid)

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Props drilling | Hard to maintain, refactor | Use context, Zustand |
| God components | Too much responsibility | Split into smaller pieces |
| Inline styles | Difficult to maintain, theme | Use Tailwind classes |
| Magic numbers | Unclear intent, hard to change | Extract to constants |
| Silent failures | Hard to debug | Explicit error handling |
| Any types | Loss of type safety | Add proper types |
| Copy-paste code | Maintenance nightmare | Extract to utilities |

---

**Related Documentation**:
- `docs/ARCHITECTURE.md` - System overview
- `docs/FRONTEND.md` - Frontend specifics
- `docs/API.md` - API specifics

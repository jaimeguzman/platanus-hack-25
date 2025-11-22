# Frontend Application Documentation

## Overview

Next.js + React web application for SecondBrain knowledge management.

**Location**: `/apps/fe-webapp/`
**Node Version**: 20+

## Project Structure

```
fe-webapp/
├── src/
│   ├── app/                    # App Router (Next.js)
│   │   ├── layout.tsx         # Root layout + ThemeProvider
│   │   ├── page.tsx           # Main application page
│   │   └── globals.css        # Global styles + CSS variables
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── card.tsx
│   │   │
│   │   ├── editor/
│   │   │   └── NoteEditor.tsx
│   │   ├── graph/
│   │   │   └── GraphView.tsx
│   │   ├── notes/
│   │   │   └── AudioTranscriber.tsx
│   │   ├── sidebar/
│   │   │   └── Sidebar.tsx
│   │   └── theme/
│   │       ├── ThemeProvider.tsx
│   │       └── ThemeToggle.tsx
│   │
│   ├── stores/
│   │   └── pkmStore.ts        # Zustand state management
│   │
│   ├── types/
│   │   └── note.ts            # TypeScript interfaces
│   │
│   ├── constants/
│   │   ├── colors.ts          # Color palette
│   │   ├── spacing.ts         # Spacing system
│   │   └── mockData.ts        # Mock data + defaults
│   │
│   ├── utils/
│   │   ├── cn.ts              # Tailwind merge utility
│   │   ├── export.ts          # Markdown export
│   │   └── theme.ts           # Theme utilities
│   │
│   └── hooks/
│       └── useTheme.ts        # Theme hook
│
├── public/                     # Static assets
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── components.json            # shadcn/ui config
```

## Core Components

### 1. Main Page (`src/app/page.tsx`)

Application shell with:
- Header (search, breadcrumbs, theme toggle)
- Sidebar (projects, navigation)
- Main editor area (Monaco + Markdown preview)
- Graph view (knowledge visualization)
- Audio transcription modal

**Key Features**:
- 3 view modes: Editor, Graph, Split
- Keyboard shortcuts (Ctrl/Cmd + N, K, 1/2/3)
- Search functionality
- Project switching

### 2. Note Editor (`src/components/editor/NoteEditor.tsx`)

Dual-mode editor:
- **Edit Mode**: Monaco Editor with syntax highlighting
- **Preview Mode**: Markdown rendering with GitHub Flavored Markdown

**Features**:
- Auto-save to Zustand store
- Tag management (add/remove)
- Project breadcrumbs
- Metadata display (date, tag count)
- Export to Markdown
- Word/line count

**Monaco Config**:
- Language: Markdown
- Theme: Dark (matches app theme)
- Word wrap enabled
- Auto-formatting
- Minimap disabled for focus

### 3. Graph View (`src/components/graph/GraphView.tsx`)

Knowledge graph visualization using HTML5 Canvas.

**Elements**:
- **Nodes**: Notes (blue), Tags (green), Projects (purple)
- **Edges**: Links, backlinks, tag relationships
- **Layout**: Circular with force-directed physics

**Controls**:
- Click: Select node, show connections
- Drag: Pan canvas
- Scroll: Zoom in/out
- Buttons: ZoomIn, ZoomOut, Reset

**Performance**:
- Canvas rendering (better than SVG for many nodes)
- Efficient node/edge calculation
- Lazy rendering

### 4. Audio Transcriber (`src/components/notes/AudioTranscriber.tsx`)

Audio capture and transcription.

**Modes**:
- **Record**: MediaRecorder API
- **Upload**: File input

**Features**:
- Live audio level visualization
- Waveform display
- Playback controls
- ⚠️ **Currently MOCK** (3s simulation)
- Auto-creates note from transcription
- Auto-tags: ['audio', 'transcription']

**See**: `docs/INTEGRATION.md` to connect to real API

### 5. Sidebar (`src/components/sidebar/Sidebar.tsx`)

ClickUp-style sidebar with:
- Workspace header
- Main navigation (Home, Recent, Starred, Tags)
- Expandable project tree
- Search within sidebar
- New note button
- Settings footer

**Dimensions**:
- Width: 256px (w-64)
- Height: Matches app (h-screen)
- Collapsible on mobile

## State Management (Zustand)

**Store**: `/src/stores/pkmStore.ts`

### State Shape
```typescript
{
  // Data
  notes: Note[]
  projects: Project[]

  // UI State
  activeNoteId: string | null
  selectedProjectId: string | null
  sidebarOpen: boolean
  viewMode: 'editor' | 'graph' | 'split'
  searchQuery: string

  // Actions (CRUD)
  addNote, updateNote, deleteNote, setActiveNote
  addProject, updateProject, deleteProject

  // Getters (computed)
  getFilteredNotes(), getNoteById(), getRecentNotes()
}
```

### Key Characteristics
- **Immutable updates**: Spread operators, not mutations
- **Computed values**: Getters for filtered/derived data
- **DevTools**: Redux DevTools integration for debugging
- **Auto updatedAt**: Timestamps updated on note changes
- **UUID generation**: `crypto.randomUUID()` for IDs

### Data Persistence
- ⚠️ **Currently in-memory only**
- See `docs/INTEGRATION.md` for localStorage/backend setup

## Type System

**Core Types** (`src/types/note.ts`):

```typescript
interface Note {
  id: string
  title: string
  content: string
  projectId?: string
  tags: string[]
  isPinned?: boolean
  backlinks?: string[]
  createdAt: Date
  updatedAt: Date
}

interface Project {
  id: string
  name: string
  color: string
  icon?: string
  createdAt: Date
  noteCount?: number
}

interface GraphNode {
  id: string
  label: string
  type: 'note' | 'tag' | 'project'
  x?: number
  y?: number
  color?: string
}

interface GraphEdge {
  source: string
  target: string
  type: 'link' | 'tag' | 'backlink'
  strength?: number
}
```

## Design System

### Spacing System (`src/constants/spacing.ts`)

Structured Tailwind spacing:
```typescript
export const SPACING = {
  header: { height: 'h-16' },           // 64px
  sidebar: { width: 'w-64' },            // 256px
  gaps: {
    xs: 'gap-1',      // 4px
    sm: 'gap-2',      // 8px
    md: 'gap-3',      // 12px
    lg: 'gap-4',      // 16px
    xl: 'gap-6',      // 24px
  },
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6',
  },
}
```

No magic numbers. All values centralized.

### Color System (`src/app/globals.css`)

CSS Custom Properties for theming:

**Dark Mode (Default)**:
```css
--background: #111111
--foreground: #EEEEEE
--primary: #3B82F6
--secondary: #8B5CF6
--border: #2A2A2A
--muted-foreground: #999999
--accent: #EC4899
--destructive: #EF4444
```

**Light Mode** (`.light` class):
```css
--background: #FFFFFF
--foreground: #111111
--border: #D1D5DB
...
```

**Features**:
- Smooth transitions between modes
- Semantic color naming
- Hierarchical: background → foreground → primary → secondary

### shadcn/ui Configuration

```json
{
  "style": "new-york",
  "rsc": true,
  "css": "import",
  "tailwind": {
    "config": "tailwind.config.ts",
    "cssVariables": true,
    "baseColor": "neutral"
  },
  "aliases": {
    "@/components": "src/components",
    "@/hooks": "src/hooks",
    "@/utils": "src/utils"
  }
}
```

Used Components: Button, Input, Dialog, Badge, Card

## Development

### Setup
```bash
cd apps/fe-webapp
npm install
npm run dev
```

**Access**: http://localhost:3000

### Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking
npm run validate      # lint + type-check + build
```

### Best Practice
Always run before deployment:
```bash
npm run validate
```

## Key Features

### Notes
- ✅ Create, read, update, delete
- ✅ Auto-save
- ✅ Tags
- ✅ Project organization
- ✅ Pin/unpin
- ⚠️ Search (basic, not indexed)
- ❌ Collaborations
- ❌ Version history

### Projects
- ✅ Create, read, update, delete
- ✅ Color coding
- ✅ Note grouping
- ✅ Drag-and-drop (UI ready)
- ❌ Sharing
- ❌ Templates

### Audio
- ✅ Record from microphone
- ✅ Upload audio files
- ✅ Playback preview
- ⚠️ Transcription (currently mock)
- ❌ Real-time transcription
- ❌ Audio effects

### Visualization
- ✅ Graph view of connections
- ✅ Note and tag nodes
- ✅ Link visualization
- ❌ Force simulation
- ❌ 3D visualization

### UI/UX
- ✅ Dark/Light theme toggle
- ✅ Sidebar navigation
- ✅ Search bar
- ✅ Keyboard shortcuts
- ✅ Responsive layout
- ✅ Smooth animations
- ✅ Loading states

## Performance Optimization

1. **React Optimization**:
   - useCallback for event handlers
   - useMemo for expensive calculations
   - Lazy rendering patterns
   - Component splitting

2. **Build Optimization**:
   - `output: 'standalone'` (optimized bundle)
   - CSS modules with Tailwind
   - Image optimization (Next.js Image)
   - Font optimization

3. **Runtime**:
   - Zustand (lightweight state)
   - Monaco Editor (lazy load)
   - Canvas for Graph (efficient rendering)
   - IndexedDB ready (for persistence)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + N | New note |
| Ctrl/Cmd + K | Focus search |
| Ctrl/Cmd + 1 | Editor view |
| Ctrl/Cmd + 2 | Graph view |
| Ctrl/Cmd + 3 | Split view |
| Ctrl/Cmd + S | Toggle sidebar |
| Escape | Close modals |

## Accessibility

- ARIA labels on all interactive elements
- Semantic HTML (nav, main, section, etc.)
- Color contrast (WCAG AA)
- Keyboard navigation support
- Screen reader friendly
- Focus management in modals

## Build Information

- **Next.js 15**: App Router, React 19
- **Output**: Standalone (containerization ready)
- **Bundle**: Optimized with tree-shaking
- **Strict Mode**: TypeScript strict + React strict

## Environment Variables

**Development** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Production** (`.env.production.local`):
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Testing

Currently: **No tests** (add with Jest/Vitest)

Recommended:
- Unit tests for utils, stores, hooks
- Component tests for UI
- E2E tests for critical flows

## Known Limitations

1. **Data Persistence**: All data in memory (lost on refresh)
2. **Audio Transcription**: Currently mocked (see INTEGRATION.md)
3. **Search**: Simple client-side filtering only
4. **No Backend**: All operations local
5. **No Authentication**: Anyone can access
6. **Performance**: Large note count (1000+) may slow down

## Next Steps

1. Add localStorage persistence
2. Integrate with real API (see INTEGRATION.md)
3. Add backend for database storage
4. Implement tests
5. Setup CI/CD
6. Deploy to Vercel

---

**See Also**:
- `docs/ARCHITECTURE.md` - System overview
- `docs/INTEGRATION.md` - API connection
- `docs/PATTERNS.md` - Design patterns

/**
 * Mock data constants - Centralized source of truth
 * NO HARDCODED MOCK DATA - All mock data is defined here
 */
import { Project, Note } from '@/types/note';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'default',
    name: 'Personal',
    color: '#8B5CF6',
    createdAt: new Date(),
    noteCount: 3,
  },
  {
    id: 'work',
    name: 'Trabajo',
    color: '#3B82F6',
    createdAt: new Date(),
    noteCount: 2,
  },
  {
    id: 'ideas',
    name: 'Ideas',
    color: '#10B981',
    createdAt: new Date(),
    noteCount: 2,
  },
  {
    id: 'learning',
    name: 'Aprendizaje',
    color: '#F59E0B',
    createdAt: new Date(),
    noteCount: 1,
  },
];

export const MOCK_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Bienvenido a SecondBrain',
    content: `# Bienvenido a SecondBrain

Tu **segundo cerebro** personal para capturar y organizar ideas.

## Funcionalidades principales

- **Captura rápida**: Escribe notas de texto o graba audio
- **Organización por proyectos**: Mantén todo organizado
- **Tags**: Categoriza tus notas con etiquetas
- **Vista de grafo**: Visualiza conexiones entre notas
- **Export a Markdown**: Lleva tus notas a donde quieras

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| \`Ctrl+N\` | Nueva nota |
| \`Ctrl+K\` | Buscar |
| \`Ctrl+1\` | Vista editor |
| \`Ctrl+2\` | Vista grafo |
| \`Ctrl+3\` | Vista dividida |

> "El cerebro está diseñado para tener ideas, no para almacenarlas" - David Allen
`,
    tags: ['tutorial', 'inicio'],
    projectId: 'default',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    isPinned: true,
    backlinks: [],
  },
  {
    id: 'note-2',
    title: 'Ideas para el proyecto',
    content: `# Ideas para el proyecto

## Próximos pasos

1. Implementar búsqueda semántica
2. Agregar sincronización cloud
3. Modo offline

## Notas rápidas

- Revisar API de transcripción
- Investigar embeddings para búsqueda
- Diseñar sistema de backlinks automáticos
`,
    tags: ['ideas', 'roadmap'],
    projectId: 'ideas',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isPinned: false,
    backlinks: ['note-1'],
  },
  {
    id: 'note-3',
    title: 'Reunión de planificación',
    content: `# Reunión de planificación - Q1

**Fecha**: Esta semana
**Participantes**: Equipo completo

## Agenda

1. Review de OKRs
2. Planificación de sprints
3. Asignación de recursos

## Notas

- Priorizar MVP para demo
- Definir métricas de éxito
- Coordinar con diseño
`,
    tags: ['trabajo', 'reuniones'],
    projectId: 'work',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isPinned: false,
    backlinks: [],
  },
  {
    id: 'note-4',
    title: 'Apuntes de React Hooks',
    content: `# React Hooks - Apuntes

## useState

\`\`\`javascript
const [state, setState] = useState(initialValue);
\`\`\`

## useEffect

\`\`\`javascript
useEffect(() => {
  // Efecto
  return () => {
    // Cleanup
  };
}, [dependencies]);
\`\`\`

## useCallback vs useMemo

- **useCallback**: Memoriza funciones
- **useMemo**: Memoriza valores calculados
`,
    tags: ['aprendizaje', 'react', 'código'],
    projectId: 'learning',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isPinned: false,
    backlinks: [],
  },
  {
    id: 'note-5',
    title: 'Lista de lectura',
    content: `# Lista de lectura

## En progreso

- [ ] Building a Second Brain - Tiago Forte
- [ ] Atomic Habits - James Clear

## Por leer

- [ ] Deep Work - Cal Newport
- [ ] The Mom Test - Rob Fitzpatrick

## Completados

- [x] Zero to One - Peter Thiel
- [x] The Lean Startup - Eric Ries
`,
    tags: ['personal', 'libros'],
    projectId: 'default',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    isPinned: false,
    backlinks: [],
  },
];

export const DEFAULT_VALUES = {
  note: {
    title: 'Nueva nota',
    content: '',
    tags: [] as string[],
  },
  project: {
    name: 'Nuevo proyecto',
    color: '#3B82F6',
  },
};

export const FALLBACK_VALUES = {
  project: {
    id: 'default',
    name: 'Personal',
  },
  note: {
    title: 'Nueva nota',
    content: '',
  },
} as const;

/**
 * Numeric constants - NO MAGIC NUMBERS
 */
export const NUMERIC_CONSTANTS = {
  recentNotesLimit: 10,
  projectNotesLimit: 10,
  edgeStrength: {
    default: 0.5,
    multiplier: 2,
  },
  nodeSize: {
    default: 8,
  },
  canvas: {
    lineWidth: 2,
    fontSize: 12,
    labelOffset: 15,
  },
} as const;


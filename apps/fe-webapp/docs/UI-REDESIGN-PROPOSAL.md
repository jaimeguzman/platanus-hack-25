# Propuesta de Rediseño UI - SecondBrain
## Inspiración: Obsidian para Web

---

## 1. ANÁLISIS DE LA UI ACTUAL

### Fortalezas
- Monaco Editor profesional con syntax highlighting
- Graph view interactivo con canvas
- Sistema de proyectos con colores
- Tema oscuro/claro bien implementado
- Keyboard shortcuts (Ctrl+N, Ctrl+K, etc.)
- Organización por proyectos y tags

### Oportunidades de Mejora
- **Demasiada información visual** en el header y sidebar
- **Botones muy evidentes** (menos minimalista)
- **No hay sistema de tabs** para múltiples notas abiertas
- **Búsqueda básica** (sin comando palette)
- **Editor fijo** (sin modo WYSIWYG/preview inline)
- **Breadcrumbs simples** (sin navegación de backlinks)
- **Sin modo focus/zen** para escritura concentrada
- **Graph view básico** (sin filtros ni grupos)

---

## 2. PROPUESTA DE MEJORAS INSPIRADAS EN OBSIDIAN

### 2.1. COMMAND PALETTE (Paleta de Comandos)
**Inspiración**: Obsidian Cmd+P / Ctrl+P

**Implementación**:
```typescript
// Reemplazar la búsqueda simple por una paleta unificada
- Ctrl+P: Quick switcher (cambiar entre notas)
- Ctrl+Shift+P: Command palette (acciones)
- Fuzzy search con coincidencias parciales
- Mostrar path completo y vista previa
- Actions: "New note", "New project", "Toggle theme", "Export", etc.
```

**Beneficios**:
- Menos botones en UI (más limpio)
- Navegación más rápida (100% keyboard)
- Búsqueda más potente (fuzzy matching)

---

### 2.2. SISTEMA DE TABS MÚLTIPLES
**Inspiración**: Obsidian tabs for multiple notes

**Implementación**:
```typescript
// Tabs horizontales sobre el editor
- Click en nota → abre en tab nueva
- Ctrl+W: cerrar tab activo
- Ctrl+Tab: cambiar entre tabs
- Middle click: cerrar tab
- Arrastrar tabs para reordenar
- Pin tabs (mantener fijas)
- Indicador de nota modificada (dot en tab)
```

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────────┐
│ [×] Bienvenida  [×] Ideas proyecto  [×] Reunión *  [📌] TODO│
├─────────────────────────────────────────────────────────────┤
│                    Editor Content                           │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.3. SIDEBAR MINIMALISTA Y COLAPSABLE
**Inspiración**: Obsidian clean sidebar con iconos

**Cambios**:
- **Ribbon lateral izquierdo** (iconos verticales) para cambiar vistas:
  - Files (explorador)
  - Search (búsqueda global)
  - Graph (vista de grafo)
  - Tags (nube de tags)
  - Bookmarks (notas favoritas)

- **File Explorer más limpio**:
  - Sin badges de conteo (solo al hover)
  - Colores de proyecto más sutiles (dot/line, no fondo)
  - Tree view con indent mínimo
  - Iconos de archivo pequeños
  - Hover para acciones (no botones permanentes)

**UI Mockup**:
```
┌─┬────────────┬────────────────────────────────────────┐
│ ││ Proyectos  │ Editor                                 │
│📁││            │                                        │
│🔍││ ● Personal │                                        │
│📊││   › Idea 1 │                                        │
│🏷││   › Idea 2 │                                        │
│⭐││            │                                        │
│ ││ ● Trabajo  │                                        │
│ ││   › Nota   │                                        │
└─┴────────────┴────────────────────────────────────────┘
```

---

### 2.4. EDITOR WYSIWYG MEJORADO
**Inspiración**: Obsidian Live Preview

**Implementación**:
- **Hybrid Editor Mode**:
  - Markdown syntax visible mientras editas
  - Preview inline inmediato (sin toggle)
  - Headers renderizados con tamaño real
  - Links clickeables en preview
  - Checkbox interactivos `- [ ]`
  - Code blocks con syntax highlighting en vivo

- **Editor Improvements**:
  - Typewriter mode (cursor siempre centrado)
  - Focus mode (dimming de líneas no activas)
  - Line numbers opcionales
  - Word count en status bar

**Tech Stack sugerido**:
- Reemplazar Monaco por **CodeMirror 6** (mejor para markdown WYSIWYG)
- O usar **TipTap** (ProseMirror wrapper, excelente para WYSIWYG)
- O mantener Monaco + custom decorators para preview inline

---

### 2.5. BREADCRUMBS INTELIGENTES
**Inspiración**: Obsidian breadcrumbs with backlinks

**Implementación**:
```typescript
// Header breadcrumb mejorado
Proyecto › Nota actual
  ↓ (expandible)
Backlinks: [Nota A] [Nota B] [Nota C]
Outlinks: [Referencia 1] [Referencia 2]
```

**Features**:
- Mostrar notas que referencian la actual
- Click en breadcrumb para quick jump
- Dropdown con related notes
- Graph view miniatura en tooltip

---

### 2.6. RIGHT SIDEBAR (Outline + Backlinks)
**Inspiración**: Obsidian right sidebar

**Implementación**:
```
┌──────────────────┬────────────────────┬──────────────┐
│ Files            │ Editor             │ Outline      │
│                  │                    │              │
│ Projects         │ # Title            │ # Title      │
│ › Personal       │ ## Section 1       │ ## Section 1 │
│ › Work           │ ## Section 2       │ ## Section 2 │
│                  │                    │ ### Sub      │
│                  │                    │              │
│                  │                    │ Backlinks (3)│
│                  │                    │ › Note A     │
│                  │                    │ › Note B     │
└──────────────────┴────────────────────┴──────────────┘
```

**Features**:
- **Outline**: TOC generado de headers
- **Backlinks**: notas que referencian esta
- **Tags panel**: tags usados en nota actual
- **Calendar**: para daily notes (futuro)
- Toggle independiente del left sidebar

---

### 2.7. MODO FOCUS/ZEN
**Inspiración**: Obsidian distraction-free mode

**Implementación**:
```typescript
// F11 o Ctrl+Shift+F: Focus mode
- Ocultar sidebars (left + right)
- Ocultar header (solo breadcrumb mínimo)
- Centered writing (max-width: 750px)
- Typewriter scroll
- Dimmed UI elements
```

---

### 2.8. GRAPH VIEW MEJORADO
**Inspiración**: Obsidian interactive graph

**Mejoras**:
- **Filtros interactivos**:
  - Por proyecto (color)
  - Por tags
  - Por fecha (notas recientes)
  - Por número de connections

- **Grupos visuales**:
  - Cluster por proyecto
  - Tamaño de nodo según # backlinks
  - Grosor de edge según # referencias

- **Interacciones**:
  - Hover muestra preview de nota
  - Click abre en nuevo tab (no cambia vista)
  - Drag para reorganizar layout
  - Local graph (solo connections de nota actual)

- **Physics engine**:
  - Force-directed layout (d3-force)
  - Animaciones suaves
  - Grupos con gravedad

**Tech Stack**:
- Migrar de Canvas a **D3.js** o **Vis.js** o **Cytoscape.js**
- Mejor performance y features out-of-the-box

---

### 2.9. TEMAS Y STYLING REFINADO
**Inspiración**: Obsidian minimalist themes

**Paleta propuesta** (Obsidian-like):
```css
/* Dark Theme (Default) */
--background: #202020;        /* Más gris, menos negro puro */
--background-secondary: #1a1a1a;
--background-primary-alt: #141414;
--text-normal: #dcddde;
--text-muted: #999999;
--text-faint: #666666;
--accent: #7f6df2;           /* Purple más suave */
--accent-hover: #8875ff;

/* Menos bordes, más sombras */
--border: transparent;
--shadow: rgba(0,0,0,0.3);

/* Typography */
--font-interface: -apple-system, BlinkMacSystemFont, "Segoe UI";
--font-text: "Inter", -apple-system;
--font-monospace: "JetBrains Mono", "Fira Code", monospace;
```

**UI Refinements**:
- Remover la mayoría de bordes (usar sombras sutiles)
- Rounded corners mínimos (4px max)
- Hover states más sutiles
- Transitions suaves (150ms ease-out)
- Iconos más pequeños y monocromáticos
- Menos color, más contraste

---

### 2.10. STATUS BAR
**Inspiración**: Obsidian bottom status bar

**Implementación**:
```
┌─────────────────────────────────────────────────────────┐
│ Editor content...                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
│ 📝 5 words | 25 chars | 3 lines  •  UTF-8  •  Markdown │
```

**Info mostrada**:
- Word count / char count
- Line count
- File encoding
- Language mode
- Current time (opcional)
- Sync status (futuro)

---

### 2.11. QUICK ACTIONS (Floating Button)
**Inspiración**: Notion-like slash commands + Obsidian quick add

**Implementación**:
- `/` en editor → Command menu inline
  - `/task` → checkbox list
  - `/code` → code block
  - `/quote` → blockquote
  - `/table` → markdown table
  - `/daily` → daily note

- `[[` → Note link autocomplete
- `#` → Tag autocomplete
- `@` → People/contacts (futuro)

---

### 2.12. DRAG & DROP MEJORADO
**Inspiración**: Obsidian file operations

**Features**:
- Drag note to project (move)
- Drag image to editor (upload + insert)
- Drag audio to transcribe
- Drag note to graph (highlight connections)
- Drag tab to split pane (futuro)

---

## 3. ARQUITECTURA DE COMPONENTES PROPUESTA

### Nueva estructura
```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Container principal
│   │   ├── CommandPalette.tsx    # Ctrl+P
│   │   ├── LeftRibbon.tsx        # Icon sidebar
│   │   ├── LeftSidebar.tsx       # File explorer
│   │   ├── RightSidebar.tsx      # Outline/Backlinks
│   │   ├── StatusBar.tsx         # Bottom bar
│   │   └── TabBar.tsx            # Tabs de notas
│   │
│   ├── editor/
│   │   ├── LivePreviewEditor.tsx # WYSIWYG editor
│   │   ├── EditorToolbar.tsx     # Minimal toolbar
│   │   ├── MarkdownRenderer.tsx  # Preview component
│   │   └── SlashCommands.tsx     # / menu
│   │
│   ├── graph/
│   │   ├── GraphView3D.tsx       # D3-powered graph
│   │   ├── GraphFilters.tsx      # Sidebar filters
│   │   ├── LocalGraph.tsx        # Single note graph
│   │   └── GraphLegend.tsx       # Color key
│   │
│   ├── sidebar/
│   │   ├── FileExplorer.tsx      # Tree view
│   │   ├── OutlineView.tsx       # TOC
│   │   ├── BacklinksPanel.tsx    # Related notes
│   │   ├── TagsPanel.tsx         # Tag browser
│   │   └── SearchPanel.tsx       # Global search
│   │
│   └── ui/
│       ├── fuzzy-search/         # Fuzzy finder
│       ├── virtual-list/         # Performance
│       └── tooltip/              # Rich tooltips
│
├── hooks/
│   ├── useCommandPalette.ts
│   ├── useTabs.ts
│   ├── useBacklinks.ts
│   ├── useFocusMode.ts
│   └── useEditorState.ts
│
└── stores/
    ├── tabsStore.ts              # Multi-tab state
    ├── uiStore.ts                # Sidebar collapse, etc.
    └── pkmStore.ts               # Existing (refactor)
```

---

## 4. TECH STACK UPGRADES SUGERIDOS

### Editor
- **Opción 1**: CodeMirror 6 (mejor para markdown WYSIWYG)
- **Opción 2**: TipTap (ProseMirror, excelente UX)
- **Opción 3**: Mantener Monaco + decorators custom

### Graph
- **D3.js** v7 (force simulation)
- **react-force-graph** (wrapper React optimizado)
- **Cytoscape.js** (alternativa robusta)

### Search
- **Fuse.js** (fuzzy search)
- **FlexSearch** (más rápido, full-text)

### UI Components
- Mantener Radix UI (accessibility)
- Agregar **@radix-ui/react-tabs**
- Agregar **@radix-ui/react-command** (para palette)
- Agregar **cmdk** (Vercel's command palette)

### Performance
- **react-virtuoso** (virtual lists para sidebars)
- **react-window** (alternativa)

---

## 5. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Foundation (1-2 semanas)
- [ ] Command Palette (Ctrl+P)
- [ ] Sistema de Tabs
- [ ] Refactor Sidebar (ribbon + explorer)
- [ ] Status Bar
- [ ] Nueva paleta de colores

### Fase 2: Editor UX (1 semana)
- [ ] Live Preview Editor
- [ ] Slash Commands
- [ ] Improved autocomplete
- [ ] Focus Mode

### Fase 3: Sidebars (1 semana)
- [ ] Right Sidebar (Outline)
- [ ] Backlinks Panel
- [ ] Improved File Explorer
- [ ] Search Panel global

### Fase 4: Graph (1 semana)
- [ ] D3.js migration
- [ ] Filters & Groups
- [ ] Local Graph view
- [ ] Preview on hover

### Fase 5: Polish (ongoing)
- [ ] Animations & transitions
- [ ] Keyboard shortcuts refinement
- [ ] Performance optimization
- [ ] Mobile responsive (tablet)

---

## 6. COMPARACIÓN VISUAL: ANTES vs DESPUÉS

### ANTES (Actual)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] SecondBrain        [Search ______] [Botones] [Theme]│
├──────────┬──────────────────────────────────────────────────┤
│          │ Personal > Bienvenido                            │
│ Sidebar  │ ┌──────────────────────────────────────────────┐ │
│ (ancho)  │ │ Title: [____________]                        │ │
│          │ │ [Edit] [Preview]  [Fav] [Save] [Export]     │ │
│ Projects │ │                                               │ │
│ › ...    │ │ Monaco Editor                                │ │
│ › ...    │ │ (dark background)                            │ │
│          │ │                                               │ │
│ Tags     │ └──────────────────────────────────────────────┘ │
│ #...     │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### DESPUÉS (Propuesto)
```
┌─┬────────┬─────────────────────────────────────────┬─────────┐
│ ││        │ [×] Welcome [×] Ideas * [×] Meeting    │         │
│📁││ Files  ├─────────────────────────────────────────┤ Outline │
│🔍││        │ # Welcome to SecondBrain               │         │
│📊││ Proj.  │                                        │ # Title │
│🏷││ › Idea │ Your **second brain** for ideas.       │ ## Sect │
│⭐││ › Work │                                        │         │
│ ││        │ ## Features                            │ Links(2)│
│ ││ Search │ - [ ] Capture notes                    │ › Note1 │
│ ││ [____] │ - [x] Graph view                       │ › Note2 │
│ ││        │                                        │         │
└─┴────────┴─────────────────────────────────────────┴─────────┘
│ 📝 8 words  •  Markdown  •  Last edited 2 min ago            │
└──────────────────────────────────────────────────────────────┘
```

**Cambios clave**:
- Ribbon lateral con iconos (menos ancho)
- Tabs para múltiples notas
- Right sidebar con outline
- Status bar con info útil
- Editor WYSIWYG inline
- Sin header grande (más espacio)
- Sin botones evidentes (más limpio)

---

## 7. PRINCIPIOS DE DISEÑO

### Minimalismo
- Menos es más: ocultar elementos no esenciales
- Iconos sobre texto cuando sea posible
- Hover states para actions secundarias
- Progressive disclosure (info cuando se necesita)

### Performance
- Virtual scrolling en listas largas
- Lazy loading de componentes pesados
- Debounced search
- Memoization agresiva
- Web Workers para graph calculations

### Accessibility
- Mantener Radix UI (ARIA labels)
- Keyboard navigation first
- Focus indicators claros
- Color contrast WCAG AA
- Screen reader friendly

### Responsive
- Mobile-first approach (aunque es PKM desktop-oriented)
- Collapsible sidebars
- Touch-friendly targets (44px mínimo)
- Adaptive layout para tablets

---

## 8. MÉTRICAS DE ÉXITO

### UX Metrics
- **Time to create note**: < 2 segundos (Ctrl+N)
- **Time to find note**: < 3 segundos (Ctrl+P + fuzzy search)
- **Keyboard coverage**: > 90% acciones sin mouse
- **Clicks to action**: reducir 30-50%

### Performance Metrics
- **Initial load**: < 2s (FCP)
- **Graph render**: < 1s para 100 notas
- **Editor input lag**: < 50ms
- **Search results**: < 200ms

### Adoption Metrics
- **User satisfaction**: NPS > 40
- **Feature usage**: Command palette > 80% users
- **Retention**: Daily active users

---

## 9. RIESGOS Y MITIGACIÓN

### Riesgo 1: Complejidad de Editor WYSIWYG
- **Mitigación**: Empezar con CodeMirror 6 (más maduro que custom)
- **Fallback**: Mantener Monaco como opción en settings

### Riesgo 2: Performance de Graph con muchas notas
- **Mitigación**: Web Workers + virtual viewport + lazy rendering
- **Limit**: Renderizar max 500 nodes, filtrar resto

### Riesgo 3: Learning curve de nuevos shortcuts
- **Mitigación**: Onboarding tour + cheatsheet + mantener shortcuts actuales

### Riesgo 4: Breaking changes en UX
- **Mitigación**: Feature flags + gradual rollout + user feedback

---

## 10. CONCLUSIÓN

Esta propuesta transforma SecondBrain en una experiencia más cercana a Obsidian, manteniendo su identidad web-first y agregando:

1. **Command Palette** → Navegación ultrarrápida
2. **Multi-tabs** → Trabajo paralelo en notas
3. **WYSIWYG Editor** → Mejor experiencia de escritura
4. **Sidebars mejorados** → Outline + Backlinks + Explorer minimalista
5. **Graph avanzado** → Filtros + grupos + preview
6. **Focus Mode** → Escritura sin distracciones
7. **UI minimalista** → Menos botones, más espacio

**Resultado esperado**: Una herramienta PKM profesional, rápida, elegante y potente que combine lo mejor de Obsidian con la accesibilidad de una web app.

---

**Siguiente paso**: ¿Quieres que implemente alguna de estas features en particular? Sugiero empezar por:
1. Command Palette (alto impacto, alcance medio)
2. Sistema de Tabs (alto impacto, alcance bajo)
3. Refinamiento visual (quick win)

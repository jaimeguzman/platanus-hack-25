# Reglas básicas

- Ningún archivo puede medir más de 300 líneas de código
- Para usar la librería de supabase usaremos siempre un singleton
- NO STATIC FALLBACKS
- NO HARDCODED VALUES
- Respetar siempre KISS, YAGNI y DRY
- SIEMPRE que algún archivo supere las 290 líneas de código, se debe pensar en hacer una descomposición funcional en varios archivos, que mantenga el fondo y forma del objetivo del código pero adicionalmente pueda reflejar todo el esfuerzo de mantener un código limpio y TOKEN OPTIMIZED

# Desktop App - Cognitiv

- Esta es la aplicación de escritorio (Electron) de Cognitiv, un Segundo Cerebro digital optimizado por AI
- La aplicación desktop replica EXACTAMENTE la funcionalidad de la webapp pero en formato nativo multiplataforma
- La app está construida con Electron + Vite + React + TypeScript
- Usa Shadcn/UI + Tailwind CSS 3 para la interfaz

## Características Desktop

- Aplicación nativa para macOS, Windows y Linux
- Ventana principal con sidebar de navegación
- Dashboard, Editor de notas, Vista de grafo y Chat con AI
- Sistema tray con menú contextual
- Global shortcuts para mostrar/ocultar la app (Cmd/Ctrl + Shift + C)
- Auto-launch opcional al inicio del sistema

## Pilares de Información

Los 3 pilares importantes son:
1. Desarrollo de Carrera
2. Social
3. Hobby

## Funcionalidades

- El usuario puede incluir notas en formato markdown con extensión `.md`
- Las notas tienen tags para categorización
- Se pueden descargar, visualizar (preview mode) y compartir
- Notas de voz con transcripción automática
- Modo graph como Obsidian, donde cada nodo es un cluster de información
- Integración con servicios RAG para categorización automática

## Stack Tecnológico

- **Runtime:** Electron 39.2.0
- **Build Tool:** Vite 6.3.5
- **Framework:** React 19.2.0 + TypeScript 5.9.3
- **UI:** Shadcn/UI + Tailwind CSS 3.4.18
- **Estado:** Zustand 5.0.2
- **Backend:** Supabase + APIs REST (RAG, STT)
- **Visualización:** D3.js 7.9.0
- **Markdown:** React Markdown + Syntax Highlighter

## Estructura del Proyecto

```
desktop-cognitiv/
├── electron/           # Archivos de Electron
│   ├── main.js        # Proceso principal
│   └── preload.js     # Script de preload
├── src/               # Código fuente React
│   ├── components/    # Componentes UI
│   ├── services/      # Servicios backend
│   ├── stores/        # Estado Zustand
│   ├── hooks/         # Custom hooks
│   ├── types/         # TypeScript types
│   ├── constants/     # Constantes
│   ├── lib/           # Utilidades
│   ├── data/          # Mock data
│   ├── App.tsx        # Componente principal
│   ├── main.tsx       # Entrada de la app
│   └── index.css      # Estilos globales
├── public/            # Assets estáticos
├── build/             # Iconos para builds
├── dist/              # Build de Vite
├── release/           # Builds de Electron
└── package.json       # Dependencias y scripts
```

## Variables de Entorno

Todas las variables usan el prefijo `VITE_` (requerido por Vite):

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
VITE_STT_API_URL=http://localhost:8001
VITE_RAG_API_URL=http://localhost:8002
VITE_ANTHROPIC_API_KEY=
```

## Scripts Disponibles

```bash
npm run dev                # Desarrollo web (solo Vite)
npm run electron:dev       # Desarrollo Electron (Vite + Electron)
npm run build             # Build de producción (Vite)
npm run electron:build    # Build completo (Vite + Electron Builder)
npm run dist              # Crear instalador para el SO actual
npm run dist:mac          # Crear instalador para macOS
npm run dist:win          # Crear instalador para Windows
npm run dist:linux        # Crear instalador para Linux
npm run type-check        # Verificar tipos TypeScript
npm run lint              # Linter
npm run validate          # Lint + Type-check + Build
```

## Desarrollo

1. Instalar dependencias: `npm install`
2. Configurar `.env` basándose en `.env.example`
3. Ejecutar en modo desarrollo: `npm run electron:dev`

## Builds de Producción

Para crear instaladores nativos:

```bash
# macOS (DMG con arquitecturas x64 y arm64)
npm run dist:mac

# Windows (NSIS installer)
npm run dist:win

# Linux (AppImage)
npm run dist:linux
```

Los instaladores se generan en la carpeta `release/`.

## Diferencias con la Webapp

- **Routing:** No usa Next.js router, todo en un solo componente App
- **Variables de entorno:** `import.meta.env.VITE_*` en lugar de `process.env.NEXT_PUBLIC_*`
- **Build:** Vite en lugar de Next.js
- **No SSR:** Todo renderizado en cliente
- **Window API:** Acceso a `window.electronAPI` para funciones nativas
- **Directivas:** Sin `'use client'` (innecesario fuera de Next.js)

## Integración Electron

La app puede detectar si está corriendo en Electron:

```typescript
if (window.electronAPI?.isElectron) {
  // Funcionalidad específica de Electron
  await window.electronAPI.setAutoLaunch(true);
  const version = await window.electronAPI.getAppVersion();
}
```

## Seguridad

- **Context Isolation:** Habilitado
- **Node Integration:** Deshabilitado
- **Remote Module:** Deshabilitado
- **Preload Script:** Único punto de comunicación IPC
- **CSP:** Configurado para producción

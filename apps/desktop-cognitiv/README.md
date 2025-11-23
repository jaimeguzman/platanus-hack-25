# Cognitiv Desktop

Segundo Cerebro digital optimizado por AI - Aplicación de escritorio multiplataforma.

## Descripción

Cognitiv Desktop es la versión nativa de escritorio de Cognitiv, una aplicación para generar y gestionar conocimiento personal. Permite capturar, organizar y visualizar información a través de notas, notas de voz y un grafo interactivo de conocimiento.

## Características

- ✅ Editor de notas en Markdown con vista previa en tiempo real
- ✅ Notas de voz con transcripción automática
- ✅ Visualización de grafo de conocimiento interactivo (estilo Obsidian)
- ✅ Chat con AI para consultas sobre tu conocimiento
- ✅ Categorización automática en 3 pilares: Carrera, Social, Hobby
- ✅ Integración con RAG (Retrieval Augmented Generation)
- ✅ Sistema de tags y búsqueda avanzada
- ✅ Tema claro/oscuro
- ✅ Multiplataforma: macOS, Windows, Linux

## Stack Tecnológico

- **Electron** 39.2.0 - Framework para apps de escritorio
- **Vite** 6.3.5 - Build tool ultrarrápido
- **React** 19.2.0 - Framework UI
- **TypeScript** 5.9.3 - Tipado estático
- **Tailwind CSS** 3.4.18 - Framework CSS
- **Shadcn/UI** - Componentes UI modernos
- **Zustand** - Gestión de estado
- **D3.js** - Visualización de grafos

## Requisitos

- Node.js >= 20.0.0
- npm o pnpm

## Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd platanus-hack-25-desktop/apps/desktop-cognitiv

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

## Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run electron:dev

# Solo desarrollo web (sin Electron)
npm run dev

# Verificar tipos
npm run type-check

# Linter
npm run lint

# Validar todo
npm run validate
```

## Build de Producción

```bash
# Build web
npm run build

# Build completo (web + Electron)
npm run electron:build

# Crear instalador para tu SO
npm run dist

# Crear instalador específico
npm run dist:mac    # macOS (DMG)
npm run dist:win    # Windows (NSIS)
npm run dist:linux  # Linux (AppImage)
```

Los instaladores se generan en `release/`.

## Configuración

Crear un archivo `.env` basado en `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
VITE_STT_API_URL=http://localhost:8001
VITE_RAG_API_URL=http://localhost:8002
VITE_ANTHROPIC_API_KEY=your-api-key
```

## Estructura del Proyecto

```
desktop-cognitiv/
├── electron/          # Proceso principal de Electron
├── src/
│   ├── components/   # Componentes React
│   ├── services/     # Servicios backend
│   ├── stores/       # Estado global (Zustand)
│   ├── hooks/        # Custom React hooks
│   ├── types/        # TypeScript types
│   ├── constants/    # Constantes
│   ├── lib/          # Utilidades
│   └── App.tsx       # Componente principal
├── public/           # Assets estáticos
└── package.json      # Dependencias
```

## Atajos de Teclado

- `Cmd/Ctrl + Shift + C` - Mostrar/ocultar aplicación (global)
- `Cmd/Ctrl + Q` - Salir de la aplicación
- `Cmd/Ctrl + H` - Ocultar ventana

## Troubleshooting

### La app no se inicia en desarrollo

1. Verifica que el puerto 5173 esté libre
2. Asegúrate de tener Node.js >= 20
3. Reinstala dependencias: `rm -rf node_modules && npm install`

### Error de build en producción

1. Limpia builds anteriores: `npm run clean`
2. Verifica permisos de escritura en `dist/` y `release/`
3. Revisa logs de Electron Builder

### Problemas con variables de entorno

1. Verifica que el archivo `.env` existe
2. Todas las variables deben tener prefijo `VITE_`
3. Reinicia el servidor de desarrollo después de cambiar `.env`

## Contribuir

Ver `AGENTS.md` para reglas de desarrollo y arquitectura del proyecto.

## Licencia

MIT

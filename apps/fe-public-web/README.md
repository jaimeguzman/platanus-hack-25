# SecondBrain - Landing Page Pública

Landing page minimalista en español para SecondBrain, un sistema de gestión de conocimiento personal con IA.

## Stack Tecnológico

- **Next.js 15.5.6** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Diseño responsivo y utilidades CSS
- **Lucide React** - Iconos consistentes
- **Node.js 20+** - Runtime

## Estructura

```
src/
├── app/
│   ├── layout.tsx       # Layout raíz
│   ├── page.tsx         # Página principal
│   └── globals.css      # Estilos globales
├── components/
│   ├── Header.tsx       # Navegación principal
│   ├── Footer.tsx       # Pie de página
│   ├── chat/            # 🆕 Componentes de chat
│   │   ├── AudioPlayer.tsx
│   │   ├── AudioRecorder.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   └── sections/
│       ├── Hero.tsx     # Sección principal
│       ├── Features.tsx # Características
│       ├── HowItWorks.tsx # Cómo funciona
│       ├── Chat.tsx     # 🆕 Demo interactivo de chat
│       ├── Testimonials.tsx # Testimonios
│       ├── Pricing.tsx  # Precios
│       └── CTA.tsx      # Llamada a acción
├── hooks/
│   ├── useAudioRecorder.ts # Hook para grabación de audio
│   └── useAudioPlayer.ts   # Hook para reproducción de audio
├── services/
│   └── chatService.ts      # Servicio de gestión de mensajes
├── types/
│   └── chat.ts            # Tipos TypeScript para chat
└── lib/
    └── cn.ts              # Utilidades CSS
```

## Instalación

```bash
# Instalar dependencias
npm install

# Crear archivo .env.local (opcional)
cp .env.example .env.local
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

## Validación

```bash
# Lint
npm run lint

# Type checking
npm run type-check

# Build
npm run build

# Validación completa
npm run validate
```

## Características de la Landing

✨ **Diseño Minimalista**
- Paleta de colores oscura y profesional
- Tipografía clara e legible
- Espacios en blanco generosos

🎯 **Secciones**
1. **Hero** - Propuesta de valor clara
2. **Features** - 6 características principales con iconos
3. **How It Works** - 4 pasos simples del proceso
4. **Chat Demo** - 🆕 Demo interactivo de SecondBrain (ver abajo)
5. **Testimonials** - 4 testimonios de usuarios
6. **Pricing** - 3 planes (Gratuito, Pro, Team)
7. **CTA** - Llamada a acción final

📱 **Responsive**
- Diseño mobile-first
- Adaptado para tablets y desktop
- Navegación móvil funcional

🌐 **Internacionalización**
- Completamente en español
- Fácil de adaptar a otros idiomas

## 💬 Componente de Chat Interactivo

El proyecto incluye un componente de chat completo que permite a los usuarios probar SecondBrain directamente desde la landing page.

### Funcionalidades

✅ **Mensajes de Texto**
- Input con textarea expandible automáticamente
- Envío con Enter (Shift+Enter para nueva línea)
- Estados visuales: enviando, enviado, error con retry

✅ **Mensajes de Audio**
- **Grabación en vivo**:
  - Click en botón de micrófono para iniciar
  - Contador de tiempo en vivo
  - Gesto de deslizar para cancelar
  - Formato: WebM con codec Opus (16kHz, mono)
  
- **Adjuntar archivos**:
  - Soporte para MP3, WAV, OGG, M4A, AAC, FLAC, WMA
  - Detección automática de duración
  
- **Reproducción**:
  - Controles de play/pause
  - Barra de progreso visual
  - Contador de tiempo actual/total

### Request Object

El componente prepara automáticamente un payload completo para enviar al API:

```typescript
{
  id: string;                    // UUID único
  type: 'text' | 'audio';        // Tipo de mensaje
  text?: string;                 // Contenido (si es texto)
  audioFileName?: string;        // Nombre del archivo
  audioDuration?: number;        // Duración en ms
  audioBase64?: string;          // Audio codificado en base64
  audioSize?: number;            // Tamaño en bytes
  timestamp: string;             // ISO 8601
}
```

### Ver Request en Consola

Los payloads se imprimen automáticamente en la consola del navegador:

```
═══════════════════════════════════════════
📤 API REQUEST
═══════════════════════════════════════════
URL: No configurada
Payload:
{
  "id": "a1b2c3d4-...",
  "type": "audio",
  "audioFileName": "recording_1234567890.webm",
  "audioDuration": 5240,
  "audioBase64": "GkXfo59ChoEBQveBAULygQRC84EIQoKEd0... (123456 chars)",
  "audioSize": 92592,
  "timestamp": "2025-11-22T15:30:45.123Z"
}
═══════════════════════════════════════════
```

### Tecnologías del Chat

- **MediaRecorder API** para grabación de audio
- **HTMLAudioElement** para reproducción
- **Custom Hooks** (`useAudioRecorder`, `useAudioPlayer`)
- **Singleton Service** para gestión de estado
- **TypeScript** para type safety completo

### Configurar API Backend

Para conectar con tu backend, edita `src/services/chatService.ts`:

```typescript
// Configurar URL del API
chatService.setApiUrl('https://tu-api.com/endpoint');

// Descomentar la llamada fetch en el método sendToApi
```

### Probar el Chat

1. Inicia el servidor de desarrollo: `npm run dev`
2. Abre `http://localhost:3000`
3. Scrollea hasta "Prueba SecondBrain ahora"
4. Envía mensajes de texto o audio
5. Revisa la consola del navegador para ver los payloads

### Permisos del Navegador

El chat requiere permisos de micrófono para grabar audio. El navegador los solicitará automáticamente.

### Documentación Completa

Ver `CHAT-COMPONENT.md` para documentación técnica detallada.

## Temas de Color

```
Background:    #0F0F0F (Oscuro profundo)
Foreground:    #E5E5E5 (Blanco opaco)
Card:          #1A1A1A (Gris muy oscuro)
Card Border:   #2A2A2A (Gris oscuro)
Text Secondary:#999999 (Gris medio)
Accent:        #3B82F6 (Azul)
```

## Deployment

### AWS Amplify

```bash
# Conectar repositorio GitHub
# Amplify detectará automáticamente Next.js

# Build command
next build

# Start command
next start
```

### Vercel

```bash
# Opción más sencilla para Next.js
npm install -g vercel
vercel
```

## Próximas Mejoras

### Landing Page
- [ ] Integrar formulario de email
- [ ] Agregar más secciones (Use Cases por rol)
- [ ] Blog integrado
- [ ] Dark/Light mode toggle
- [ ] Analytics (Plausible o Mixpanel)

### Componente Chat
- [ ] Implementar WebSocket para respuestas en tiempo real
- [ ] Agregar compresión de audio antes de enviar
- [ ] Caché de mensajes en localStorage
- [ ] Indicador de "escribiendo..."
- [ ] Visualización de waveform durante grabación
- [ ] Soporte para emojis y markdown
- [ ] Mensajes del asistente (respuestas del servidor)

## Licencia

MIT

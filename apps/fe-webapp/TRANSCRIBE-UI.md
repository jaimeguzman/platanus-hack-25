# Speech-to-Text UI - Guía de Uso

## Descripción

UI simple y elegante en Next.js 15 para probar la API de transcripción de audio usando OpenAI Whisper.

## Características

✅ Interfaz limpia y minimalista
✅ Soporte drag & drop para archivos
✅ Selección de idioma (más de 10 idiomas)
✅ Validación de archivos
✅ Feedback visual del proceso
✅ Copiar transcripción al portapapeles
✅ Diseño responsive
✅ Tema oscuro consistente con el PKM

## Cómo usar

### 1. Iniciar el backend (API)

En una terminal:

```bash
cd apis/api-sst
./dev.sh
```

La API estará en: `http://localhost:8000`

### 2. Iniciar el frontend (Next.js)

En otra terminal:

```bash
cd apps/fe-webapp
npm run dev
```

La app estará en: `http://localhost:3000`

### 3. Probar la transcripción

1. Abre: http://localhost:3000/transcribe
2. Click en el área de upload o arrastra un archivo de audio
3. (Opcional) Selecciona el idioma
4. Click en "Transcribir Audio"
5. Espera la transcripción
6. Copia el texto o haz una nueva transcripción

## Navegación

La app tiene dos secciones accesibles desde la navegación superior derecha:

- **PKM** - Sistema de gestión de conocimiento personal
- **Transcribir Audio** - Herramienta de transcripción (Speech-to-Text)

## Variables de Entorno

El endpoint de la API se configura en `.env.local`:

```bash
# Desarrollo local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Producción (AWS Lambda)
# NEXT_PUBLIC_API_URL=https://tu-api.execute-api.region.amazonaws.com/prod
```

## Formatos de audio soportados

- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- FLAC (.flac)
- OGG (.ogg)
- WEBM (.webm)

**Límite:** 25MB (límite de OpenAI Whisper)

## Idiomas disponibles

- Español (es)
- English (en)
- Français (fr)
- Deutsch (de)
- Italiano (it)
- Português (pt)
- 中文 (zh)
- 日本語 (ja)
- 한국어 (ko)
- Y más...

## Deployment en AWS Amplify

### Configuración

1. **Variables de entorno en Amplify:**

```
NEXT_PUBLIC_API_URL=https://tu-api-gateway-url.amazonaws.com/prod
```

2. **Build settings** (amplify.yml):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. La app se construye automáticamente con `output: 'standalone'` configurado en `next.config.ts`

## Estructura de archivos

```
apps/fe-webapp/
├── src/
│   └── app/
│       ├── transcribe/
│       │   └── page.tsx        # Página de transcripción
│       ├── layout.tsx          # Layout con navegación
│       └── globals.css
├── .env.local                  # Variables de entorno (local)
├── .env.example                # Ejemplo de variables
└── TRANSCRIBE-UI.md           # Esta guía
```

## Troubleshooting

### Error: "Failed to fetch"

**Causa:** La API no está corriendo o la URL es incorrecta.

**Solución:**
1. Verifica que la API esté corriendo: `curl http://localhost:8000/docs`
2. Verifica `.env.local` tenga la URL correcta
3. Reinicia el servidor Next.js

### Error: "Error en la transcripción"

**Causa:** La API retornó un error.

**Solución:**
1. Verifica los logs de la API
2. Verifica que el archivo sea un audio válido
3. Verifica que el archivo sea menor a 25MB
4. Verifica que `OPENAI_API_KEY` esté configurada en la API

### CORS Error

**Causa:** La API no permite requests desde el frontend.

**Solución:**
Agrega CORS a la API (FastAPI):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Roadmap

- [ ] Grabación de audio directo desde el navegador
- [ ] Historial de transcripciones
- [ ] Guardar transcripciones como notas en el PKM
- [ ] Soporte para archivos de video
- [ ] Transcripción en tiempo real (streaming)
- [ ] Exportar a diferentes formatos (PDF, DOCX)

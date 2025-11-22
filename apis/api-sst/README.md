# Speech-to-Text API

API para convertir archivos de audio a texto usando OpenAI Whisper.

## Requisitos

- Python 3.11+
- OpenAI API Key

## Configuración

### 1. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env y agregar tu API key de OpenAI
# OPENAI_API_KEY=sk-proj-tu-api-key-aqui
```

Obtén tu API key en: https://platform.openai.com/api-keys

### 2. Iniciar el servidor de desarrollo

```bash
./dev.sh
```

El servidor estará disponible en:
- API: http://localhost:8000
- Documentación interactiva: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Uso

### Probar con el script de test

```bash
# Sin archivo (crea uno de prueba con ffmpeg)
./test-api.sh

# Con tu propio archivo de audio
./test-api.sh mi-audio.mp3
```

### Probar con curl

```bash
# Transcribir audio en inglés
curl -X POST http://localhost:8000/speech-to-text \
  -F "file=@audio.mp3" \
  -F "language=en"

# Transcribir audio en español
curl -X POST http://localhost:8000/speech-to-text \
  -F "file=@audio.mp3" \
  -F "language=es"

# Auto-detectar idioma
curl -X POST http://localhost:8000/speech-to-text \
  -F "file=@audio.mp3"
```

### Probar con Python

```python
import requests

url = "http://localhost:8000/speech-to-text"

with open("audio.mp3", "rb") as f:
    files = {"file": f}
    data = {"language": "en"}
    response = requests.post(url, files=files, data=data)

print(response.json())
# Output: {"text": "Transcribed text here..."}
```

### Probar con JavaScript/fetch

```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('language', 'en');

const response = await fetch('http://localhost:8000/speech-to-text', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.text);
```

## Formatos de audio soportados

- MP3 (.mp3)
- MP4 (.mp4, .m4a)
- WAV (.wav)
- WEBM (.webm)
- FLAC (.flac)
- OGG (.ogg)

**Tamaño máximo:** 25MB (límite de OpenAI Whisper)

## API Reference

### POST /speech-to-text

Transcribe un archivo de audio a texto.

**Parámetros:**

| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `file` | File | Sí | Archivo de audio a transcribir |
| `model` | string | No | Modelo Whisper (default: "whisper-1") |
| `language` | string | No | Código ISO 639-1 del idioma (ej: "en", "es") |

**Respuesta exitosa (200):**

```json
{
  "text": "This is the transcribed text from the audio file."
}
```

**Errores:**

- `400` - Formato de archivo inválido
- `500` - Error en la transcripción

## Idiomas soportados

El parámetro `language` acepta códigos ISO 639-1. Algunos ejemplos:

- `en` - English
- `es` - Español
- `fr` - Français
- `de` - Deutsch
- `it` - Italiano
- `pt` - Português
- `zh` - 中文
- `ja` - 日本語
- `ko` - 한국어
- `ar` - العربية

[Ver lista completa de idiomas soportados](https://platform.openai.com/docs/guides/speech-to-text#supported-languages)

## Estructura del proyecto

```
api-sst/
├── main.py              # Aplicación FastAPI
├── requirements.txt     # Dependencias Python
├── .env.example         # Ejemplo de variables de entorno
├── .env                 # Variables de entorno (no commiteado)
├── .gitignore          # Archivos ignorados por Git
├── dev.sh              # Script para iniciar servidor de desarrollo
├── test-api.sh         # Script para probar la API
└── README.md           # Esta documentación
```

## Deployment

### AWS Lambda (con Mangum)

La API está configurada para funcionar en AWS Lambda usando Mangum:

```python
# main.py
handler = Mangum(app)  # Lambda handler
```

Ver el workflow en `.github/workflows/deploy-speech-to-text.yml` para CI/CD.

### Variables de entorno en producción

Asegúrate de configurar:
- `OPENAI_API_KEY` - Tu API key de OpenAI

## Desarrollo

### Instalar dependencias manualmente

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Ejecutar sin el script

```bash
source venv/bin/activate
uvicorn main:app --reload --env-file .env
```

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"

Asegúrate de tener el archivo `.env` con tu API key:

```bash
OPENAI_API_KEY=sk-proj-tu-api-key-real
```

### Error: "uvicorn: command not found"

Instala las dependencias:

```bash
pip install -r requirements.txt
```

### Error: "File must be an audio file"

Verifica que estés enviando un archivo de audio válido con el content-type correcto.

### CORS Error - "Access-Control-Allow-Origin"

La API ya incluye configuración CORS para desarrollo local (`localhost:3000`, `localhost:3001`).

Si necesitas agregar más orígenes permitidos (ej: tu dominio de producción en AWS Amplify), edita `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://your-app.amplifyapp.com",  # Agregar tu dominio
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

## Licencia

MIT

# Integración de Grabación de Audio con Speech-to-Text API

## Resumen

Se ha integrado exitosamente la funcionalidad de grabación de audio del componente `VoiceNoteRecorder` con el endpoint `/transcribe` de la API de Speech-to-Text.

## Flujo de Trabajo

1. **Grabación**: El usuario graba audio usando el micrófono
2. **Guardar**: Al guardar, el audio se envía automáticamente a la API de transcripción
3. **Transcripción**: La API transcribe el audio usando ElevenLabs y lo guarda en el sistema RAG
4. **Nota Creada**: Se crea una nota con:
   - La transcripción del audio
   - El audio embebido para reproducción
   - Metadata (duración, fecha)

## Archivos Modificados

### Frontend (`apps/fe-webapp/`)

1. **`src/app/page.tsx`**: 
   - Integración con `transcribeAudioDirect()`
   - Notificaciones toast para feedback al usuario
   - Manejo de estado de transcripción

2. **`src/app/layout.tsx`**: 
   - Agregado componente `Toaster` para notificaciones

3. **Nuevos componentes UI**:
   - `src/components/ui/toast.tsx`
   - `src/components/ui/toaster.tsx`
   - `src/hooks/use-toast.ts`

## Configuración

### Variables de Entorno

La webapp usa las siguientes variables (con valores por defecto):

```bash
# URL de la API de Speech-to-Text (default: http://localhost:8001)
NEXT_PUBLIC_STT_API_URL=http://localhost:8001
```

### API de Speech-to-Text

Asegúrate de que la API esté corriendo y configurada:

```bash
cd apis/speech_to_text_api
# Configurar .env con ELEVENLABS_API_KEY
./start_api.sh
```

La API requiere:
- `ELEVENLABS_API_KEY`: Tu API key de ElevenLabs
- `RAG_SERVICE_URL`: URL del servicio RAG (default: http://localhost:8000)

## Uso

1. **Iniciar servicios**:
```bash
# Terminal 1: RAG Memory API
cd apis/rag_memory
./start_api.sh

# Terminal 2: Speech-to-Text API
cd apis/speech_to_text_api
./start_api.sh

# Terminal 3: Frontend
cd apps/fe-webapp
npm run dev
```

2. **Grabar nota de voz**:
   - Click en el botón flotante (mic icon)
   - Permitir acceso al micrófono
   - Grabar tu nota
   - Click en guardar (✓)
   - Espera la transcripción
   - La nota se crea automáticamente

## Características

- ✅ Transcripción automática con ElevenLabs
- ✅ Almacenamiento en RAG Memory con embeddings
- ✅ Audio embebido en la nota para reproducción
- ✅ Notificaciones de estado (cargando, éxito, error)
- ✅ Formato markdown con secciones claras
- ✅ Metadata (duración, fecha de grabación)
- ✅ Categorización automática por pilar seleccionado

## Estructura de la Nota Creada

```markdown
# Nota de Voz

## Transcripción

[Texto transcrito del audio]

---

## Audio Original

[Reproductor de audio embebido]

*Duración: MM:SS*
*Grabado el DD/MM/YYYY, HH:MM:SS*
```

## Manejo de Errores

La integración maneja los siguientes casos:

- Audio demasiado corto (< 1KB)
- Errores de red/API
- Errores de transcripción
- Timeout de la API

Todos los errores se muestran al usuario mediante notificaciones toast.

## Próximos Pasos Sugeridos

1. Agregar configuración de idioma de transcripción en settings
2. Permitir editar la transcripción antes de guardar
3. Agregar soporte para múltiples idiomas
4. Integrar los datos del grafo retornados por la API
5. Agregar preview de la transcripción durante el proceso



# Migraciones de Base de Datos

Este directorio contiene las migraciones SQL para el sistema PKM (Personal Knowledge Management).

## Estructura de Migraciones

### `001_init_rag.sql`
Migración inicial que crea las tablas básicas del sistema RAG:
- `memory`: Almacena memorias completas (texto completo)
- `memory_chunk`: Almacena chunks de texto con embeddings vectoriales
- `memory_edge`: Almacena relaciones de similitud entre memorias (grafo)

### `002_complete_pkm_schema.sql`
Migración completa que integra:
- Sistema de usuarios y autenticación
- Proyectos/espacios de trabajo
- Notas con conexión al RAG
- Tags y categorización
- Transcripciones de audio
- Templates de notas
- Backlinks entre notas
- Row Level Security (RLS) preparado para multi-tenancy

## Modelo de Datos

### Entidades Principales

#### Usuarios (`users`)
- Almacena información de usuarios
- Incluye límites según plan (free/pro/team)
- Tracking de uso (notas mensuales, almacenamiento)

#### Proyectos (`projects`)
- Espacios de trabajo para organizar notas
- Cada proyecto pertenece a un usuario
- Soporta color e icono personalizados

#### Notas (`notes`)
- Entidad central del sistema
- Conectada con `memory` para búsqueda semántica
- Soporta título, contenido, proyecto, pinned status
- Índices full-text para búsqueda rápida

#### Tags (`tags` y `note_tags`)
- Sistema de tags many-to-many
- Cada tag pertenece a un usuario
- Permite categorización flexible

#### Transcripciones (`audio_transcriptions`)
- Almacena transcripciones de audio (Whisper)
- Puede estar asociada a una nota
- Incluye metadata del audio (duración, tamaño, idioma)

#### Templates (`note_templates`)
- Templates reutilizables para crear notas
- Pueden estar asociados a proyectos específicos

#### Backlinks (`note_backlinks`)
- Conexiones bidireccionales entre notas
- Permite navegación tipo wiki

### Integración con RAG

Las notas se conectan con el sistema RAG a través del campo `memory_id`:
- Cuando se crea/actualiza una nota, se puede procesar y crear una `memory`
- La `memory` se divide en `memory_chunk` con embeddings
- Las `memory_edge` conectan memorias similares para búsqueda semántica

## Características

### Búsqueda
- **Full-text**: Índices GIN con `pg_trgm` para búsqueda rápida
- **Semántica**: A través de embeddings vectoriales en `memory_chunk`
- **Por fecha**: Índices optimizados para búsqueda temporal

### Seguridad
- Row Level Security (RLS) preparado pero deshabilitado por defecto
- Políticas listas para Supabase Auth o sistemas custom
- Multi-tenancy a nivel de base de datos

### Rendimiento
- Índices compuestos para consultas comunes
- Índices parciales para optimizar queries filtradas
- Triggers automáticos para mantener contadores actualizados

## Aplicación de Migraciones

### Orden de aplicación
1. Primero aplicar `001_init_rag.sql` (si no existe)
2. Luego aplicar `002_complete_pkm_schema.sql`

### Con Supabase
```bash
# Aplicar migración usando Supabase CLI
supabase migration up
```

### Manualmente
```bash
# Conectarse a la base de datos y ejecutar
psql -d tu_base_de_datos -f 001_init_rag.sql
psql -d tu_base_de_datos -f 002_complete_pkm_schema.sql
```

## Notas Importantes

1. **RLS**: Las políticas RLS están comentadas por defecto. Descomenta y ajusta según tu sistema de autenticación.

2. **Extensiones**: Asegúrate de tener instaladas:
   - `vector` (pgvector)
   - `uuid-ossp`
   - `pg_trgm`

3. **Índices vectoriales**: Los índices IVFFlat se crean con `lists = 100`. Ajusta según el tamaño de tus datos.

4. **Compatibilidad**: La migración `002_complete_pkm_schema.sql` es compatible con `001_init_rag.sql` existente y solo agrega campos si no existen.

## Próximos Pasos

- [ ] Configurar sistema de autenticación
- [ ] Habilitar y ajustar políticas RLS
- [ ] Configurar índices vectoriales según volumen de datos
- [ ] Implementar sincronización de notas con RAG
- [ ] Configurar almacenamiento para archivos de audio


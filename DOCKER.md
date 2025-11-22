# Docker Setup - Platanus Hack 25

## Inicio Rápido

### 1. Configurar variables de entorno

Copia el archivo de ejemplo y configura tu API key de OpenAI:

```bash
cp .env.example .env
```

Edita `.env` y agrega tu `OPENAI_API_KEY`.

### 2. Levantar todos los servicios

```bash
docker-compose up
```

O en modo detached (segundo plano):

```bash
docker-compose up -d
```

### 3. Verificar que todo esté funcionando

```bash
./check-services.sh
```

### 4. Acceder a los servicios

Una vez que todos los contenedores estén corriendo:

- **Frontend Public Web**: http://localhost:3000
- **Frontend Web App**: http://localhost:3001
- **API RAG Memory**: http://localhost:8000 (docs: http://localhost:8000/docs)
- **API Speech to Text**: http://localhost:8001 (docs: http://localhost:8001/docs)
- **API SST**: http://localhost:8002 (docs: http://localhost:8002/docs)
- **PostgreSQL**: localhost:5432 (usuario: `postgres`, password: `postgres`, db: `ragdb`)

## Comandos Útiles

### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f rag-memory
docker-compose logs -f fe-webapp
```

### Reconstruir servicios (después de cambios en dependencies)
```bash
docker-compose up --build
```

### Reconstruir un servicio específico
```bash
docker-compose up --build rag-memory
```

### Detener todos los servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes (resetear base de datos)
```bash
docker-compose down -v
```

### Ejecutar comandos dentro de un contenedor
```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d ragdb

# Shell en un contenedor Python
docker-compose exec rag-memory bash

# Shell en un contenedor Node
docker-compose exec fe-webapp sh
```

### Ver estado de servicios
```bash
docker-compose ps
```

## Estructura de Servicios

### Base de Datos
- **postgres**: PostgreSQL 16 con extensión pgvector
  - Las migraciones en `data/migrations/` se ejecutan automáticamente al iniciar
  - Los datos persisten en el volumen `postgres_data`

### APIs Python (FastAPI)
- **rag-memory**: Servicio de memoria RAG (puerto 8000)
- **speech-to-text**: API de transcripción (puerto 8001)
- **api-sst**: API SST standalone (puerto 8002)

### Frontends (Next.js)
- **fe-public-web**: Web pública (puerto 3000)
- **fe-webapp**: Aplicación web (puerto 3001)

## Troubleshooting

### Los contenedores no inician
1. Verifica que Docker esté corriendo
2. Verifica que los puertos no estén en uso: `lsof -i :3000,3001,8000,8001,8002,5432`
3. Revisa los logs: `docker-compose logs`

### Error de conexión a la base de datos
- Espera a que PostgreSQL esté completamente iniciado (el healthcheck puede tardar unos segundos)
- Verifica los logs: `docker-compose logs postgres`

### Cambios en el código no se reflejan
- Los servicios están configurados con hot-reload
- Para Python: los cambios se detectan automáticamente
- Para Next.js: los cambios se detectan automáticamente
- Si hay problemas, reinicia el servicio: `docker-compose restart <servicio>`

### Reinstalar dependencias
```bash
# Para servicios Python
docker-compose up --build rag-memory

# Para servicios Node
docker-compose up --build fe-webapp
```

### Resetear base de datos
```bash
docker-compose down -v
docker-compose up postgres
```

## Desarrollo

Los volúmenes están configurados para desarrollo local:
- Los cambios en el código se reflejan automáticamente
- `node_modules` y `.next` están en volúmenes anónimos para mejor performance
- Los datos de PostgreSQL persisten entre reinicios

## Producción

Para uso en producción, considera:
1. Usar variables de entorno seguras
2. Cambiar las credenciales de PostgreSQL
3. Usar builds optimizadas para Next.js
4. Configurar reverse proxy (nginx/traefik)
5. Implementar SSL/TLS

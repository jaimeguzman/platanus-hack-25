# Platanus Hack 25

Sistema de gestión de conocimiento personal (PKM) con RAG y transcripción de audio.

## Inicio Rápido

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Edita .env y agrega tu OPENAI_API_KEY

# 2. Levantar todos los servicios
make up
```

## Comandos Disponibles

```bash
make up        # Levantar todos los servicios
make down      # Detener todos los servicios
make restart   # Reiniciar todos los servicios
make logs      # Ver logs en tiempo real
make build     # Construir las imágenes
make clean     # Limpiar contenedores y volúmenes
```

## Servicios

Una vez levantados los contenedores, los servicios estarán disponibles en:

- Frontend Web App: http://localhost:3001
- Frontend Public Web: http://localhost:3000
- RAG Memory API: http://localhost:8000
- Speech-to-Text API: http://localhost:8002
- PostgreSQL (pgvector): localhost:5432

## Estructura del Proyecto

```
.
├── apis/       # APIs y servicios backend
├── apps/       # Aplicaciones frontend
├── data/       # Migraciones de base de datos
├── docs/       # Documentación
└── infra/      # Configuración de infraestructura
```

## Requisitos

- Docker y Docker Compose
- OpenAI API Key

## Desarrollo Manual

Si prefieres no usar Docker:

### Requisitos
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+ con extensión pgvector

### Instalación

```bash
# Frontend
cd apps/fe-webapp
npm install

# Backend
cd apis/rag_memory
pip install -r requirements.txt
```

Ver [DOCKER.md](./DOCKER.md) para más detalles sobre la configuración de Docker.

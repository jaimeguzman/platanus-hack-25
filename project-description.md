# Cognitive Context - Tu Memoria Turbo-Cargada

## Descripción del Producto

**Cognitive Context** es un sistema de gestión de conocimiento personal (PKM) que actúa como un "segundo cerebro" digital. La plataforma está diseñada para liberar la mente humana de la sobrecarga cognitiva, permitiendo que los usuarios se enfoquen en tareas creativas y estratégicas mientras el sistema se encarga de capturar, organizar y recuperar información de manera inteligente.

### Propuesta de Valor

Tu memoria, turbo-cargada. Captura lo que vives, lo organiza en silencio y te entrega cualquier detalle al instante. Una extensión de tu mente que anticipa, clarifica y mantiene tu mundo siempre accesible, preciso y listo para avanzar.

## Usuarios Objetivo

- **Knowledge Workers**: Desarrolladores, diseñadores, product managers
- **Creadores de Contenido**: Escritores, investigadores, periodistas  
- **Estudiantes y Académicos**: Universitarios, investigadores, docentes

Personas que manejan múltiples proyectos simultáneos, necesitan recordar contexto complejo y valoran la productividad y el aprendizaje continuo.

## Funcionalidades Principales

### Gestión y Organización
- **Búsqueda semántica inteligente** usando embeddings vectoriales
- **Visualización de grafo de conocimiento** que muestra conexiones entre notas
- **Vista de notas recientes** y timeline cronológica

### Análisis Inteligente
- **RAG (Retrieval-Augmented Generation)** para respuestas contextuales
- **Detección automática de relaciones** entre contenidos
- **Clustering y análisis de patrones** en el conocimiento almacenado
- **Extracción automática de entidades** y conceptos clave

## Arquitectura Tecnológica

### Frontend
- **Next.js 15** con App Router para la aplicación web principal
- **React 19** para componentes de interfaz
- **TypeScript** para type safety
- **Tailwind CSS** para estilos y **shadcn/ui** para componentes
- **Zustand** para gestión de estado
- **Monaco Editor** para edición de texto avanzada
- **D3.js** para visualización de grafos

### Backend
- **FastAPI** para APIs REST de alto rendimiento
- **Python 3.11+** como runtime principal
- **PostgreSQL 16** con extensión **pgvector** para búsqueda vectorial
- **OpenAI API** para embeddings y transcripción (Whisper)
- **Anthropic Claude** para procesamiento de lenguaje natural

### Infraestructura
- **Docker Compose** para desarrollo local
- **AWS Lambda** para deployment serverless de APIs
- **Vercel** para hosting del frontend
- **Mangum** para adaptación ASGI a Lambda

## Arquitectura de Datos

### Sistema RAG Avanzado
- **Chunking inteligente** de documentos con overlapping
- **Embeddings vectoriales** para búsqueda semántica
- **Grafo de relaciones** automático basado en similitud
- **Cache de embeddings** para optimización de costos

### Base de Datos
- **Memories**: Almacenamiento principal de contenido
- **Chunks**: Fragmentos de texto con embeddings
- **Relationships**: Conexiones entre memorias
- **Categories**: Organización temática

## Servicios Disponibles

- **Frontend Web App**: - Aplicación principal
- **Frontend Public Web**: - Landing page y chat público
- **RAG Memory API**: - Servicio de memoria inteligente
- **Speech-to-Text API**: - Transcripción de audio
- **PostgreSQL**: - Base de datos con pgvector

## Diferenciadores Clave

1. **Velocidad de Captura**: Prioriza la rapidez sobre la complejidad de features
2. **IA Integrada**: RAG nativo para respuestas contextuales inteligentes  
3. **Grafo Automático**: Conexiones entre conocimientos sin configuración manual
4. **Multimodal**: Texto, video y audio en una sola plataforma
5. **Simplicidad**: Interfaz limpia vs. herramientas complejas como Notion u Obsidian

---

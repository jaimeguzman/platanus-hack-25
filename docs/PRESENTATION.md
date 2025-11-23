# Estructura presentación final

### Diapositiva 1: Título
- Saludo inicial
- Leer titulo del proyecto + mencionar número del team 

### Diapositiva 2: Definir el problema 

Paso a paso: 
1. Descripción breve del problema que se está abordando
2. ¿A quien afecta? ¿Quien es el público objetivo? Aquí mostramos las estádisticas. Nos enfocaremos solo en estas:
2.1 Las aplicaciones de productividad tienen una tasa de retención de solo el 3.2% a los 30 días (UXCam & Business of Apps, 2025)
2.2 Luego de 15 a 23 minutos, existe una perdida de foco dado el context switching (Sophie Leroy, 2009)
2.3. Dentro de los metodos para manejar el conocimiento de forma eficiente, se destacan la visualización jerarquica, mapas mentales y cualquier representación gráfica (Roman E. Prilipsky, Margarita A. Zaeva, 2019)
2.4 El público objetivo son los "knowledge workers". Esto se refiere a profesionales que trabajan principalmente con información y conocimiento, como desarrolladores de software, diseñadores, escritores, investigadores y otros roles similares.  

**Nota**: Respondemos a las 4 preguntas de "como hacer un buen demo": 
- ¿Cuál es el problema que encontraron?
- ¿A quién afecta?
- ¿Que tan relevante es este problema?
- ¿Por qué no está resuelto?

### Diapositiva 3: Solución propuesta

1. Descripción breve de la solución propuesta, quizás una representación visual de un cerebro con conexiones.

2. Mostramos el producto directamente. Pantallazos de los grafos + el chat multimodal. 

3. La competencia. Aquí mostramos las aplicaciones que existen en el mercado y sus limitaciones. Nos enfocaremos en estas:

| Producto         | Qué hace                          | Cómo es diferente de nosotros                |
| :--------------- | :-------------------------------- | :-------------------------------------------------- |
| Notion           | Almacena contexto (manual)        | Nuestro producto lo captura automático             |
| Obsidian         | PKM local, grafo de notas         | No captura automático, requiere entrada manual      |
| GitHub Copilot   | Sugiere código basado en contexto | Solo para coding, no "reconstruye contexto"         |
| Slack            | Busca mensajes relevantes         | Requiere que BUSQUES, Nuestro producto lo trae     |
| Linear/Jira      | Gestiona tasks con contexto       | Necesitas IDs de tasks, no reconstruye automático   |
| Mem/Remio        | AI second brain                   | Pero requiere entrada manual, no captura automático |
| Claude Artifacts | Mantiene contexto de proyectos    | Solo en sesión actual, pierde al salir              |

### Diapositiva 4: Demo en vivo

- Mostrar una demo en vivo de las consultas, grafos y resultados. URL: cognitive-context.online 

- Mencionar brevemente que utilizamos un stack moderno serverless:

| Componente          | Tecnología utilizada               |
| :------------------ | :--------------------------------  |
| Frontend            | Next.js + Tailwind CSS             |
| Backend             | Python + FastAPI                   |
| Base de datos       | PostgreSQL                         |
| Procesamiento AI    | OpenAI API + Claude                |
| Despliegue          | AWS Amplify + Lambda               |

- RAG, Agentes, Grafos de conocimiento, embeddings, etc.
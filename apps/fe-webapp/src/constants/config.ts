// Configuración centralizada de la aplicación
// NO STATIC FALLBACKS, NO HARDCODED VALUES, NO MAGIC NUMBERS

export const APP_CONFIG = {
  // UI Limits
  RECENT_NOTES_LIMIT: 10,
  DASHBOARD_RECENT_NOTES_LIMIT: 5,
  MAX_TAGS_DISPLAY: 3,
  
  // Graph View
  GRAPH_RADIUS: 200,
  GRAPH_CENTER_X: 400,
  GRAPH_CENTER_Y: 300,
  GRAPH_VIEWBOX_WIDTH: 800,
  GRAPH_VIEWBOX_HEIGHT: 600,
  GRAPH_NODE_RADIUS: 20,
  GRAPH_NODE_HOVER_RADIUS: 24,
  GRAPH_TEXT_OFFSET_Y: 35,
  GRAPH_TITLE_MAX_LENGTH: 15,
  
  // Editor
  AUTO_SAVE_DELAY_MS: 2000,
  
  // Locale
  DEFAULT_LOCALE: 'es-ES',
  
  // Defaults
  DEFAULT_PILLAR: 'career' as const,
} as const;

export const UI_MESSAGES = {
  NO_NOTES: 'No hay notas aún. Crea tu primera nota para comenzar.',
  NO_RECENT_NOTES: 'No hay notas recientes',
  NO_CONTENT: '*No hay contenido*',
  SELECT_OR_CREATE_NOTE: 'Selecciona una nota o crea una nueva para comenzar',
  NO_GRAPH_DATA: 'Crea algunas notas para ver el grafo de conexiones',
  NEW_NOTE_TITLE: 'Nueva Nota',
  SAVING: 'Guardando...',
  SEARCH_PLACEHOLDER: 'Buscar notas...',
  NOTE_TITLE_PLACEHOLDER: 'Título de la nota...',
  NOTE_CONTENT_PLACEHOLDER: 'Escribe tu nota en Markdown...',
  TAG_PLACEHOLDER: 'Agregar etiqueta...',
} as const;

export const PILLAR_COLORS = {
  career: 'bg-blue-500',
  social: 'bg-green-500',
  hobby: 'bg-purple-500',
  default: 'bg-gray-500',
} as const;


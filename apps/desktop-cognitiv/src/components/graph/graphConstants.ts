export const GRAPH_COLORS = {
  memory: '#8B5CF6',
  note: '#3B82F6',
  tag: '#10B981',
  edge: '#A855F7',
  edgeWeak: '#9333EA',
  text: '#E5E7EB',
  textMuted: '#9CA3AF',
  background: '#0A0A0A',
  cardBg: '#18181B',
  border: '#27272A',
} as const;

export const CATEGORY_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6',
] as const;

export const NODE_SIZES = {
  memory: 8,
  note: 10,
  tag: 6,
  default: 8,
} as const;

export const HIGHLIGHT_SETTINGS = {
  newNodeScaleMultiplier: 3,
  newNodeStrokeWidth: 6,
  normalStrokeWidth: 2,
  highlightColor: '#FFD700',
  pulseDuration: 600,
} as const;


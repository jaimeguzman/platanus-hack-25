import { GRAPH_COLORS, NODE_SIZES, CATEGORY_COLORS } from './graphConstants';

export function getNodeColor(
  type: string, 
  category?: string, 
  colorMap?: Map<string, string>
): string {
  if (category && colorMap && colorMap.has(category)) {
    return colorMap.get(category)!;
  }
  if (type === 'memory') return GRAPH_COLORS.memory;
  if (type === 'note') return GRAPH_COLORS.note;
  if (type === 'tag') return GRAPH_COLORS.tag;
  return GRAPH_COLORS.memory;
}

export function getNodeSize(type: string): number {
  if (type === 'memory') return NODE_SIZES.memory;
  if (type === 'note') return NODE_SIZES.note;
  if (type === 'tag') return NODE_SIZES.tag;
  return NODE_SIZES.default;
}

export function createCategoryColorMap(categories: Set<string>): Map<string, string> {
  const colorMap = new Map<string, string>();
  Array.from(categories).forEach((category, index) => {
    colorMap.set(category, CATEGORY_COLORS[index % CATEGORY_COLORS.length]);
  });
  return colorMap;
}

export function calculateInitialScale(nodeCount: number): number {
  if (nodeCount > 100) return 0.3;
  if (nodeCount > 50) return 0.5;
  if (nodeCount > 30) return 0.7;
  if (nodeCount > 10) return 0.85;
  return 1;
}

export function calculateZoomDuration(distance: number): number {
  const baseDuration = 600;
  const maxDuration = 1200;
  const distanceFactor = Math.min(distance / 1000, 1.5);
  return Math.min(baseDuration + (distanceFactor * 400), maxDuration);
}


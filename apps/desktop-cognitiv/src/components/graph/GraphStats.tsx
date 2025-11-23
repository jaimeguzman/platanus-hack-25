interface GraphStatsProps {
  nodeCount: number;
  edgeCount: number;
  categoryColorMap: Map<string, string>;
}

export function GraphStats({ nodeCount, edgeCount, categoryColorMap }: GraphStatsProps) {
  return (
    <div className="absolute bottom-4 left-4 max-h-[calc(100%-8rem)] overflow-y-auto rounded-lg border bg-card p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold">Estadísticas</h3>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-violet-500" />
          <span>Nodos: {nodeCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-3 bg-indigo-500" />
          <span>Conexiones: {edgeCount}</span>
        </div>
      </div>
      
      {categoryColorMap.size > 0 && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="text-xs font-semibold mb-2">Categorías</h4>
          <div className="space-y-1">
            {Array.from(categoryColorMap.entries()).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs truncate">{category || 'Sin categoría'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useRef, useEffect, useState } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import { GraphNode, GraphEdge } from '@/types/note';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Colores para el grafo
const GRAPH_COLORS = {
  note: '#8B5CF6',      // Violeta para notas
  tag: '#10B981',       // Verde para tags
  backlink: '#3B82F6',  // Azul para backlinks
  edge: '#6366F1',      // Indigo para conexiones
  edgeTag: '#10B981',   // Verde para conexiones de tags
  text: '#E5E7EB',      // Gris claro para texto
  textMuted: '#9CA3AF', // Gris para texto secundario
  background: '#0A0A0A', // Fondo oscuro
  cardBg: '#18181B',    // Fondo de cards
  border: '#27272A',    // Bordes
};

const GraphView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notes, projects, setActiveNote, setViewMode, viewMode } = usePKMStore();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);

  // Reset estados al montar
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setHoveredNode(null);
    setIsReady(false);

    // Marcar como listo después de un breve delay
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Resize canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Solo actualizar si tiene tamaño válido
        if (width > 0 && height > 0) {
          setCanvasSize({ width, height });
        }
      }
    };

    // Usar requestAnimationFrame para asegurar que el DOM está listo
    const rafId = requestAnimationFrame(() => {
      updateSize();
    });

    // También usar un pequeño delay como fallback
    const timeoutId = setTimeout(updateSize, 100);

    window.addEventListener('resize', updateSize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Get project color for a note
  const getProjectColor = (projectId: string | undefined) => {
    if (!projectId) return GRAPH_COLORS.note;
    const project = projects.find(p => p.id === projectId);
    return project?.color || GRAPH_COLORS.note;
  };

  // Generate graph data from notes
  useEffect(() => {
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const radius = Math.min(canvasSize.width, canvasSize.height) * 0.3;

    // Add note nodes
    notes.forEach((note, index) => {
      const angle = (index / Math.max(notes.length, 1)) * 2 * Math.PI - Math.PI / 2;

      newNodes.push({
        id: note.id,
        label: note.title.length > 20 ? note.title.substring(0, 20) + '...' : note.title,
        type: 'note',
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: getProjectColor(note.projectId),
        size: 12
      });

      // Add edges for backlinks
      if (note.backlinks) {
        note.backlinks.forEach(backlinkId => {
          if (notes.find(n => n.id === backlinkId)) {
            newEdges.push({
              source: note.id,
              target: backlinkId,
              type: 'backlink',
              strength: 0.8
            });
          }
        });
      }

      // Add edges for shared tags
      note.tags.forEach(tag => {
        const tagId = `tag-${tag}`;
        if (!newNodes.find(n => n.id === tagId)) {
          const tagAngle = Math.random() * 2 * Math.PI;
          const tagRadius = radius + 80;
          newNodes.push({
            id: tagId,
            label: `#${tag}`,
            type: 'tag',
            x: centerX + Math.cos(tagAngle) * tagRadius,
            y: centerY + Math.sin(tagAngle) * tagRadius,
            color: GRAPH_COLORS.tag,
            size: 8
          });
        }
        newEdges.push({
          source: note.id,
          target: tagId,
          type: 'tag',
          strength: 0.4
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [notes, projects, canvasSize]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with background
    ctx.fillStyle = GRAPH_COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern
    ctx.strokeStyle = GRAPH_COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    const gridSize = 40 * zoom;
    for (let x = offset.x % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = offset.y % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw edges with glow effect
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        const edgeColor = edge.type === 'tag' ? GRAPH_COLORS.edgeTag : GRAPH_COLORS.edge;

        // Glow effect
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = (edge.strength || 0.5) * 4;
        ctx.globalAlpha = 0.1;
        ctx.stroke();

        // Main line
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = (edge.strength || 0.5) * 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      if (node.x && node.y) {
        const isHovered = hoveredNode === node.id;
        const nodeSize = (node.size || 8) * (isHovered ? 1.3 : 1);

        // Glow effect
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize + 8, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || GRAPH_COLORS.note;
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || GRAPH_COLORS.note;
        ctx.fill();

        // Border
        ctx.strokeStyle = GRAPH_COLORS.background;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = node.type === 'tag' ? GRAPH_COLORS.tag : GRAPH_COLORS.text;
        ctx.font = node.type === 'tag' ? '11px system-ui' : '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + nodeSize + 16);
      }
    });

    ctx.restore();
  }, [nodes, edges, zoom, offset, hoveredNode, canvasSize]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Si hubo movimiento significativo del mouse, no es un clic sino un drag
    if (mouseDownPos) {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx > 5 || dy > 5) {
        return; // Fue un drag, no un click
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    // Find clicked node - usar radio más grande para mejor detección
    const clickedNode = nodes.find(node => {
      if (!node.x || !node.y || !node.size) return false;
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= (node.size || 12) + 10; // Radio de detección más grande
    });

    if (clickedNode && clickedNode.type === 'note') {
      setActiveNote(clickedNode.id);
      setViewMode('editor'); // Cambiar a vista editor al hacer clic
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Guardar posición inicial para detectar si es click o drag
    setMouseDownPos({ x: e.clientX, y: e.clientY });

    // Solo iniciar drag si no estamos sobre un nodo clickeable
    if (!hoveredNode || nodes.find(n => n.id === hoveredNode)?.type !== 'note') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setMouseDownPos(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredNode(null);
    setMouseDownPos(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };


  const handleMouseMoveForHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    const hovered = nodes.find(node => {
      if (!node.x || !node.y || !node.size) return false;
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= node.size + 5;
    });

    setHoveredNode(hovered?.id || null);

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const noteNodes = nodes.filter(n => n.type === 'note');
  const tagNodes = nodes.filter(n => n.type === 'tag');

  // Mostrar loading mientras se inicializa
  if (!isReady) {
    return (
      <div ref={containerRef} className="flex-1 relative flex items-center justify-center" style={{ backgroundColor: GRAPH_COLORS.background }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: GRAPH_COLORS.textMuted }} className="text-sm">Cargando visor...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative" style={{ backgroundColor: GRAPH_COLORS.background }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex gap-1 p-1.5 rounded-xl border" style={{ backgroundColor: GRAPH_COLORS.cardBg, borderColor: GRAPH_COLORS.border }}>
          <Button
            onClick={() => setViewMode(viewMode === 'graph' ? 'split' : 'graph')}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 text-white"
            title={viewMode === 'graph' ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {viewMode === 'graph' ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
          <div className="w-px bg-white/10 mx-0.5" />
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 text-white"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 text-white"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-px bg-white/10 mx-0.5" />
          <Button
            onClick={handleResetView}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 text-white"
            title="Restablecer vista"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Graph Info */}
      <div
        className="absolute top-4 left-4 z-10 p-4 rounded-xl border"
        style={{ backgroundColor: GRAPH_COLORS.cardBg, borderColor: GRAPH_COLORS.border }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: GRAPH_COLORS.text }}>
          Visor Gráfico
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GRAPH_COLORS.note }} />
            <span style={{ color: GRAPH_COLORS.textMuted }}>Notas: {noteNodes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GRAPH_COLORS.tag }} />
            <span style={{ color: GRAPH_COLORS.textMuted }}>Tags: {tagNodes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5" style={{ backgroundColor: GRAPH_COLORS.edge }} />
            <span style={{ color: GRAPH_COLORS.textMuted }}>Conexiones: {edges.length}</span>
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: GRAPH_COLORS.textMuted }}>
          Clic en nodos para abrir notas
        </p>
        <p className="text-xs" style={{ color: GRAPH_COLORS.textMuted }}>
          Arrastra para mover el grafo
        </p>
      </div>

      {/* Zoom indicator */}
      <div
        className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ backgroundColor: GRAPH_COLORS.cardBg, color: GRAPH_COLORS.textMuted, borderColor: GRAPH_COLORS.border, borderWidth: 1 }}
      >
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full"
        style={{
          cursor: hoveredNode && nodes.find(n => n.id === hoveredNode)?.type === 'note'
            ? 'pointer'
            : isDragging
              ? 'grabbing'
              : 'grab'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveForHover}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default GraphView;

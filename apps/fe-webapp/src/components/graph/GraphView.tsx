'use client';

import { useMemo } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, FileText } from 'lucide-react';
import { APP_CONFIG, UI_MESSAGES, PILLAR_COLORS } from '@/constants/config';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  title: string;
  tags: string[];
  pillar: string;
}

interface GraphLink {
  source: string;
  target: string;
}

export function GraphView() {
  const { notes, setCurrentNote, setViewMode } = useNoteStore();

  // Generar nodos y conexiones basadas en tags y referencias
  const { nodes, links } = useMemo(() => {
    const graphNodes: GraphNode[] = notes.map((note, index) => {
      // Distribución circular simple
      const angle = (index / notes.length) * Math.PI * 2;
      const x = Math.cos(angle) * APP_CONFIG.GRAPH_RADIUS + APP_CONFIG.GRAPH_CENTER_X;
      const y = Math.sin(angle) * APP_CONFIG.GRAPH_RADIUS + APP_CONFIG.GRAPH_CENTER_Y;

      return {
        id: note.id,
        x,
        y,
        title: note.title,
        tags: note.tags,
        pillar: note.pillar,
      };
    });

    const graphLinks: GraphLink[] = [];
    
    // Crear conexiones basadas en tags compartidos
    notes.forEach((note, i) => {
      notes.slice(i + 1).forEach((otherNote) => {
        const sharedTags = note.tags.filter((tag) =>
          otherNote.tags.includes(tag),
        );
        if (sharedTags.length > 0) {
          graphLinks.push({
            source: note.id,
            target: otherNote.id,
          });
        }
      });

      // Crear conexiones basadas en linkedNotes
      if (note.linkedNotes) {
        note.linkedNotes.forEach((linkedId) => {
          if (notes.some((n) => n.id === linkedId)) {
            graphLinks.push({
              source: note.id,
              target: linkedId,
            });
          }
        });
      }
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [notes]);

  const handleNodeClick = (nodeId: string) => {
    const note = notes.find((n) => n.id === nodeId);
    if (note) {
      setCurrentNote(note);
      setViewMode('note');
    }
  };

  const getPillarColor = (pillar: string) => {
    return PILLAR_COLORS[pillar as keyof typeof PILLAR_COLORS] ?? PILLAR_COLORS.default;
  };

  if (notes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Graph View
            </CardTitle>
            <CardDescription>
              Vista de conexiones entre tus notas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {UI_MESSAGES.NO_GRAPH_DATA}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">Graph View</h2>
        <p className="text-sm text-muted-foreground">
          Visualiza las conexiones entre tus notas basadas en etiquetas y referencias
        </p>
      </div>

      <div className="relative flex-1 overflow-hidden bg-muted/30">
        <svg
          className="h-full w-full"
          viewBox={`0 0 ${APP_CONFIG.GRAPH_VIEWBOX_WIDTH} ${APP_CONFIG.GRAPH_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Render links */}
          {links.map((link, index) => {
            const sourceNode = nodes.find((n) => n.id === link.source);
            const targetNode = nodes.find((n) => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <line
                key={`link-${index}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-border opacity-30"
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={APP_CONFIG.GRAPH_NODE_RADIUS}
                className={`${getPillarColor(node.pillar)} cursor-pointer transition-all hover:r-[${APP_CONFIG.GRAPH_NODE_HOVER_RADIUS}px]`}
                onClick={() => handleNodeClick(node.id)}
              />
              <text
                x={node.x}
                y={node.y + APP_CONFIG.GRAPH_TEXT_OFFSET_Y}
                textAnchor="middle"
                className="text-xs fill-foreground pointer-events-none"
              >
                {node.title.length > APP_CONFIG.GRAPH_TITLE_MAX_LENGTH
                  ? `${node.title.substring(0, APP_CONFIG.GRAPH_TITLE_MAX_LENGTH)}...`
                  : node.title}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 rounded-lg border bg-card p-3 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Leyenda</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${PILLAR_COLORS.career}`} />
              <span>Desarrollo de Carrera</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${PILLAR_COLORS.social}`} />
              <span>Social</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${PILLAR_COLORS.hobby}`} />
              <span>Hobby</span>
            </div>
          </div>
        </div>

        {/* Node list */}
        <div className="absolute right-4 top-4 max-h-96 w-64 overflow-auto rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Notas ({nodes.length})</h3>
          <div className="space-y-1">
            {nodes.map((node) => (
              <Button
                key={node.id}
                variant="ghost"
                className="w-full justify-start text-xs h-auto py-1.5"
                onClick={() => handleNodeClick(node.id)}
              >
                <FileText className="mr-2 h-3 w-3" />
                <span className="truncate">{node.title}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useNoteStore } from '@/stores/noteStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, FileText, Move, ZoomIn, Hand, ZoomOut } from 'lucide-react';
import { 
  APP_CONFIG, 
  UI_MESSAGES, 
  PILLAR_COLORS,
  D3_SIMULATION,
  D3_ZOOM,
  ANIMATION_DURATION,
  UI_DIMENSIONS,
} from '@/constants';

type InteractionMode = 'nodes' | 'pan' | 'zoom';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  tags: string[];
  pillar: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export function GraphView() {
  const { notes, setCurrentNote, setViewMode } = useNoteStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('nodes');

  // Generar nodos y conexiones basadas en tags y referencias
  const { nodes, links } = useMemo(() => {
    const graphNodes: GraphNode[] = notes.map((note, index) => {
      // Distribución circular inicial para mejor visualización
      const angle = (index / notes.length) * D3_SIMULATION.FULL_CIRCLE_RADIANS;
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

  // Inicializar y actualizar la simulación de D3
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = APP_CONFIG.GRAPH_VIEWBOX_WIDTH;
    const height = APP_CONFIG.GRAPH_VIEWBOX_HEIGHT;

    // Limpiar elementos anteriores
    svg.selectAll('*').remove();

    // Crear grupo contenedor para aplicar transformaciones de zoom/pan
    const containerGroup = svg.append('g').attr('class', 'container');

    // Crear grupos para links y nodes dentro del contenedor
    const linkGroup = containerGroup.append('g').attr('class', 'links');
    const nodeGroup = containerGroup.append('g').attr('class', 'nodes');

    // Crear la simulación de fuerzas
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(APP_CONFIG.FORCE_LINK_DISTANCE)
          .strength(APP_CONFIG.FORCE_LINK_STRENGTH),
      )
      .force(
        'charge',
        d3.forceManyBody().strength(APP_CONFIG.FORCE_CHARGE_STRENGTH),
      )
      .force(
        'collision',
        d3.forceCollide().radius(APP_CONFIG.FORCE_COLLISION_RADIUS),
      )
      .force(
        'center',
        d3
          .forceCenter(
            width * APP_CONFIG.FORCE_CENTER_X,
            height * APP_CONFIG.FORCE_CENTER_Y,
          )
          .strength(D3_SIMULATION.CENTER_FORCE_STRENGTH),
      )
      .alphaDecay(APP_CONFIG.FORCE_ALPHA_DECAY)
      .velocityDecay(APP_CONFIG.FORCE_VELOCITY_DECAY);

    simulationRef.current = simulation;

    // Crear función de arrastre para nodos (solo en modo 'nodes')
    const nodeDrag = d3
      .drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => {
        if (interactionMode !== 'nodes') return;
        if (!event.active) simulation.alphaTarget(D3_SIMULATION.ALPHA_TARGET_ACTIVE).restart();
        d.fx = d.x;
        d.fy = d.y;
        setIsDragging(true);
      })
      .on('drag', (event, d) => {
        if (interactionMode !== 'nodes') return;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (interactionMode !== 'nodes') return;
        if (!event.active) simulation.alphaTarget(D3_SIMULATION.ALPHA_TARGET_INACTIVE);
        d.fx = null;
        d.fy = null;
        setIsDragging(false);
      });

    // Configurar zoom y pan
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([APP_CONFIG.ZOOM_MIN_SCALE, APP_CONFIG.ZOOM_MAX_SCALE])
      .on('zoom', (event) => {
        containerGroup.attr('transform', event.transform.toString());
      });

    // En modo 'pan', deshabilitar zoom con rueda del mouse
    if (interactionMode === 'pan') {
      zoom.filter((event) => {
        return event.type === 'mousedown' || event.type === 'mousemove' || event.type === 'touchstart' || event.type === 'touchmove';
      });
    }

    zoomRef.current = zoom;

    // Configurar filtro según el modo inicial
    if (interactionMode === 'pan') {
      zoom.filter((event) => {
        return event.type === 'mousedown' || event.type === 'mousemove' || event.type === 'touchstart' || event.type === 'touchmove';
      });
    } else if (interactionMode === 'nodes') {
      zoom.filter((event) => {
        // Solo permitir eventos de botones, no rueda del mouse
        return event.type === 'mousedown' && (event as MouseEvent).button === D3_SIMULATION.MOUSE_BUTTON_LEFT;
      });
    }

    // Aplicar zoom al SVG (siempre activo para permitir controles de botones)
    svg.call(zoom);
    
    // Aplicar zoom inicial centrado
    const initialTransform = d3.zoomIdentity
      .translate(width * D3_ZOOM.CENTER_TRANSLATE_FACTOR, height * D3_ZOOM.CENTER_TRANSLATE_FACTOR)
      .scale(APP_CONFIG.ZOOM_INITIAL_SCALE)
      .translate(-width * D3_ZOOM.CENTER_TRANSLATE_FACTOR, -height * D3_ZOOM.CENTER_TRANSLATE_FACTOR);
    
    svg.call(zoom.transform, initialTransform);

    // Dibujar links
    const linkElements = linkGroup
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', D3_SIMULATION.LINK_STROKE_WIDTH)
      .attr('class', 'text-border opacity-30');

    // Dibujar nodos
    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', APP_CONFIG.GRAPH_NODE_RADIUS)
      .attr('class', (d) => {
        const colorClass = PILLAR_COLORS[d.pillar as keyof typeof PILLAR_COLORS] ?? PILLAR_COLORS.default;
        const cursorClass = interactionMode === 'nodes' ? 'cursor-move' : 'cursor-pointer';
        return `${colorClass} ${cursorClass} transition-all hover:opacity-80`;
      })
      .call(nodeDrag)
      .on('click', (event, d) => {
        event.stopPropagation();
        if (interactionMode === 'nodes') {
          handleNodeClick(d.id);
        }
      });

    // Dibujar etiquetas de texto
    const textElements = nodeGroup
      .selectAll<SVGTextElement, GraphNode>('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs fill-foreground pointer-events-none')
      .text((d) =>
        d.title.length > APP_CONFIG.GRAPH_TITLE_MAX_LENGTH
          ? `${d.title.substring(0, APP_CONFIG.GRAPH_TITLE_MAX_LENGTH)}...`
          : d.title,
      );

    // Actualizar posiciones en cada tick de la simulación
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d) => {
          const source = d.source as GraphNode;
          return source.x ?? D3_SIMULATION.DEFAULT_X;
        })
        .attr('y1', (d) => {
          const source = d.source as GraphNode;
          return source.y ?? D3_SIMULATION.DEFAULT_Y;
        })
        .attr('x2', (d) => {
          const target = d.target as GraphNode;
          return target.x ?? D3_SIMULATION.DEFAULT_X;
        })
        .attr('y2', (d) => {
          const target = d.target as GraphNode;
          return target.y ?? D3_SIMULATION.DEFAULT_Y;
        });

      nodeElements.attr('cx', (d) => d.x ?? D3_SIMULATION.DEFAULT_X).attr('cy', (d) => d.y ?? D3_SIMULATION.DEFAULT_Y);

      textElements
        .attr('x', (d) => d.x ?? D3_SIMULATION.DEFAULT_X)
        .attr('y', (d) => (d.y ?? D3_SIMULATION.DEFAULT_Y) + APP_CONFIG.GRAPH_TEXT_OFFSET_Y);
    });

    // Limpiar al desmontar
    return () => {
      simulation.stop();
      svg.on('.zoom', null);
      svg.selectAll('*').remove();
    };
  }, [nodes, links, interactionMode]);

  // Manejar cambios de modo y actualizar zoom
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);

    if (interactionMode === 'zoom') {
      // Modo zoom: permite zoom con rueda y arrastre
      zoomRef.current.filter(null);
    } else if (interactionMode === 'pan') {
      // Modo pan: solo permite arrastre, sin zoom con rueda
      zoomRef.current.filter((event) => {
        return event.type === 'mousedown' || event.type === 'mousemove' || event.type === 'touchstart' || event.type === 'touchmove';
      });
    } else {
      // Modo nodes: deshabilitar zoom con rueda pero mantener transformación
      zoomRef.current.filter((event) => {
        // Solo permitir eventos de botones, no rueda del mouse
        return event.type === 'mousedown' && (event as MouseEvent).button === D3_SIMULATION.MOUSE_BUTTON_LEFT;
      });
    }
    
    // Siempre mantener el zoom activo para permitir controles de botones
    svg.call(zoomRef.current);
  }, [interactionMode]);

  const handleNodeClick = (nodeId: string) => {
    const note = notes.find((n) => n.id === nodeId);
    if (note) {
      setCurrentNote(note);
      setViewMode('note');
    }
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = APP_CONFIG.GRAPH_VIEWBOX_WIDTH;
    const height = APP_CONFIG.GRAPH_VIEWBOX_HEIGHT;
    const initialTransform = d3.zoomIdentity
      .translate(width * D3_ZOOM.CENTER_TRANSLATE_FACTOR, height * D3_ZOOM.CENTER_TRANSLATE_FACTOR)
      .scale(APP_CONFIG.ZOOM_INITIAL_SCALE)
      .translate(-width * D3_ZOOM.CENTER_TRANSLATE_FACTOR, -height * D3_ZOOM.CENTER_TRANSLATE_FACTOR);
    
    svg.transition().duration(ANIMATION_DURATION.ZOOM_RESET).call(
      zoomRef.current.transform,
      initialTransform,
    );
  };

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Asegurar que el zoom esté activo temporalmente
    if (!svg.on('.zoom')) {
      svg.call(zoomRef.current);
    }
    
    const currentTransform = d3.zoomTransform(svg.node()!);
    const newScale = Math.min(
      currentTransform.k + APP_CONFIG.ZOOM_STEP,
      APP_CONFIG.ZOOM_MAX_SCALE,
    );
    
    svg.transition().duration(ANIMATION_DURATION.ZOOM_STEP).call(
      zoomRef.current.scaleBy,
      newScale / currentTransform.k,
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Asegurar que el zoom esté activo temporalmente
    if (!svg.on('.zoom')) {
      svg.call(zoomRef.current);
    }
    
    const currentTransform = d3.zoomTransform(svg.node()!);
    const newScale = Math.max(
      currentTransform.k - APP_CONFIG.ZOOM_STEP,
      APP_CONFIG.ZOOM_MIN_SCALE,
    );
    
    svg.transition().duration(ANIMATION_DURATION.ZOOM_STEP).call(
      zoomRef.current.scaleBy,
      newScale / currentTransform.k,
    );
  };

  const getModeDescription = () => {
    switch (interactionMode) {
      case 'nodes':
        return 'Arrastra los nodos para reorganizarlos.';
      case 'pan':
        return 'Arrastra el canvas para moverte por el grafo.';
      case 'zoom':
        return 'Usa la rueda del mouse para hacer zoom. Arrastra para moverte.';
      default:
        return '';
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Graph View</h2>
            <p className="text-sm text-muted-foreground">
              {getModeDescription()}
            </p>
          </div>
          
          {/* Controles de modo */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-card p-1">
              <Button
                variant={interactionMode === 'nodes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInteractionMode('nodes')}
                title="Modo: Arrastrar nodos"
                className="gap-1.5"
              >
                <Move className="h-4 w-4" />
                <span className="hidden sm:inline">Nodos</span>
              </Button>
              <Button
                variant={interactionMode === 'pan' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInteractionMode('pan')}
                title="Modo: Mover canvas"
                className="gap-1.5"
              >
                <Hand className="h-4 w-4" />
                <span className="hidden sm:inline">Mover</span>
              </Button>
              <Button
                variant={interactionMode === 'zoom' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInteractionMode('zoom')}
                title="Modo: Zoom y navegación"
                className="gap-1.5"
              >
                <ZoomIn className="h-4 w-4" />
                <span className="hidden sm:inline">Zoom</span>
              </Button>
            </div>
            
            {/* Controles de zoom */}
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetZoom}
                title="Resetear zoom y posición"
                className="gap-1.5"
              >
                <span className="text-xs">Reset</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-muted/30">
        <svg
          ref={svgRef}
          className="h-full w-full"
          viewBox={`0 0 ${APP_CONFIG.GRAPH_VIEWBOX_WIDTH} ${APP_CONFIG.GRAPH_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        />

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

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useNoteStore } from '@/stores/noteStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, FileText, Move, ZoomIn, Hand, ZoomOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { 
  APP_CONFIG, 
  UI_MESSAGES, 
  PILLAR_COLORS,
  PILLAR_COLORS_SVG,
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
  const { notes, getFilteredNotes, setCurrentNote, setViewMode } = useNoteStore();
  const filteredNotes = getFilteredNotes();
  const { theme, resolvedTheme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('nodes');
  const [mounted, setMounted] = useState(false);

  // Detectar si estamos en dark mode
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Generar nodos y conexiones basadas en tags y referencias
  const { nodes, links } = useMemo(() => {
    // Usar dimensiones por defecto para la distribución inicial
    // Se ajustarán dinámicamente cuando se monte el componente
    const defaultWidth = APP_CONFIG.GRAPH_VIEWBOX_WIDTH;
    const defaultHeight = APP_CONFIG.GRAPH_VIEWBOX_HEIGHT;
    const centerX = defaultWidth / 2;
    const centerY = defaultHeight / 2;
    const radius = Math.min(defaultWidth, defaultHeight) * 0.3; // 30% del tamaño menor
    
    const graphNodes: GraphNode[] = filteredNotes.map((note, index) => {
      // Distribución circular inicial para mejor visualización
      const angle = (index / filteredNotes.length) * D3_SIMULATION.FULL_CIRCLE_RADIANS;
      const x = Math.cos(angle) * radius + centerX;
      const y = Math.sin(angle) * radius + centerY;

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
    filteredNotes.forEach((note, i) => {
      filteredNotes.slice(i + 1).forEach((otherNote) => {
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
          if (filteredNotes.some((n) => n.id === linkedId)) {
            graphLinks.push({
              source: note.id,
              target: linkedId,
            });
          }
        });
      }
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [filteredNotes]);

  // Inicializar y actualizar la simulación de D3
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    // Obtener dimensiones reales del contenedor
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width || APP_CONFIG.GRAPH_VIEWBOX_WIDTH;
    const height = containerRect.height || APP_CONFIG.GRAPH_VIEWBOX_HEIGHT;
    
    // Actualizar viewBox para que coincida con las dimensiones del contenedor
    svg.attr('viewBox', `0 0 ${width} ${height}`);

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
            width / 2,
            height / 2,
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
      .translate(width / 2, height / 2)
      .scale(APP_CONFIG.ZOOM_INITIAL_SCALE)
      .translate(-width / 2, -height / 2);
    
    svg.call(zoom.transform, initialTransform);

    // Dibujar links
    const linkElements = linkGroup
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', D3_SIMULATION.LINK_STROKE_WIDTH)
      .attr('class', 'stroke-border opacity-30 dark:opacity-20');

    // Dibujar nodos con colores mejorados para dark mode
    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', APP_CONFIG.GRAPH_NODE_RADIUS)
      .attr('fill', (d) => {
        const pillar = d.pillar as keyof typeof PILLAR_COLORS_SVG;
        const colors = PILLAR_COLORS_SVG[pillar] ?? PILLAR_COLORS_SVG.default;
        return isDarkMode ? colors.dark : colors.light;
      })
      .attr('stroke', (d) => {
        const pillar = d.pillar as keyof typeof PILLAR_COLORS_SVG;
        const colors = PILLAR_COLORS_SVG[pillar] ?? PILLAR_COLORS_SVG.default;
        // Borde más oscuro para mejor contraste
        return isDarkMode ? colors.dark : colors.light;
      })
      .attr('stroke-width', isDarkMode ? '2' : '1')
      .attr('class', (d) => {
        const cursorClass = interactionMode === 'nodes' ? 'cursor-move' : 'cursor-pointer';
        return `${cursorClass} transition-all hover:opacity-80`;
      })
      .style('filter', isDarkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))' : 'none')
      .call(nodeDrag)
      .on('click', (event, d) => {
        event.stopPropagation();
        if (interactionMode === 'nodes') {
          handleNodeClick(d.id);
        }
      });

    // Dibujar etiquetas de texto con mejor contraste
    const textElements = nodeGroup
      .selectAll<SVGTextElement, GraphNode>('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', isDarkMode ? '#f9fafb' : '#111827') // Mejor contraste en dark mode
      .attr('class', 'text-xs pointer-events-none')
      .style('font-weight', isDarkMode ? '500' : '400')
      .style('text-shadow', isDarkMode ? '0 1px 2px rgba(0, 0, 0, 0.8)' : 'none')
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
  }, [nodes, links, interactionMode, isDarkMode]);

  // Actualizar viewBox cuando cambia el tamaño del contenedor
  useEffect(() => {
    const updateViewBox = () => {
      if (!svgRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      if (containerRect.width > 0 && containerRect.height > 0) {
        const svg = d3.select(svgRef.current);
        svg.attr('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
      }
    };

    const handleResize = () => {
      updateViewBox();
    };

    // Usar ResizeObserver para detectar cambios en el tamaño del contenedor
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Ejecutar una vez al montar con un pequeño delay para asegurar que el DOM esté listo
    setTimeout(updateViewBox, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width || APP_CONFIG.GRAPH_VIEWBOX_WIDTH;
    const height = containerRect.height || APP_CONFIG.GRAPH_VIEWBOX_HEIGHT;
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(APP_CONFIG.ZOOM_INITIAL_SCALE)
      .translate(-width / 2, -height / 2);
    
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
    <div className="flex h-full flex-col overflow-hidden min-h-0">
      <div className="border-b p-4 shrink-0">
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

      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-muted/30 dark:bg-muted/20 min-h-0">
        <svg
          ref={svgRef}
          className="h-full w-full"
          viewBox={`0 0 ${APP_CONFIG.GRAPH_VIEWBOX_WIDTH} ${APP_CONFIG.GRAPH_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Legend - Ajustado para no salirse de la pantalla */}
        <div className="absolute bottom-4 left-4 max-h-[calc(100%-8rem)] overflow-y-auto rounded-lg border bg-card p-3 shadow-sm">
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

        {/* Node list - Ajustado para no salirse de la pantalla */}
        <div className="absolute right-4 top-4 max-h-[calc(100%-2rem)] w-64 overflow-y-auto rounded-lg border bg-card p-4 shadow-sm">
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

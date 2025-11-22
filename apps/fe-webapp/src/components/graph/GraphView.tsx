'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useNoteStore } from '@/stores/noteStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, FileText, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { fetchGraphData } from '@/services/ragService';
import type { D3Node, D3Edge } from '@/types/graph';
import { 
  APP_CONFIG, 
  UI_MESSAGES, 
  D3_SIMULATION,
  ANIMATION_DURATION,
} from '@/constants';


// Colors for the RAG graph
const GRAPH_COLORS = {
  memory: '#8B5CF6',
  note: '#3B82F6',
  tag: '#10B981',
  edge: '#A855F7',      // Purple-500 - más visible
  edgeWeak: '#9333EA',  // Purple-600 - más visible
  text: '#E5E7EB',
  textMuted: '#9CA3AF',
  background: '#0A0A0A',
  cardBg: '#18181B',
  border: '#27272A',
};

const CATEGORY_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6',
];

export interface NewNodeData {
  node: {
    id: string;
    label: string;
    type: string;
    category?: string;
    created_at?: string;
  };
  edges: {
    source: string;
    target: string;
    weight: number;
  }[];
}

interface GraphViewProps {
  onNewNode?: (nodeData: NewNodeData) => void;
  newNodeToAdd?: NewNodeData | null;
}

export default function GraphView({ onNewNode, newNodeToAdd }: GraphViewProps = {}) {
  const { notes, setCurrentNote, setViewMode } = useNoteStore();
  const { theme, resolvedTheme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: D3Node[], edges: D3Edge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0 });
  const [categoryColorMap, setCategoryColorMap] = useState<Map<string, string>>(new Map());
  const [newNodeId, setNewNodeId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const currentTransformRef = useRef<d3.ZoomTransform | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Update dimensions on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch graph data from RAG API
  const loadGraphData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGraphData(500);
      
      const categories = new Set<string>();
      data.nodes.forEach(node => {
        if (node.category) {
          categories.add(node.category);
        }
      });

      const colorMap = new Map<string, string>();
      Array.from(categories).forEach((category, index) => {
        colorMap.set(category, CATEGORY_COLORS[index % CATEGORY_COLORS.length]);
      });
      setCategoryColorMap(colorMap);

      const nodes: D3Node[] = data.nodes.map(node => ({
        ...node,
        color: getNodeColor(node.type, node.category, colorMap),
        size: getNodeSize(node.type),
      }));

      const edges: D3Edge[] = data.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        strength: edge.weight * 0.5,
      }));

      setGraphData({ nodes, edges });
      setStats({
        nodeCount: data.metadata.node_count,
        edgeCount: data.metadata.edge_count,
      });
    } catch (err) {
      console.error('Error loading graph data:', err);
      setError('Failed to load graph data. Make sure the RAG API is running.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  const getNodeColor = (type: string, category?: string, colorMap?: Map<string, string>): string => {
    if (category && colorMap && colorMap.has(category)) {
      return colorMap.get(category)!;
    }
    if (type === 'memory') return GRAPH_COLORS.memory;
    if (type === 'note') return GRAPH_COLORS.note;
    if (type === 'tag') return GRAPH_COLORS.tag;
    return GRAPH_COLORS.memory;
  };

  const getNodeSize = (type: string): number => {
    if (type === 'memory') return 8;
    if (type === 'note') return 10;
    if (type === 'tag') return 6;
    return 8;
  };

  // Initialize D3 force simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width || APP_CONFIG.GRAPH_VIEWBOX_WIDTH;
    const height = containerRect.height || APP_CONFIG.GRAPH_VIEWBOX_HEIGHT;
    
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    
    // Only clear and reinitialize if not already initialized or if graphData changed significantly
    const shouldReinitialize = !isInitialized;
    
    if (shouldReinitialize) {
      svg.selectAll('*').remove();
    }

    let containerGroup = svg.select<SVGGElement>('g.container');
    let linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    let nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

    if (containerGroup.empty() || shouldReinitialize) {
      svg.selectAll('*').remove();
      containerGroup = svg.append('g').attr('class', 'container');
      linkGroup = containerGroup.append('g').attr('class', 'links');
      nodeGroup = containerGroup.append('g').attr('class', 'nodes');
    } else {
      linkGroup = containerGroup.select<SVGGElement>('g.links');
      nodeGroup = containerGroup.select<SVGGElement>('g.nodes');
    }

    const nodeCount = graphData.nodes.length;
    let initialScale = 1;
    if (nodeCount > 100) initialScale = 0.3;
    else if (nodeCount > 50) initialScale = 0.5;
    else if (nodeCount > 30) initialScale = 0.7;
    else if (nodeCount > 10) initialScale = 0.85;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([APP_CONFIG.ZOOM_MIN_SCALE, APP_CONFIG.ZOOM_MAX_SCALE])
      .on('zoom', (event) => {
        containerGroup.attr('transform', event.transform.toString());
        currentTransformRef.current = event.transform;
      });

    zoomRef.current = zoom;
    svg.call(zoom);
    
    // Only apply initial transform if we're initializing for the first time or if there's no saved transform
    if (shouldReinitialize && !currentTransformRef.current) {
      const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initialScale)
        .translate(-width / 2, -height / 2);
      
      svg.call(zoom.transform, initialTransform);
      currentTransformRef.current = initialTransform;
    } else if (currentTransformRef.current) {
      // Restore previous transform
      svg.call(zoom.transform, currentTransformRef.current);
    }

    // Reuse existing simulation if available, otherwise create new one
    let simulation = simulationRef.current;
    
    if (!simulation || shouldReinitialize) {
      const newNode = graphData.nodes.find(n => n.id === newNodeId);
      const centerX = newNode && newNode.x ? newNode.x : width / 2;
      const centerY = newNode && newNode.y ? newNode.y : height / 2;

      simulation = d3.forceSimulation<D3Node>(graphData.nodes)
        .force('link', d3.forceLink<D3Node, D3Edge>(graphData.edges)
          .id(d => d.id)
          .distance(d => 100 / (d.weight + 0.1))
          .strength(d => d.strength || 0.5)
        )
        .force('charge', d3.forceManyBody().strength(APP_CONFIG.FORCE_CHARGE_STRENGTH))
        .force('collision', d3.forceCollide<D3Node>().radius(d => {
          const baseRadius = d.size || 8;
          const isNewNode = d.id === newNodeId;
          return (isNewNode ? baseRadius * 3 : baseRadius) + 15;
        }))
        .force('center', d3.forceCenter(centerX, centerY).strength(D3_SIMULATION.CENTER_FORCE_STRENGTH))
        .alphaDecay(APP_CONFIG.FORCE_ALPHA_DECAY)
        .velocityDecay(APP_CONFIG.FORCE_VELOCITY_DECAY);

      simulationRef.current = simulation;
      setIsInitialized(true);
    } else {
      // Update existing simulation with new data
      simulation.nodes(graphData.nodes);
      const linkForce = simulation.force<d3.ForceLink<D3Node, D3Edge>>('link');
      if (linkForce) {
        linkForce.links(graphData.edges);
      }
      simulation.alpha(0.3).restart();
    }

    const nodeDrag = d3.drag<SVGCircleElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(D3_SIMULATION.ALPHA_TARGET_ACTIVE).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        // Update both fixed and current positions for smooth synchronized movement
        d.fx = event.x;
        d.fy = event.y;
        d.x = event.x;
        d.y = event.y;
        
        // Force immediate visual update of the node being dragged
        d3.select(event.sourceEvent.target as SVGCircleElement)
          .attr('cx', d.x)
          .attr('cy', d.y);
        
        // Update connected edges immediately
        linkMerge.each(function(linkData) {
          const link = d3.select(this);
          const sourceNode = typeof linkData.source === 'object' ? linkData.source : null;
          const targetNode = typeof linkData.target === 'object' ? linkData.target : null;
          
          if (sourceNode?.id === d.id || targetNode?.id === d.id) {
            link
              .attr('x1', sourceNode?.x || 0)
              .attr('y1', sourceNode?.y || 0)
              .attr('x2', targetNode?.x || 0)
              .attr('y2', targetNode?.y || 0);
          }
        });
        
        // Update text label immediately
        textMerge.filter(textData => textData.id === d.id)
          .attr('x', d.x)
          .attr('y', d.y + APP_CONFIG.GRAPH_TEXT_OFFSET_Y);
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(D3_SIMULATION.ALPHA_TARGET_INACTIVE);
        d.fx = null;
        d.fy = null;
      });

    // Update links with data join pattern
    const linkElements = linkGroup
      .selectAll<SVGLineElement, D3Edge>('line')
      .data(graphData.edges, (d: D3Edge) => `${typeof d.source === 'object' ? d.source.id : d.source}-${typeof d.target === 'object' ? d.target.id : d.target}`);
    
    linkElements.exit().remove();
    
    const linkEnter = linkElements.enter()
      .append('line')
      .attr('stroke', d => d.weight > 0.5 ? GRAPH_COLORS.edge : GRAPH_COLORS.edgeWeak)
      .attr('stroke-opacity', d => 0.4 + (d.weight * 0.3))
      .attr('stroke-width', d => 0.5 + (d.weight * 1.5));
    
    const linkMerge = linkEnter.merge(linkElements);

    // Update nodes with data join pattern
    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(graphData.nodes, (d: D3Node) => d.id);
    
    nodeElements.exit().remove();
    
    const nodeEnter = nodeElements.enter()
      .append('circle')
      .attr('class', 'cursor-move transition-all hover:opacity-80')
      .call(nodeDrag)
      .on('click', (_event, d) => {
        handleNodeClick(d.id);
      });
    
    const nodeMerge = nodeEnter.merge(nodeElements)
      .attr('r', d => {
        const isNew = d.id === newNodeId;
        if (isNew) return (d.size || 8) * 3;
        return d.size || APP_CONFIG.GRAPH_NODE_RADIUS;
      })
      .attr('fill', d => d.color || GRAPH_COLORS.memory)
      .attr('stroke', d => d.id === newNodeId ? '#FFD700' : (isDarkMode ? (d.color || GRAPH_COLORS.memory) : '#fff'))
      .attr('stroke-width', d => d.id === newNodeId ? 6 : (isDarkMode ? '2' : '1'))
      .style('filter', d => {
        if (d.id === newNodeId) return 'drop-shadow(0 0 20px #FFD700)';
        return isDarkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))' : 'none';
      });

    // Add pulse animation to new node
    if (newNodeId) {
      nodeMerge.filter(d => d.id === newNodeId)
        .transition().duration(600).attr('r', d => (d.size || 8) * 4)
        .transition().duration(600).attr('r', d => (d.size || 8) * 3)
        .transition().duration(600).attr('r', d => (d.size || 8) * 3.5)
        .transition().duration(600).attr('r', d => (d.size || 8) * 3);
    }

    // Update text with data join pattern
    const textElements = nodeGroup
      .selectAll<SVGTextElement, D3Node>('text')
      .data(graphData.nodes, (d: D3Node) => d.id);
    
    textElements.exit().remove();
    
    const textEnter = textElements.enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs pointer-events-none');
    
    const textMerge = textEnter.merge(textElements)
      .attr('fill', d => d.id === newNodeId ? '#FFD700' : (isDarkMode ? '#f9fafb' : '#111827'))
      .attr('font-size', d => d.id === newNodeId ? 14 : 10)
      .attr('font-weight', d => d.id === newNodeId ? 'bold' : (isDarkMode ? '500' : 'normal'))
      .style('text-shadow', isDarkMode ? '0 1px 2px rgba(0, 0, 0, 0.8)' : 'none')
      .text(d => d.label.length > 30 ? d.label.substring(0, 30) + '...' : d.label);

    let tickCount = 0;
    simulation.on('tick', () => {
      linkMerge
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x : 0) || 0)
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y : 0) || 0)
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x : 0) || 0)
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y : 0) || 0);

      nodeMerge
        .attr('cx', d => d.x || D3_SIMULATION.DEFAULT_X)
        .attr('cy', d => d.y || D3_SIMULATION.DEFAULT_Y);

      textMerge
        .attr('x', d => d.x || D3_SIMULATION.DEFAULT_X)
        .attr('y', d => (d.y || D3_SIMULATION.DEFAULT_Y) + APP_CONFIG.GRAPH_TEXT_OFFSET_Y);

      tickCount++;
      if (newNodeId && tickCount === 50) {
        const newNode = graphData.nodes.find(n => n.id === newNodeId);
        if (newNode && newNode.x !== undefined && newNode.y !== undefined) {
          const scale = initialScale * 1.5;
          const transform = d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-newNode.x, -newNode.y);
          
          svg.transition().duration(1000).call(zoom.transform, transform);
        }
      }
    });

    return () => {
      if (shouldReinitialize) {
        simulation.stop();
        svg.on('.zoom', null);
      }
    };
  }, [graphData, isDarkMode, newNodeId]);

  // Update viewBox on resize
  useEffect(() => {
    const updateViewBox = () => {
      if (!svgRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      if (containerRect.width > 0 && containerRect.height > 0) {
        const svg = d3.select(svgRef.current);
        svg.attr('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
      }
    };

    const resizeObserver = new ResizeObserver(updateViewBox);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    setTimeout(updateViewBox, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);


  const handleNodeClick = (nodeId: string) => {
    const note = notes.find((n) => n.id === nodeId);
    if (note) {
      setCurrentNote(note);
      setViewMode('note');
    }
  };

  const handleFocusNode = useCallback((nodeId: string) => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
    
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node || node.x === undefined || node.y === undefined) return;

    const svg = d3.select(svgRef.current);
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width || APP_CONFIG.GRAPH_VIEWBOX_WIDTH;
    const height = containerRect.height || APP_CONFIG.GRAPH_VIEWBOX_HEIGHT;

    // Get current transform and calculate distance to target node
    const currentTransform = d3.zoomTransform(svg.node()!);
    
    // Calculate current center in graph coordinates
    const currentCenterX = (width / 2 - currentTransform.x) / currentTransform.k;
    const currentCenterY = (height / 2 - currentTransform.y) / currentTransform.k;
    
    // Calculate distance to target node
    const dx = node.x - currentCenterX;
    const dy = node.y - currentCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate duration based on distance (min 600ms, max 1200ms for more agility)
    const baseDuration = 600;
    const maxDuration = 1200;
    const distanceFactor = Math.min(distance / 1000, 1.5);
    const duration = Math.min(baseDuration + (distanceFactor * 400), maxDuration);

    // Calculate target scale
    const targetScale = Math.max(currentTransform.k * 1.5, 1.5);

    // Create transform to center on node
    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(targetScale)
      .translate(-node.x, -node.y);

    // Pause simulation during transition for smoother movement
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Animate to the node with easing
    svg.transition()
      .duration(duration)
      .ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, transform)
      .on('end', () => {
        // Resume simulation after transition with minimal activity
        if (simulationRef.current) {
          simulationRef.current.alpha(0.03).restart();
        }
      });

    // Highlight the node (stays highlighted until another node is selected)
    setNewNodeId(nodeId);
  }, [graphData.nodes]);

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
    
    // Pause simulation during transition
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    
    svg.transition()
      .duration(600)
      .ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, initialTransform)
      .on('end', () => {
        // Resume simulation after transition with minimal activity
        if (simulationRef.current) {
          simulationRef.current.alpha(0.03).restart();
        }
      });
  };

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    if (!svg.on('.zoom')) {
      svg.call(zoomRef.current);
    }
    
    const currentTransform = d3.zoomTransform(svg.node()!);
    const newScale = Math.min(
      currentTransform.k + APP_CONFIG.ZOOM_STEP,
      APP_CONFIG.ZOOM_MAX_SCALE,
    );
    
    // Pause simulation during zoom
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    
    svg.transition()
      .duration(ANIMATION_DURATION.ZOOM_STEP)
      .ease(d3.easeCubicOut)
      .call(zoomRef.current.scaleBy, newScale / currentTransform.k)
      .on('end', () => {
        // Resume simulation after zoom with minimal activity
        if (simulationRef.current) {
          simulationRef.current.alpha(0.02).restart();
        }
      });
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    if (!svg.on('.zoom')) {
      svg.call(zoomRef.current);
    }
    
    const currentTransform = d3.zoomTransform(svg.node()!);
    const newScale = Math.max(
      currentTransform.k - APP_CONFIG.ZOOM_STEP,
      APP_CONFIG.ZOOM_MIN_SCALE,
    );
    
    // Pause simulation during zoom
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    
    svg.transition()
      .duration(ANIMATION_DURATION.ZOOM_STEP)
      .ease(d3.easeCubicOut)
      .call(zoomRef.current.scaleBy, newScale / currentTransform.k)
      .on('end', () => {
        // Resume simulation after zoom with minimal activity
        if (simulationRef.current) {
          simulationRef.current.alpha(0.02).restart();
        }
      });
  };

  const handleRefresh = () => {
    setIsInitialized(false);
    currentTransformRef.current = null;
    loadGraphData();
  };

  const addNewNode = useCallback((nodeData: NewNodeData) => {
    setGraphData(prevData => {
      if (prevData.nodes.find(n => n.id === nodeData.node.id)) {
        return prevData;
      }

      const updatedColorMap = new Map(categoryColorMap);
      if (nodeData.node.category && !updatedColorMap.has(nodeData.node.category)) {
        updatedColorMap.set(
          nodeData.node.category,
          CATEGORY_COLORS[updatedColorMap.size % CATEGORY_COLORS.length]
        );
        setCategoryColorMap(updatedColorMap);
      }

      const newD3Node: D3Node = {
        ...nodeData.node,
        color: getNodeColor(nodeData.node.type, nodeData.node.category, updatedColorMap),
        size: getNodeSize(nodeData.node.type),
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };

      const newEdges: D3Edge[] = nodeData.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        strength: edge.weight * 0.5,
      }));

      const validEdges = newEdges.filter(edge => {
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        return prevData.nodes.find(n => n.id === targetId);
      });

      setStats(prev => ({
        nodeCount: prev.nodeCount + 1,
        edgeCount: prev.edgeCount + validEdges.length,
      }));

      // Highlight the new node (stays highlighted until another node is selected)
      setNewNodeId(nodeData.node.id);

      return {
        nodes: [...prevData.nodes, newD3Node],
        edges: [...prevData.edges, ...validEdges],
      };
    });
  }, [categoryColorMap, dimensions]);

  useEffect(() => {
    if (onNewNode) {
      (window as unknown as { addGraphNode?: (nodeData: NewNodeData) => void }).addGraphNode = addNewNode;
    }
  }, [addNewNode, onNewNode]);

  useEffect(() => {
    const windowWithGraph = window as unknown as { 
      addGraphNode?: (nodeData: NewNodeData) => void;
      pendingGraphNode?: NewNodeData;
    };
    
    if (windowWithGraph.pendingGraphNode && graphData.nodes.length > 0) {
      const pendingNode = windowWithGraph.pendingGraphNode;
      
      setTimeout(() => {
        addNewNode(pendingNode);
        delete windowWithGraph.pendingGraphNode;
      }, 500);
    }
  }, [graphData.nodes.length, addNewNode]);

  useEffect(() => {
    if (newNodeToAdd && graphData.nodes.length > 0) {
      const nodeExists = graphData.nodes.find(n => n.id === newNodeToAdd.node.id);
      if (!nodeExists) {
        setTimeout(() => {
          addNewNode(newNodeToAdd);
        }, 500);
      } else {
        // Highlight existing node (stays highlighted until another node is selected)
        setNewNodeId(newNodeToAdd.node.id);
      }
    }
  }, [newNodeToAdd, graphData.nodes.length, graphData.nodes, addNewNode]);

  const getModeDescription = () => {
    return 'Arrastra los nodos para reorganizarlos. Usa la rueda del mouse para hacer zoom.';
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <Network className="h-5 w-5" />
              Error Loading Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Graph View
            </CardTitle>
            <CardDescription>
              Vista de conexiones entre tus memorias
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
    <div className="flex h-full flex-col overflow-hidden max-h-screen">
      <div className="border-b p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Memory Graph</h2>
            <p className="text-sm text-muted-foreground">
              {getModeDescription()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRefresh}
                title="Recargar grafo"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-muted/30 dark:bg-muted/20 max-h-[calc(100vh-200px)]">
        <svg
          ref={svgRef}
          className="h-full w-full"
          viewBox={`0 0 ${APP_CONFIG.GRAPH_VIEWBOX_WIDTH} ${APP_CONFIG.GRAPH_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        />

        <div className="absolute bottom-4 left-4 max-h-[calc(100%-8rem)] overflow-y-auto rounded-lg border bg-card p-3 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Estadísticas</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-violet-500" />
              <span>Nodos: {stats.nodeCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-3 bg-indigo-500" />
              <span>Conexiones: {stats.edgeCount}</span>
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

        <div className="absolute right-4 top-4 max-h-[calc(100%-2rem)] w-64 overflow-y-auto rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Memorias ({graphData.nodes.length})</h3>
          <div className="space-y-1">
            {graphData.nodes.slice(0, 20).map((node) => (
              <Button
                key={node.id}
                variant="ghost"
                className="w-full justify-start text-xs h-auto py-1.5"
                onClick={() => handleFocusNode(node.id)}
              >
                <FileText className="mr-2 h-3 w-3" />
                <span className="truncate">{node.label}</span>
              </Button>
            ))}
            {graphData.nodes.length > 20 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{graphData.nodes.length - 20} más...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

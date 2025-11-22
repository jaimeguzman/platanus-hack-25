'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchGraphData } from '@/services/ragService';
import type { D3Node, D3Edge } from '@/types/graph';

// Colors for the graph
const GRAPH_COLORS = {
  memory: '#8B5CF6',    // Violet for memories
  note: '#3B82F6',      // Blue for notes
  tag: '#10B981',       // Green for tags
  edge: '#6366F1',      // Indigo for connections
  edgeWeak: '#4B5563',  // Gray for weak connections
  text: '#E5E7EB',      // Light gray for text
  textMuted: '#9CA3AF', // Gray for secondary text
  background: '#0A0A0A', // Dark background
  cardBg: '#18181B',    // Card background
  border: '#27272A',    // Borders
};

// Color palette for different categories
const CATEGORY_COLORS = [
  '#8B5CF6', // Violet
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
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

const GraphView: React.FC<GraphViewProps> = ({ onNewNode, newNodeToAdd }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: D3Node[], edges: D3Edge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0 });
  const [categoryColorMap, setCategoryColorMap] = useState<Map<string, string>>(new Map());
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null);
  const [newNodeId, setNewNodeId] = useState<string | null>(null);

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

  // Fetch graph data from API
  const loadGraphData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGraphData(500);
      
      // Build category to color mapping
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

      // Transform API data to D3 format
      const nodes: D3Node[] = data.nodes.map(node => ({
        ...node,
        color: getNodeColor(node.type, node.category, colorMap),
        size: getNodeSize(node.type),
      }));

      const edges: D3Edge[] = data.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        strength: edge.weight * 0.5, // Scale weight to strength
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

  // Load data on mount
  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Get node color based on type and category
  const getNodeColor = (type: string, category?: string, colorMap?: Map<string, string>): string => {
    // If there's a category and we have a color mapping, use it
    if (category && colorMap && colorMap.has(category)) {
      return colorMap.get(category)!;
    }
    
    // Fallback to type-based colors
    if (type === 'memory') return GRAPH_COLORS.memory;
    if (type === 'note') return GRAPH_COLORS.note;
    if (type === 'tag') return GRAPH_COLORS.tag;
    return GRAPH_COLORS.memory;
  };

  // Get node size based on type
  const getNodeSize = (type: string): number => {
    if (type === 'memory') return 8;
    if (type === 'note') return 10;
    if (type === 'tag') return 6;
    return 8;
  };

  // Initialize D3 force simulation and render
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group for zoom/pan
    const g = svg.append('g');

    // Calculate initial zoom based on number of nodes
    const nodeCount = graphData.nodes.length;
    let initialScale = 1;
    
    if (nodeCount > 100) {
      initialScale = 0.3;
    } else if (nodeCount > 50) {
      initialScale = 0.5;
    } else if (nodeCount > 30) {
      initialScale = 0.7;
    } else if (nodeCount > 10) {
      initialScale = 0.85;
    }

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Apply initial zoom
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initialScale)
      .translate(-width / 2, -height / 2);
    
    svg.call(zoom.transform, initialTransform);

    // Find the new node to center on it
    const newNode = graphData.nodes.find(n => n.id === newNodeId);
    const centerX = newNode && newNode.x ? newNode.x : width / 2;
    const centerY = newNode && newNode.y ? newNode.y : height / 2;

    // Create force simulation
    const simulation = d3.forceSimulation<D3Node>(graphData.nodes)
      .force('link', d3.forceLink<D3Node, D3Edge>(graphData.edges)
        .id(d => d.id)
        .distance(d => 100 / (d.weight + 0.1)) // Closer for higher weights
        .strength(d => d.strength || 0.5)
      )
      .force('charge', d3.forceManyBody()
        .strength(-300)
        .distanceMax(400)
      )
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collision', d3.forceCollide<D3Node>().radius(d => {
        // Give new node more space to avoid overlapping
        const baseRadius = d.size || 8;
        const isNewNode = d.id === newNodeId;
        return (isNewNode ? baseRadius * 3 : baseRadius) + 15;
      }));

    simulationRef.current = simulation;

    // Draw edges
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.edges)
      .join('line')
      .attr('stroke', d => d.weight > 0.5 ? GRAPH_COLORS.edge : GRAPH_COLORS.edgeWeak)
      .attr('stroke-opacity', d => 0.3 + (d.weight * 0.5))
      .attr('stroke-width', d => 1 + (d.weight * 3));

    // Draw nodes
    console.log('Rendering graph with newNodeId:', newNodeId);
    console.log('Nodes:', graphData.nodes.map(n => n.id));
    
    const node = g.append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('r', d => {
        // Make new node significantly larger
        const isNew = d.id === newNodeId;
        console.log(`Node ${d.id}: isNew=${isNew}, newNodeId=${newNodeId}`);
        if (isNew) {
          return (d.size || 8) * 3;
        }
        return d.size || 8;
      })
      .attr('fill', d => d.color || GRAPH_COLORS.memory)
      .attr('stroke', d => d.id === newNodeId ? '#FFD700' : '#fff')
      .attr('stroke-width', d => d.id === newNodeId ? 6 : 2)
      .style('cursor', 'pointer')
      .style('filter', d => d.id === newNodeId ? 'drop-shadow(0 0 20px #FFD700)' : 'none')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(drag(simulation) as any);

    // Add pulse animation to new node
    if (newNodeId) {
      node.filter(d => d.id === newNodeId)
        .transition()
        .duration(600)
        .attr('r', d => (d.size || 8) * 4)
        .transition()
        .duration(600)
        .attr('r', d => (d.size || 8) * 3)
        .transition()
        .duration(600)
        .attr('r', d => (d.size || 8) * 3.5)
        .transition()
        .duration(600)
        .attr('r', d => (d.size || 8) * 3);
    }

    // Add labels
    const label = g.append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .text(d => d.label.length > 30 ? d.label.substring(0, 30) + '...' : d.label)
      .attr('font-size', d => d.id === newNodeId ? 14 : 10)
      .attr('font-weight', d => d.id === newNodeId ? 'bold' : 'normal')
      .attr('dx', d => d.id === newNodeId ? 18 : 12)
      .attr('dy', 4)
      .attr('fill', d => d.id === newNodeId ? '#FFD700' : GRAPH_COLORS.text)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Add hover effects
    node
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d.size || 8) * 1.5)
          .attr('stroke-width', 3);

        // Highlight connected edges
        link
          .transition()
          .duration(200)
          .attr('stroke-opacity', l => {
            const source = typeof l.source === 'object' ? l.source.id : l.source;
            const target = typeof l.target === 'object' ? l.target.id : l.target;
            return (source === d.id || target === d.id) ? 0.8 : 0.1;
          });
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size || 8)
          .attr('stroke-width', 2);

        // Reset edge opacity
        link
          .transition()
          .duration(200)
          .attr('stroke-opacity', l => 0.3 + (l.weight * 0.5));
      })
      .on('click', function(event, d) {
        console.log('Clicked node:', d);
        // TODO: Add navigation or detail view
      });

    // Update positions on simulation tick
    let tickCount = 0;
    simulation.on('tick', () => {
      link
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x : 0) || 0)
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y : 0) || 0)
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x : 0) || 0)
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y : 0) || 0);

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      label
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);

      // Center on new node after simulation stabilizes
      tickCount++;
      if (newNodeId && tickCount === 50) {
        const newNode = graphData.nodes.find(n => n.id === newNodeId);
        if (newNode && newNode.x !== undefined && newNode.y !== undefined) {
          console.log('Centering on new node at:', newNode.x, newNode.y);
          
          // Calculate transform to center the new node
          const scale = initialScale * 1.5; // Zoom in a bit more
          const transform = d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-newNode.x, -newNode.y);
          
          // Animate to the new position
          svg.transition()
            .duration(1000)
            .call(zoom.transform, transform);
        }
      }
    });

    // Drag behavior
    function drag(simulation: d3.Simulation<D3Node, D3Edge>) {
      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGCircleElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions]);


  const handleRefresh = () => {
    loadGraphData();
  };

  // Function to add a new node dynamically
  const addNewNode = useCallback((nodeData: NewNodeData) => {
    setGraphData(prevData => {
      // Check if node already exists
      if (prevData.nodes.find(n => n.id === nodeData.node.id)) {
        console.log('Node already exists, skipping');
        return prevData;
      }

      // Get or create color for category
      const updatedColorMap = new Map(categoryColorMap);
      if (nodeData.node.category && !updatedColorMap.has(nodeData.node.category)) {
        updatedColorMap.set(
          nodeData.node.category,
          CATEGORY_COLORS[updatedColorMap.size % CATEGORY_COLORS.length]
        );
        setCategoryColorMap(updatedColorMap);
      }

      // Create new D3 node
      const newD3Node: D3Node = {
        ...nodeData.node,
        color: getNodeColor(nodeData.node.type, nodeData.node.category, updatedColorMap),
        size: getNodeSize(nodeData.node.type),
        // Position near center for animation
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };

      // Create new edges
      const newEdges: D3Edge[] = nodeData.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        strength: edge.weight * 0.5,
      }));

      // Filter out edges where target nodes don't exist
      const validEdges = newEdges.filter(edge => {
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        return prevData.nodes.find(n => n.id === targetId);
      });

      // Update stats
      setStats(prev => ({
        nodeCount: prev.nodeCount + 1,
        edgeCount: prev.edgeCount + validEdges.length,
      }));

      // Mark this as the new node for animation
      setNewNodeId(nodeData.node.id);
      
      // Clear the highlight after animation (increased time)
      setTimeout(() => setNewNodeId(null), 10000);

      return {
        nodes: [...prevData.nodes, newD3Node],
        edges: [...prevData.edges, ...validEdges],
      };
    });
  }, [categoryColorMap, dimensions, getNodeColor, getNodeSize]);

  // Expose addNewNode function via callback
  useEffect(() => {
    if (onNewNode) {
      // This is a workaround to expose the function
      // In a real app, you'd use a ref or context
      (window as unknown as { addGraphNode?: (nodeData: NewNodeData) => void }).addGraphNode = addNewNode;
    }
  }, [addNewNode, onNewNode]);

  // Check for pending graph node after navigation
  useEffect(() => {
    const windowWithGraph = window as unknown as { 
      addGraphNode?: (nodeData: NewNodeData) => void;
      pendingGraphNode?: NewNodeData;
    };
    
    // Check if there's a pending node to add
    if (windowWithGraph.pendingGraphNode && graphData.nodes.length > 0) {
      const pendingNode = windowWithGraph.pendingGraphNode;
      
      // Add the node after a short delay to ensure graph is rendered
      setTimeout(() => {
        addNewNode(pendingNode);
        // Clear the pending node
        delete windowWithGraph.pendingGraphNode;
      }, 500);
    }
  }, [graphData.nodes.length, addNewNode]);

  // Add new node from prop
  useEffect(() => {
    if (newNodeToAdd && graphData.nodes.length > 0) {
      console.log('New node to add:', newNodeToAdd.node.id);
      // Check if node doesn't already exist
      const nodeExists = graphData.nodes.find(n => n.id === newNodeToAdd.node.id);
      if (!nodeExists) {
        console.log('Adding new node to graph');
        setTimeout(() => {
          addNewNode(newNodeToAdd);
        }, 500);
      } else {
        console.log('Node already exists, setting as new node');
        setNewNodeId(newNodeToAdd.node.id);
        setTimeout(() => setNewNodeId(null), 10000);
      }
    }
  }, [newNodeToAdd, graphData.nodes.length, graphData.nodes, addNewNode]);

  // Loading state
  if (isLoading) {
    return (
      <div ref={containerRef} className="flex-1 relative flex items-center justify-center" style={{ backgroundColor: GRAPH_COLORS.background }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: GRAPH_COLORS.textMuted }} className="text-sm">Loading graph...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={containerRef} className="flex-1 relative flex items-center justify-center" style={{ backgroundColor: GRAPH_COLORS.background }}>
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="bg-violet-600 hover:bg-violet-700 text-white border-violet-500">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative" style={{ backgroundColor: GRAPH_COLORS.background }}>


      {/* Graph Info */}
      <div
        className="absolute top-4 left-4 z-10 p-4 rounded-xl border"
        style={{ backgroundColor: GRAPH_COLORS.cardBg, borderColor: GRAPH_COLORS.border }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: GRAPH_COLORS.text }}>
          Memory Graph
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GRAPH_COLORS.memory }} />
            <span style={{ color: GRAPH_COLORS.textMuted }}>Nodes: {stats.nodeCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5" style={{ backgroundColor: GRAPH_COLORS.edge }} />
            <span style={{ color: GRAPH_COLORS.textMuted }}>Connections: {stats.edgeCount}</span>
          </div>
        </div>

        {/* Categories Legend */}
        {categoryColorMap.size > 0 && (
          <div className="mt-4 pt-3 border-t" style={{ borderColor: GRAPH_COLORS.border }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: GRAPH_COLORS.text }}>
              Categories
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {Array.from(categoryColorMap.entries()).map(([category, color]) => (
                <div key={category} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs truncate" style={{ color: GRAPH_COLORS.textMuted }}>
                    {category || 'Uncategorized'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs" style={{ color: GRAPH_COLORS.textMuted }}>
          Drag nodes to rearrange
        </p>
        <p className="text-xs" style={{ color: GRAPH_COLORS.textMuted }}>
          Scroll to zoom, drag to pan
        </p>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />
    </div>
  );
};

export default GraphView;

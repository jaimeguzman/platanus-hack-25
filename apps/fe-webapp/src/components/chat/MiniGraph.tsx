'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import type { D3Node, D3Edge } from '@/types/graph';

interface NodeFamily {
  parentId: number;
  neighborIds: number[];
}

interface MiniGraphProps {
  highlightedNodeIds?: number[];
  nodeFamilies?: NodeFamily[];
  originalSearchNodes?: number[];
  className?: string;
}

// Color palette (defined outside component to be stable)
const COLOR_PALETTE = [
  { fill: '#10b981', stroke: '#34d399' }, // Green
  { fill: '#3b82f6', stroke: '#60a5fa' }, // Blue
  { fill: '#f59e0b', stroke: '#fbbf24' }, // Amber
  { fill: '#ef4444', stroke: '#f87171' }, // Red
  { fill: '#8b5cf6', stroke: '#a78bfa' }, // Purple
  { fill: '#ec4899', stroke: '#f472b6' }, // Pink
  { fill: '#14b8a6', stroke: '#2dd4bf' }, // Teal
  { fill: '#f97316', stroke: '#fb923c' }, // Orange
];

export function MiniGraph({ 
  highlightedNodeIds = [], 
  nodeFamilies = [],
  originalSearchNodes = [],
  className = '' 
}: MiniGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: D3Node[], edges: D3Edge[] }>({ 
    nodes: [], 
    edges: [] 
  });
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  
  // Persistent color mapping to keep colors stable across expansions
  const nodeColorMapRef = useRef<Map<string, { fill: string; stroke: string; colorIndex: number }>>(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Fetch mini graph data
  const loadGraphData = useCallback(async () => {
    try {
      const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';
      const response = await fetch(`${RAG_API_URL}/export/graph`);
      
      if (!response.ok) {
        console.error('Failed to fetch mini graph data');
        return;
      }

      const data = await response.json();
      
      const nodes: D3Node[] = data.nodes.map((node: { id: string | number; label: string; category?: string }) => ({
        id: String(node.id),
        label: node.label,
        type: 'memory',
        category: node.category,
      }));

      const edges: D3Edge[] = data.edges.map((edge: { source: string | number; target: string | number; weight: number }) => ({
        source: String(edge.source),
        target: String(edge.target),
        weight: edge.weight,
      }));

      setGraphData({ nodes, edges });
    } catch (error) {
      console.error('Error loading mini graph:', error);
    }
  }, []);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Render the mini graph
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const width = 500;
    const height = 700;
    const svg = d3.select(svgRef.current);
    
    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    // Apply zoom with initial scale and center on the graph center
    const initialScale = 1;
    svg.call(zoom)
      .call(zoom.transform, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initialScale)
        .translate(-width / 2, -height / 2));
    
    // Store references for zoom controls
    zoomRef.current = zoom;
    svgSelectionRef.current = svg;

    // Create simulation with vertical layout preference
    const simulation = d3.forceSimulation<D3Node>(graphData.nodes)
      .force('link', d3.forceLink<D3Node, D3Edge>(graphData.edges)
        .id(d => d.id)
        .distance(20)
        .strength(0.4))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(6))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .force('x', d3.forceX(width / 2).strength(0.2));

    simulationRef.current = simulation;

    // Draw edges
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.edges)
      .join('line')
      .attr('class', d => `edge-${d.source}-${d.target}`)
      .attr('stroke', isDarkMode ? '#444' : '#ddd')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.4);

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes-group')
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('class', d => {
        const className = `node-${d.id}`;
        console.log(`Creating node with class: ${className}`);
        return className;
      })
      .attr('r', 4)
      .attr('fill', isDarkMode ? '#888' : '#666')
      .attr('stroke', isDarkMode ? '#333' : '#fff')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x || 0)
        .attr('y1', d => (d.source as D3Node).y || 0)
        .attr('x2', d => (d.target as D3Node).x || 0)
        .attr('y2', d => (d.target as D3Node).y || 0);

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);
    });

    // Stop simulation after a while
    simulation.alpha(0.3).restart();
    setTimeout(() => {
      simulation.stop();
    }, 3000);

    return () => {
      simulation.stop();
    };
  }, [graphData, isDarkMode]);

  // Highlight nodes when highlightedNodeIds or nodeFamilies changes
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const highlightedIds = new Set(highlightedNodeIds.map(id => String(id)));
    
    console.log('Highlighting nodes:', highlightedNodeIds);
    console.log('Original search nodes:', originalSearchNodes);
    console.log('Node families:', nodeFamilies);

    // Get current theme colors
    const defaultFill = isDarkMode ? '#888' : '#666';
    const defaultStroke = isDarkMode ? '#333' : '#fff';
    const defaultEdgeColor = isDarkMode ? '#444' : '#ddd';

    // If no nodes are highlighted, clear the color map and reset all nodes
    if (highlightedIds.size === 0) {
      nodeColorMapRef.current.clear();
      
      svg.selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill', defaultFill)
        .attr('r', 4)
        .attr('stroke', defaultStroke)
        .attr('stroke-width', 1);

      svg.selectAll('line')
        .transition()
        .duration(300)
        .attr('stroke', defaultEdgeColor)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.4);
      
      return;
    }

    // Get existing color map
    const nodeColorMap = nodeColorMapRef.current;
    
    // Step 1: Assign colors to original search nodes (these are the "root" nodes)
    // Each original search node gets a unique color
    originalSearchNodes.forEach((nodeId, index) => {
      const idStr = String(nodeId);
      if (!nodeColorMap.has(idStr)) {
        const colors = COLOR_PALETTE[index % COLOR_PALETTE.length];
        nodeColorMap.set(idStr, { ...colors, colorIndex: index % COLOR_PALETTE.length });
        console.log(`Assigning color ${index} to original node ${nodeId}`);
      }
    });
    
    // Step 2: For each family, assign the parent's color to all neighbors
    // This creates "color chains" where descendants inherit the parent's color
    nodeFamilies.forEach((family) => {
      const parentIdStr = String(family.parentId);
      let parentColor = nodeColorMap.get(parentIdStr);
      
      // If parent doesn't have a color yet, it might be a descendant itself
      // Try to find its color by looking at which family it belongs to
      if (!parentColor) {
        // Check if this parent is a neighbor in another family
        const parentFamily = nodeFamilies.find(f => 
          f.neighborIds.includes(family.parentId)
        );
        
        if (parentFamily) {
          // Inherit the grandparent's color
          const grandparentIdStr = String(parentFamily.parentId);
          const grandparentColor = nodeColorMap.get(grandparentIdStr);
          if (grandparentColor) {
            parentColor = grandparentColor;
            nodeColorMap.set(parentIdStr, { ...grandparentColor });
            console.log(`Node ${family.parentId} inherits color from grandparent ${parentFamily.parentId}`);
          }
        }
        
        // If still no color, assign a new one (shouldn't happen in normal flow)
        if (!parentColor) {
          const nextIndex = nodeColorMap.size % COLOR_PALETTE.length;
          parentColor = { ...COLOR_PALETTE[nextIndex], colorIndex: nextIndex };
          nodeColorMap.set(parentIdStr, parentColor);
          console.log(`Assigning new color ${nextIndex} to orphan parent ${family.parentId}`);
        }
      }
      
      // Neighbors get EXACTLY the same color as their parent
      family.neighborIds.forEach(neighborId => {
        const neighborIdStr = String(neighborId);
        if (!nodeColorMap.has(neighborIdStr)) {
          nodeColorMap.set(neighborIdStr, { ...parentColor });
          console.log(`Node ${neighborId} inherits color from parent ${family.parentId}`);
        }
      });
    });

    // Reset all nodes to default state first
    svg.selectAll('circle')
      .transition()
      .duration(300)
      .attr('fill', defaultFill)
      .attr('r', 4)
      .attr('stroke', defaultStroke)
      .attr('stroke-width', 1);

    // Reset all edges to default state
    svg.selectAll('line')
      .transition()
      .duration(300)
      .attr('stroke', defaultEdgeColor)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.4);

    // Apply colors to all mapped nodes
    nodeColorMap.forEach((colorData, nodeId) => {
      const node = svg.select(`.node-${nodeId}`);
      
      // Check if this is a parent node (make it larger)
      const isParent = nodeFamilies.some(f => String(f.parentId) === nodeId);
      // Check if this is an original search node (make it even larger)
      const isOriginal = originalSearchNodes.includes(Number(nodeId));
      
      const radius = isOriginal ? 8 : (isParent ? 6 : 5);
      const strokeWidth = isOriginal ? 3 : (isParent ? 2.5 : 2);
      
      node
        .transition()
        .duration(300)
        .attr('fill', colorData.fill)
        .attr('r', radius)
        .attr('stroke', colorData.stroke)
        .attr('stroke-width', strokeWidth);
    });

    // Color edges between highlighted nodes
    const highlightedIdsSet = new Set(nodeColorMap.keys());
    
    svg.selectAll('line').each(function(d) {
      const edge = d as D3Edge;
      const sourceId = typeof edge.source === 'object' ? (edge.source as D3Node).id : String(edge.source);
      const targetId = typeof edge.target === 'object' ? (edge.target as D3Node).id : String(edge.target);
      
      // Check if both nodes are highlighted
      if (highlightedIdsSet.has(sourceId) && highlightedIdsSet.has(targetId)) {
        const sourceColor = nodeColorMap.get(sourceId);
        const targetColor = nodeColorMap.get(targetId);
        
        // Use the color if both nodes have the same color (same family)
        if (sourceColor && targetColor && sourceColor.fill === targetColor.fill) {
          d3.select(this)
            .transition()
            .duration(300)
            .attr('stroke', sourceColor.fill)
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6);
        }
      }
    });

    console.log(`Highlighted ${nodeColorMap.size} nodes with family colors`);
  }, [highlightedNodeIds, nodeFamilies, originalSearchNodes, graphData.nodes.length, isDarkMode]);


  if (graphData.nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 dark:bg-muted/20 rounded-lg ${className}`}>
        <p className="text-xs text-muted-foreground">Cargando grafo...</p>
      </div>
    );
  }

  return (
    <div className={`bg-muted/30 dark:bg-muted/20 rounded-lg overflow-hidden relative ${className}`}>
      <svg
        ref={svgRef}
        width="500"
        height="700"
        className="w-full h-full"
      />
      
    </div>
  );
}


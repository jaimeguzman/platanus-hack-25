'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import type { D3Node, D3Edge } from '@/types/graph';

interface MiniGraphProps {
  highlightedNodeIds?: number[];
  className?: string;
}

export function MiniGraph({ highlightedNodeIds = [], className = '' }: MiniGraphProps) {
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

  // Highlight nodes when highlightedNodeIds changes
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const highlightedIds = new Set(highlightedNodeIds.map(id => String(id)));
    
    console.log('Highlighting nodes:', highlightedNodeIds, 'as strings:', Array.from(highlightedIds));

    // Color palette for highlighted nodes
    const colorPalette = [
      { fill: '#10b981', stroke: '#34d399' }, // Green
      { fill: '#3b82f6', stroke: '#60a5fa' }, // Blue
      { fill: '#f59e0b', stroke: '#fbbf24' }, // Amber
      { fill: '#ef4444', stroke: '#f87171' }, // Red
      { fill: '#8b5cf6', stroke: '#a78bfa' }, // Purple
      { fill: '#ec4899', stroke: '#f472b6' }, // Pink
      { fill: '#14b8a6', stroke: '#2dd4bf' }, // Teal
      { fill: '#f97316', stroke: '#fb923c' }, // Orange
    ];

    // Get current theme colors
    const defaultFill = isDarkMode ? '#888' : '#666';
    const defaultStroke = isDarkMode ? '#333' : '#fff';

    // Reset all nodes to default state first
    svg.selectAll('circle')
      .transition()
      .duration(300)
      .attr('fill', defaultFill)
      .attr('r', 4)
      .attr('stroke', defaultStroke)
      .attr('stroke-width', 1);

    // Then highlight the specific nodes by their IDs with different colors
    if (highlightedIds.size > 0) {
      Array.from(highlightedIds).forEach((nodeId, index) => {
        const node = svg.select(`.node-${nodeId}`);
        const colors = colorPalette[index % colorPalette.length];
        console.log(`Selecting .node-${nodeId}:`, node.size(), 'elements found');
        node
          .transition()
          .duration(300)
          .attr('fill', colors.fill)
          .attr('r', 6)
          .attr('stroke', colors.stroke)
          .attr('stroke-width', 2);
      });
    }

    console.log(`Highlighted ${highlightedIds.size} nodes`);
  }, [highlightedNodeIds, graphData.nodes.length, isDarkMode]);


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


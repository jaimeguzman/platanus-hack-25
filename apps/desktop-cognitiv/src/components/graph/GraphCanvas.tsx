import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { D3Node, D3Edge } from '@/types/graph';
import { GRAPH_COLORS, HIGHLIGHT_SETTINGS } from './graphConstants';
import { calculateInitialScale } from './graphUtils';
import type { LabelMode } from './GraphLabelToggle';

interface GraphCanvasProps {
  graphData: { nodes: D3Node[]; edges: D3Edge[] };
  isDarkMode: boolean;
  newNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
  currentTransformRef: React.MutableRefObject<d3.ZoomTransform | null>;
  labelMode: LabelMode;
  selectedNodeId: string | null;
}

export interface GraphCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  focusNode: (nodeId: string) => boolean;
}

export function useGraphCanvas({
  graphData,
  isDarkMode,
  newNodeId,
  onNodeClick,
  isInitialized,
  setIsInitialized,
  currentTransformRef,
  labelMode,
  selectedNodeId,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Initialize D3 force simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width || 800;
    const height = containerRect.height || 600;
    
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    
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
    const initialScale = calculateInitialScale(nodeCount);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        containerGroup.attr('transform', event.transform.toString());
        currentTransformRef.current = event.transform;
      });

    zoomRef.current = zoom;
    svg.call(zoom);
    
    if (shouldReinitialize) {
      const initialTransform = d3.zoomIdentity.scale(initialScale);
      svg.call(zoom.transform, initialTransform);
      currentTransformRef.current = initialTransform;
    } else if (currentTransformRef.current) {
      svg.call(zoom.transform, currentTransformRef.current);
    }

    let simulation = simulationRef.current;
    
    if (!simulation || shouldReinitialize) {
      // Normalized link distances - less variation between short and long paths
      simulation = d3.forceSimulation<D3Node>(graphData.nodes)
        .force('link', d3.forceLink<D3Node, D3Edge>(graphData.edges)
          .id(d => d.id)
          .distance(d => {
            // Increase base distance for shorter paths, minimal increase for longer ones
            const minDistance = 120;
            const maxDistance = 180;
            // Invert weight: lower weight = weaker connection = longer distance
            // This makes short paths longer without affecting long paths much
            const normalizedWeight = 1 - d.weight; // Invert: 0 becomes 1, 1 becomes 0
            return minDistance + (normalizedWeight * (maxDistance - minDistance));
          })
          .strength(1)
        )
        .force('charge', d3.forceManyBody()
          .strength(-200) // Increased repulsion to give more space between nodes
        )
        .force('center', d3.forceCenter(width * 0.6, height / 2)
          .strength(0.08) // Reduced to allow more spreading
        )
        .force('collide', d3.forceCollide()
          .radius(30) // Increased collision radius for more spacing
          .strength(0.8)
        )
        .force('x', d3.forceX(width / 2)
          .strength(0.02) // Reduced horizontal centering
        )
        .force('y', d3.forceY(height / 2)
          .strength(0.02) // Reduced vertical centering
        );

      simulationRef.current = simulation;
      setIsInitialized(true);
    } else {
      simulation.nodes(graphData.nodes);
      const linkForce = simulation.force<d3.ForceLink<D3Node, D3Edge>>('link');
      if (linkForce) {
        linkForce.links(graphData.edges);
      }
      simulation.alpha(1).restart();
    }

    // Update links
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

    // Standard D3 drag behavior
    const nodeDrag = d3.drag<SVGCircleElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Update nodes
    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(graphData.nodes, (d: D3Node) => d.id);
    
    nodeElements.exit().remove();
    
    const nodeEnter = nodeElements.enter()
      .append('circle')
      .attr('class', 'cursor-move hover:opacity-80')
      .call(nodeDrag)
      .on('click', (_event, d) => {
        onNodeClick(d.id);
      });
    
    const nodeMerge = nodeEnter.merge(nodeElements)
      .attr('r', d => {
        const isHighlighted = d.id === newNodeId || d.id === selectedNodeId;
        if (isHighlighted) return (d.size || 8) * 2;
        return d.size || 8;
      })
      .attr('fill', d => d.color || GRAPH_COLORS.memory)
      .attr('stroke', d => {
        const isHighlighted = d.id === newNodeId || d.id === selectedNodeId;
        return isHighlighted ? HIGHLIGHT_SETTINGS.highlightColor : (isDarkMode ? (d.color || GRAPH_COLORS.memory) : '#fff');
      })
      .attr('stroke-width', d => {
        const isHighlighted = d.id === newNodeId || d.id === selectedNodeId;
        return isHighlighted ? 3 : 2;
      })
      .style('filter', d => {
        const isHighlighted = d.id === newNodeId || d.id === selectedNodeId;
        if (isHighlighted) return `drop-shadow(0 0 10px ${HIGHLIGHT_SETTINGS.highlightColor})`;
        return 'none';
      });

    // No pulse animation - instant highlight only

    // Update text labels
    const textElements = nodeGroup
      .selectAll<SVGTextElement, D3Node>('text')
      .data(graphData.nodes, (d: D3Node) => d.id);
    
    textElements.exit().remove();
    
    const textEnter = textElements.enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs pointer-events-none');
    
    // Helper function to check if label should be visible
    const shouldShowLabel = (nodeId: string): boolean => {
      if (labelMode === 'none') return false;
      if (labelMode === 'all') return true;
      if (labelMode === 'selected') return nodeId === selectedNodeId;
      if (labelMode === 'adjacent' && selectedNodeId) {
        if (nodeId === selectedNodeId) return true;
        // Check if node is adjacent to selected node
        return graphData.edges.some(edge => {
          const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
          const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
          return (sourceId === selectedNodeId && targetId === nodeId) ||
                 (targetId === selectedNodeId && sourceId === nodeId);
        });
      }
      return false;
    };
    
    const textMerge = textEnter.merge(textElements)
      .attr('fill', d => {
        const isHighlighted = d.id === newNodeId || d.id === selectedNodeId;
        return isHighlighted ? HIGHLIGHT_SETTINGS.highlightColor : (isDarkMode ? '#f9fafb' : '#111827');
      })
      .attr('font-size', d => {
        const isHighlighted = d.id === newNodeId || d.id === selectedNodeId;
        return isHighlighted ? 9 : 7;
      })
      .attr('font-weight', d => (d.id === newNodeId || d.id === selectedNodeId) ? 'bold' : 'normal')
      .attr('opacity', d => shouldShowLabel(d.id) ? 1 : 0)
      .text(d => {
        // Show full label for selected/highlighted node
        const isHighlighted = d.id === newNodeId || d.id === selectedNodeId;
        if (isHighlighted) {
          return d.label;
        }
        // Truncate other labels
        return d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label;
      });

    simulation.on('tick', () => {
      linkMerge
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x : 0) || 0)
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y : 0) || 0)
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x : 0) || 0)
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y : 0) || 0);

      nodeMerge
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      textMerge
        .attr('x', d => d.x || 0)
        .attr('y', d => (d.y || 0) + 15);
    });

    return () => {
      if (shouldReinitialize) {
        simulation.stop();
        svg.on('.zoom', null);
      }
    };
  }, [graphData, isDarkMode, newNodeId, onNodeClick, isInitialized, setIsInitialized, currentTransformRef, labelMode, selectedNodeId]);

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

  const focusNode = useCallback((nodeId: string): boolean => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) {
      console.log('Focus failed: Missing refs');
      return false;
    }
    
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.log('Focus failed: Node not found');
      return false;
    }
    
    if (node.x === undefined || node.y === undefined) {
      console.log('Focus failed: Node position not calculated yet');
      return false;
    }

    // Check if position is valid (not NaN)
    if (isNaN(node.x) || isNaN(node.y)) {
      console.log('Focus failed: Node position not stable yet', { x: node.x, y: node.y });
      return false;
    }

    const svg = d3.select(svgRef.current);
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width || 800;
    const height = containerRect.height || 600;

    // Calculate transform to center the node
    const transform = d3.zoomIdentity
      .translate(width / 3, height / 2)
      .scale(1)
      .translate(-node.x, -node.y);
    console.log('Transform:', transform);

    // Apply transform directly without animation for reliability
    svg.call(zoomRef.current.transform, transform);
    
    return true;
  }, [graphData.nodes]);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Instant reset without animation
    svg.call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Instant zoom without animation
    svg.call(zoomRef.current.scaleBy, 1.3);
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Instant zoom without animation
    svg.call(zoomRef.current.scaleBy, 0.7);
  }, []);

  return {
    svgRef,
    containerRef,
    focusNode,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}


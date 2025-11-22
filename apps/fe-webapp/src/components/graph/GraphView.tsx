'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as d3 from 'd3';
import { useNoteStore } from '@/stores/noteStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { fetchGraphData } from '@/services/ragService';
import type { D3Node, D3Edge } from '@/types/graph';
import { APP_CONFIG, UI_MESSAGES } from '@/constants';
import { GraphControls } from './GraphControls';
import { GraphStats } from './GraphStats';
import { GraphNodeList } from './GraphNodeList';
import { useGraphCanvas } from './GraphCanvas';
import { getNodeColor, getNodeSize, createCategoryColorMap } from './graphUtils';
import { CATEGORY_COLORS } from './graphConstants';
import type { LabelMode } from './GraphLabelToggle';

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
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: D3Node[], edges: D3Edge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0 });
  const [categoryColorMap, setCategoryColorMap] = useState<Map<string, string>>(new Map());
  const [newNodeId, setNewNodeId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [labelMode, setLabelMode] = useState<LabelMode>('adjacent');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const currentTransformRef = useRef<d3.ZoomTransform | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Update dimensions on resize for new node positioning
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

      const colorMap = createCategoryColorMap(categories);
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

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const note = notes.find((n) => n.id === nodeId);
    if (note) {
      setCurrentNote(note);
      setViewMode('note');
    }
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
        setNewNodeId(newNodeToAdd.node.id);
      }
    }
  }, [newNodeToAdd, graphData.nodes.length, graphData.nodes, addNewNode]);

  const { svgRef, containerRef, focusNode, zoomIn, zoomOut, resetZoom } = useGraphCanvas({
    graphData,
    isDarkMode,
    newNodeId,
    onNodeClick: handleNodeClick,
    isInitialized,
    setIsInitialized,
    currentTransformRef,
    labelMode,
    selectedNodeId,
  });

  const handleFocusNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    focusNode(nodeId);
    setNewNodeId(nodeId);
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
              Arrastra los nodos para reorganizarlos. Usa la rueda del mouse para hacer zoom.
            </p>
          </div>
          
          <GraphControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetZoom}
            onRefresh={handleRefresh}
            labelMode={labelMode}
            onLabelModeChange={setLabelMode}
          />
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="relative flex-1 overflow-hidden bg-muted/30 dark:bg-muted/20 max-h-[calc(100vh-200px)]"
      >
        <svg
          ref={svgRef}
          className="h-full w-full"
          viewBox={`0 0 ${APP_CONFIG.GRAPH_VIEWBOX_WIDTH} ${APP_CONFIG.GRAPH_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        />

        <GraphStats
          nodeCount={stats.nodeCount}
          edgeCount={stats.edgeCount}
          categoryColorMap={categoryColorMap}
        />

        <GraphNodeList
          nodes={graphData.nodes}
          onNodeClick={handleFocusNode}
        />
      </div>
    </div>
  );
}

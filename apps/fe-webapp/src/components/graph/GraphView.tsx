'use client';

import React, { useRef, useEffect, useState } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import { GraphNode, GraphEdge } from '@/types/note';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GraphView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { notes, setActiveNote } = usePKMStore();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Generate graph data from notes
  useEffect(() => {
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];
    
    // Add note nodes
    notes.forEach((note, index) => {
      const angle = (index / notes.length) * 2 * Math.PI;
      const radius = 200;
      
      newNodes.push({
        id: note.id,
        label: note.title,
        type: 'note',
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        color: note.projectId ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        size: 8
      });
      
      // Add edges for backlinks
      if (note.backlinks) {
        note.backlinks.forEach(backlinkId => {
          if (notes.find(n => n.id === backlinkId)) {
            newEdges.push({
              source: note.id,
              target: backlinkId,
              type: 'backlink',
              strength: 0.7
            });
          }
        });
      }
      
      // Add edges for shared tags
      note.tags.forEach(tag => {
        const tagId = `tag-${tag}`;
        if (!newNodes.find(n => n.id === tagId)) {
          const tagAngle = Math.random() * 2 * Math.PI;
          newNodes.push({
            id: tagId,
            label: `#${tag}`,
            type: 'tag',
            x: 400 + Math.cos(tagAngle) * (radius + 100),
            y: 300 + Math.sin(tagAngle) * (radius + 100),
            color: 'hsl(var(--primary))',
            size: 6
          });
        }
        newEdges.push({
          source: note.id,
          target: tagId,
          type: 'tag',
          strength: 0.5
        });
      });
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [notes]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);
    
    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = edge.type === 'backlink' ? 'hsl(var(--primary))' : 'hsl(var(--primary))';
        ctx.lineWidth = (edge.strength || 0.5) * 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      if (node.x && node.y) {
        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size || 8, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || '#374151';
        ctx.fill();
        ctx.strokeStyle = 'hsl(var(--background))';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Node label
        ctx.fillStyle = 'hsl(var(--foreground))';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.size! + 15);
      }
    });
    
    ctx.restore();
  }, [nodes, edges, zoom, offset]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;
    
    // Find clicked node
    const clickedNode = nodes.find(node => {
      if (!node.x || !node.y || !node.size) return false;
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= node.size;
    });
    
    if (clickedNode && clickedNode.type === 'note') {
      setActiveNote(clickedNode.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 bg-[#111111] relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="icon"
          className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#EEEEEE] border border-[#2A2A2A]"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="icon"
          className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#EEEEEE] border border-[#2A2A2A]"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleResetView}
          variant="ghost"
          size="icon"
          className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#EEEEEE] border border-[#2A2A2A]"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Graph Info */}
      <div className="absolute top-4 left-4 z-10 bg-[#1A1A1A] p-3 rounded text-sm border border-[#2A2A2A]">
        <div className="text-[#EEEEEE]">
          <div>Nodes: {nodes.length}</div>
          <div>Connections: {edges.length}</div>
          <div className="mt-2 text-xs text-[#999999]">
            Click nodes to open notes
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default GraphView;

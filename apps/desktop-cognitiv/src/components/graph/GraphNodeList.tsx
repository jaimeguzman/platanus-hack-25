import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search } from 'lucide-react';
import type { D3Node } from '@/types/graph';

interface GraphNodeListProps {
  nodes: D3Node[];
  onNodeClick: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export function GraphNodeList({ nodes, onNodeClick, selectedNodeId }: GraphNodeListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = nodes.filter(node => 
    node.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute right-4 top-4 max-h-[calc(100%-2rem)] w-64 rounded-lg border bg-card shadow-sm flex flex-col">
      <div className="p-4 border-b shrink-0">
        <h3 className="mb-2 text-sm font-semibold">
          Memorias ({nodes.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto p-2 flex-1">
        <div className="space-y-1">
          {filteredNodes.map((node) => (
            <Button
              key={node.id}
              variant={selectedNodeId === node.id ? "secondary" : "ghost"}
              className={`w-full justify-start text-xs h-auto py-1.5 ${
                selectedNodeId === node.id ? 'ring-2 ring-violet-500 bg-violet-500/10' : ''
              }`}
              onClick={() => onNodeClick(node.id)}
            >
              <FileText className="mr-2 h-3 w-3 shrink-0" />
              <span className="truncate">{node.label}</span>
            </Button>
          ))}
          
          {filteredNodes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No se encontraron memorias
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


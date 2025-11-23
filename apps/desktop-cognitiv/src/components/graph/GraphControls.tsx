import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { GraphLabelToggle, type LabelMode } from './GraphLabelToggle';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onRefresh: () => void;
  labelMode: LabelMode;
  onLabelModeChange: (mode: LabelMode) => void;
}

export function GraphControls({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onRefresh,
  labelMode,
  onLabelModeChange,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onZoomOut}
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onZoomIn}
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        title="Resetear zoom y posición"
        className="gap-1.5"
      >
        <span className="text-xs">Reset</span>
      </Button>
      <GraphLabelToggle 
        mode={labelMode}
        onModeChange={onLabelModeChange}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRefresh}
        title="Recargar grafo"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}


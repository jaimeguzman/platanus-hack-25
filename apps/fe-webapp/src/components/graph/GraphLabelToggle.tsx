'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tag } from 'lucide-react';

export type LabelMode = 'all' | 'selected' | 'adjacent' | 'none';

interface GraphLabelToggleProps {
  mode: LabelMode;
  onModeChange: (mode: LabelMode) => void;
}

export function GraphLabelToggle({ mode, onModeChange }: GraphLabelToggleProps) {
  const getModeLabel = (m: LabelMode) => {
    switch (m) {
      case 'all':
        return 'Todas las etiquetas';
      case 'selected':
        return 'Solo seleccionado';
      case 'adjacent':
        return 'Nodos adyacentes';
      case 'none':
        return 'Sin etiquetas';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Opciones de etiquetas"
        >
          <Tag className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={mode} onValueChange={(v) => onModeChange(v as LabelMode)}>
          <DropdownMenuRadioItem value="all">
            Todas las etiquetas
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="selected">
            Solo seleccionado
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="adjacent">
            Nodos adyacentes
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="none">
            Sin etiquetas
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


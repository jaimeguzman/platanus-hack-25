'use client';

import { useNoteStore } from '@/stores/noteStore';
import {
  LayoutDashboard,
  Network,
  FileText,
  Search,
  Settings,
  Briefcase,
  Users,
  Heart,
  Plus,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_CONFIG, UI_MESSAGES } from '@/constants/config';
import { EMPTY_NOTE } from '@/data/mockData';

const PILLARS = [
  { id: 'career', label: 'Desarrollo de Carrera', icon: Briefcase },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'hobby', label: 'Hobby', icon: Heart },
] as const;

export function Sidebar() {
  const {
    viewMode,
    setViewMode,
    selectedPillar,
    setSelectedPillar,
    searchQuery,
    setSearchQuery,
    notes,
    setCurrentNote,
    showFavoritesOnly,
    setShowFavoritesOnly,
    getFavoriteNotes,
  } = useNoteStore();


  const recentNotes = notes
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, APP_CONFIG.RECENT_NOTES_LIMIT);

  const handleCreateNote = () => {
    const now = new Date().toISOString();
    const pillar = selectedPillar === 'all' ? APP_CONFIG.DEFAULT_PILLAR : selectedPillar;
    
    const newNote = {
      id: `note-${Date.now()}`,
      title: UI_MESSAGES.NEW_NOTE_TITLE,
      content: EMPTY_NOTE.content,
      tags: EMPTY_NOTE.tags,
      pillar,
      createdAt: now,
      updatedAt: now,
      linkedNotes: EMPTY_NOTE.linkedNotes,
      isFavorite: EMPTY_NOTE.isFavorite,
    };
    useNoteStore.getState().addNote(newNote);
    setCurrentNote(newNote);
    setViewMode('note');
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-lg font-semibold">Segundo Cerebro</h1>
        <p className="text-xs text-muted-foreground">PKM System</p>
      </div>

      <Separator />

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={UI_MESSAGES.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            <Button
              variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setViewMode('dashboard')}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={viewMode === 'graph' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setViewMode('graph')}
            >
              <Network className="mr-2 h-4 w-4" />
              Graph View
            </Button>
            <Button
              variant={viewMode === 'note' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setViewMode('note')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Notas
            </Button>
            <Button
              variant={showFavoritesOnly ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className={`mr-2 h-4 w-4 ${showFavoritesOnly ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              Favoritos ({getFavoriteNotes().length})
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Pillars */}
          <div className="px-4 pb-4">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Pilares
            </h3>
            <div className="space-y-1">
              <Button
                variant={selectedPillar === 'all' ? 'secondary' : 'ghost'}
                className="w-full justify-start text-xs"
                onClick={() => setSelectedPillar('all')}
              >
                Todos
              </Button>
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <Button
                    key={pillar.id}
                    variant={
                      selectedPillar === pillar.id ? 'secondary' : 'ghost'
                    }
                    className="w-full justify-start text-xs"
                    onClick={() => setSelectedPillar(pillar.id as 'career' | 'social' | 'hobby')}
                  >
                    <Icon className="mr-2 h-3 w-3" />
                    {pillar.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Recent Notes */}
          <div className="px-4 pb-4">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Recientes
            </h3>
            <div className="space-y-1">
              {recentNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {UI_MESSAGES.NO_RECENT_NOTES}
                </p>
              ) : (
                recentNotes.map((note) => (
                  <Button
                    key={note.id}
                    variant="ghost"
                    className="w-full justify-start text-xs h-auto py-1.5"
                    onClick={() => {
                      setCurrentNote(note);
                      setViewMode('note');
                    }}
                  >
                    <FileText className="mr-2 h-3 w-3" />
                    <span className="truncate">{note.title}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Footer Actions */}
      <div className="p-4 space-y-2">
        <Button
          className="w-full"
          onClick={handleCreateNote}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Nota
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Configuración
        </Button>
      </div>
    </div>
  );
}


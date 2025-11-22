'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import Sidebar from '@/components/sidebar/Sidebar';
import NoteEditor from '@/components/editor/NoteEditor';
import GraphView from '@/components/graph/GraphView';
import AudioTranscriber from '@/components/notes/AudioTranscriber';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SPACING } from '@/constants/spacing';
import { DEFAULT_VALUES, FALLBACK_VALUES } from '@/constants/mockData';

export default function Home() {
  const { viewMode, sidebarOpen, setViewMode } = usePKMStore();
  const [showAudioTranscriber, setShowAudioTranscriber] = useState(false);

  const handleNewNote = useCallback(() => {
    const { addNote, setActiveNote } = usePKMStore.getState();
    const newNoteId = addNote({
      title: DEFAULT_VALUES.note.title,
      content: DEFAULT_VALUES.note.content,
      tags: [...DEFAULT_VALUES.note.tags]
    });
    setActiveNote(newNoteId);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleNewNote();
      }
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-notes') as HTMLInputElement;
        searchInput?.focus();
      }
      // Ctrl/Cmd + 1: Editor view
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setViewMode('editor');
      }
      // Ctrl/Cmd + 2: Split view (Visor)
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setViewMode('split');
      }
      // Ctrl/Cmd + 3: Full graph view
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setViewMode('graph');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewMode, handleNewNote]);

  const selectedProject = usePKMStore.getState().selectedProjectId
    ? usePKMStore.getState().projects.find(p => p.id === usePKMStore.getState().selectedProjectId)
    : null;
  const projectName = selectedProject?.name ?? FALLBACK_VALUES.project.name;

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar - ClickUp style: wider with tree structure */}
      <div className={cn(
        'transition-all duration-300 flex-shrink-0',
        sidebarOpen ? SPACING.sidebar.width : SPACING.sidebar.widthCollapsed + ' overflow-hidden'
      )}>
        {sidebarOpen && <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - ClickUp style: compact and clean */}
        <header
          role="banner"
          className={cn(
            'bg-background border-b border-border',
            SPACING.header.height,
            'flex items-center justify-between',
            SPACING.header.paddingX,
            'sticky top-0 z-10'
          )}
          aria-label="Application header"
        >
          {/* Left: Breadcrumbs */}
          {selectedProject && (
            <nav 
              className={cn(
                'flex items-center',
                SPACING.header.gap,
                'flex-shrink-0 min-w-0'
              )}
              aria-label="Breadcrumb navigation"
            >
              <ol className={cn('flex items-center', SPACING.breadcrumb.gap)} aria-label="Breadcrumb">
                <li>
                  <span 
                    className={cn(
                      'text-base text-foreground truncate font-medium',
                      SPACING.breadcrumb.maxWidth
                    )}
                    aria-current="page"
                  >
                    {projectName}
                  </span>
                </li>
              </ol>
            </nav>
          )}

          {/* Center: Search */}
          <div className={cn('flex-1', SPACING.search.maxWidth, SPACING.search.marginX)} role="search" aria-label="Search notes">
            <div className="relative">
              <label htmlFor="search-notes" className="sr-only">
                Buscar notas
              </label>
              <Input
                id="search-notes"
                type="search"
                placeholder="Buscar notas..."
                aria-label="Buscar notas"
                aria-describedby="search-description"
                className={cn(
                  SPACING.input.paddingRightWithIcon
                )}
              />
              <Search
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 pointer-events-none z-10 text-muted-foreground',
                  SPACING.input.iconRight,
                  SPACING.input.iconSize
                )}
                aria-hidden="true"
              />
              <span id="search-description" className="sr-only">
                Buscar en tus notas por título, contenido o tags
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <nav
            className={cn('flex items-center flex-shrink-0', SPACING.gap.md)}
            aria-label="Main actions"
          >
            {/* Mostrar Nuevo y Audio solo cuando NO estamos en vista de grafo */}
            {viewMode === 'editor' && (
              <>
                <button
                  onClick={handleNewNote}
                  aria-label="Crear nueva nota"
                  title="Crear nueva nota (Ctrl+N)"
                  className="text-sm font-medium text-muted-foreground hover:text-violet-500 underline underline-offset-4 decoration-transparent hover:decoration-violet-500 transition-all duration-200"
                >
                  Nueva nota
                </button>
                <span className="text-muted-foreground/50">|</span>
                <button
                  onClick={() => setShowAudioTranscriber(true)}
                  aria-label="Abrir transcriptor de audio"
                  title="Transcribir audio a texto"
                  className="text-sm font-medium text-muted-foreground hover:text-violet-500 underline underline-offset-4 decoration-transparent hover:decoration-violet-500 transition-all duration-200"
                >
                  Nuevo audio
                </button>
                <div className="h-4 w-px bg-border mx-2" role="separator" aria-hidden="true" />
              </>
            )}


            {/* Toggle Editor / Visor */}
            <div className="flex items-center bg-muted rounded-xl p-1 border border-border">
              <button
                onClick={() => setViewMode('editor')}
                className={cn(
                  'w-20 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  viewMode === 'editor'
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'split' || viewMode === 'graph' ? 'editor' : 'split')}
                className={cn(
                  'w-20 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  viewMode === 'split' || viewMode === 'graph'
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Dividido
              </button>
            </div>
            <div
              className={cn(
                'bg-border',
                SPACING.separator.height,
                SPACING.separator.width,
                SPACING.separator.marginX
              )}
              role="separator"
              aria-orientation="vertical"
              aria-hidden="true"
            />
            <ThemeToggle />
          </nav>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex min-h-0 overflow-hidden">
          {viewMode === 'editor' && <NoteEditor />}
          {viewMode === 'graph' && <GraphView />}
          {viewMode === 'split' && (
            <div className="flex w-full h-full">
              <div className="w-1/2 border-r border-border flex flex-col overflow-hidden">
                <NoteEditor />
              </div>
              <div className="w-1/2 flex flex-col overflow-hidden">
                <GraphView />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Audio Transcriber Modal */}
      <Dialog open={showAudioTranscriber} onOpenChange={setShowAudioTranscriber}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-light">Transcripción de Audio</DialogTitle>
          </DialogHeader>
          <AudioTranscriber onTranscriptionComplete={() => setShowAudioTranscriber(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

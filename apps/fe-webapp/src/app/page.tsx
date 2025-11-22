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
      // Ctrl/Cmd + 2: Graph view
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setViewMode('graph');
      }
      // Ctrl/Cmd + 3: Split view
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setViewMode('split');
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
                Search notes
              </label>
              <Input
                id="search-notes"
                type="search"
                placeholder="Search notes..."
                aria-label="Search notes"
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
                Search through your notes by title, content, or tags
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <nav 
            className={cn('flex items-center flex-shrink-0', SPACING.gap.md)}
            aria-label="Main actions"
          >
            <Button
              onClick={handleNewNote}
              variant="ghost"
              size="sm"
              aria-label="Create new note"
              title="Create new note (Ctrl+N)"
              className={cn(
                'text-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap transition-all',
                SPACING.button.sm.height,
                SPACING.button.sm.paddingX,
                SPACING.button.sm.fontSize
              )}
            >
              New
            </Button>
            <Button
              onClick={() => setShowAudioTranscriber(true)}
              variant="ghost"
              size="sm"
              aria-label="Open audio transcriber"
              title="Transcribe audio to text"
              className={cn(
                'text-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap transition-all',
                SPACING.button.sm.height,
                SPACING.button.sm.paddingX,
                SPACING.button.sm.fontSize
              )}
            >
              Audio
            </Button>
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
            <div 
              className={cn(
                'flex items-center bg-card rounded-md border border-border',
                SPACING.viewMode.container.padding,
                SPACING.viewMode.container.gap
              )}
              role="group"
              aria-label="View mode selector"
            >
              <Button
                onClick={() => setViewMode('editor')}
                variant={viewMode === 'editor' ? 'default' : 'ghost'}
                size="sm"
                aria-label="Editor view"
                aria-pressed={viewMode === 'editor'}
                title="Editor view - Edit notes in markdown"
                className={cn(
                  'text-foreground whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  SPACING.viewMode.button.height,
                  SPACING.viewMode.button.paddingX,
                  SPACING.button.sm.fontSize,
                  viewMode === 'editor' 
                    ? 'bg-secondary text-foreground shadow-sm' 
                    : 'hover:bg-secondary bg-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Editor
              </Button>
              <Button
                onClick={() => setViewMode('graph')}
                variant={viewMode === 'graph' ? 'default' : 'ghost'}
                size="sm"
                aria-label="Graph view"
                aria-pressed={viewMode === 'graph'}
                title="Graph view - Visualize note connections"
                className={cn(
                  'text-foreground whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  SPACING.viewMode.button.height,
                  SPACING.viewMode.button.paddingX,
                  SPACING.button.sm.fontSize,
                  viewMode === 'graph' 
                    ? 'bg-secondary text-foreground shadow-sm' 
                    : 'hover:bg-secondary bg-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Graph
              </Button>
              <Button
                onClick={() => setViewMode('split')}
                variant={viewMode === 'split' ? 'default' : 'ghost'}
                size="sm"
                aria-label="Split view"
                aria-pressed={viewMode === 'split'}
                title="Split view - Editor and graph side by side"
                className={cn(
                  'text-foreground whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  SPACING.viewMode.button.height,
                  SPACING.viewMode.button.paddingX,
                  SPACING.button.sm.fontSize,
                  viewMode === 'split' 
                    ? 'bg-secondary text-foreground shadow-sm' 
                    : 'hover:bg-secondary bg-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Split
              </Button>
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
        <main className="flex-1 flex">
          {viewMode === 'editor' && <NoteEditor />}
          {viewMode === 'graph' && <GraphView />}
          {viewMode === 'split' && (
            <div className="flex w-full">
              <div className="w-1/2 border-r border-border">
                <NoteEditor />
              </div>
              <div className="w-1/2">
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
            <DialogTitle className="font-light">Audio Transcription</DialogTitle>
          </DialogHeader>
          <AudioTranscriber />
        </DialogContent>
      </Dialog>
    </div>
  );
}

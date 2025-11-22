'use client';

import React, { useState } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import {
  FileText,
  Plus,
  Search,
  Clock,
  Hash,
  Star,
  Settings,
  Folder,
  Home,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { SPACING } from '@/constants/spacing';
import { DEFAULT_VALUES, NUMERIC_CONSTANTS } from '@/constants/mockData';

const Sidebar: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    setSelectedProject,
    getFilteredNotes,
    setActiveNote,
    addNote
  } = usePKMStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [sidebarSearch, setSidebarSearch] = useState('');
  const filteredNotes = getFilteredNotes();

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleNewNote = () => {
    const newNoteId = addNote({
      title: DEFAULT_VALUES.note.title,
      content: DEFAULT_VALUES.note.content,
      tags: [...DEFAULT_VALUES.note.tags],
      projectId: selectedProjectId ?? undefined
    });
    setActiveNote(newNoteId);
  };

  const projectNotes = (projectId: string) => {
    return filteredNotes.filter(n => n.projectId === projectId);
  };

  return (
    <div className="h-full w-64 bg-sidebar border-r border-border flex flex-col flex-shrink-0">
      {/* Workspace/Header - Logo Section - Same height as main header */}
      <div className={cn(
        'flex items-center border-b border-border',
        SPACING.sidebar.paddingX,
        SPACING.sidebar.logoHeight
      )}>
        <Button
          variant="ghost"
          className="w-full justify-start h-full px-0 py-0 text-base font-bold hover:bg-transparent text-foreground transition-colors group"
          aria-label="SecondBrain workspace"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4A5560] via-[#3A444B] to-[#2A2A2A] flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
            <span className="text-base font-bold text-foreground tracking-tight">SB</span>
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-base font-bold text-foreground leading-tight tracking-tight">SecondBrain</span>
            <span className="text-xs text-muted-foreground font-medium mt-1">Workspace</span>
          </div>
        </Button>
      </div>

      {/* Main Navigation - ClickUp style */}
      <div className={cn(SPACING.sidebar.contentPaddingX, 'py-5 border-b border-border space-y-1')}>
        <Button variant="ghost" className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-accent text-foreground transition-colors" size="sm">
          <Home className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="flex-1 text-left">Home</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-accent text-foreground transition-colors" size="sm">
          <Clock className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="flex-1 text-left">Recent</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-accent text-foreground transition-colors" size="sm">
          <Star className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="flex-1 text-left">Starred</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-accent text-foreground transition-colors" size="sm">
          <Hash className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="flex-1 text-left">Tags</span>
        </Button>
      </div>

      {/* Projects Section - Tree structure like ClickUp */}
      <div className={cn('flex-1 overflow-y-auto py-4 min-h-0', SPACING.sidebar.contentPaddingX)}>
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Projects</span>
          <Button
            onClick={handleNewNote}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search in sidebar */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search sidebar..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className={cn(
              'bg-muted/50 border-muted hover:bg-muted',
              SPACING.input.paddingRightWithIcon
            )}
            aria-label="Search sidebar"
          />
          <Search 
            className={cn(
              'absolute top-1/2 -translate-y-1/2 pointer-events-none z-10 text-muted-foreground',
              SPACING.input.iconRight,
              SPACING.input.iconSize
            )}
            aria-hidden="true"
          />
        </div>

        {/* Projects Tree */}
        <div className="space-y-0.5">
          {projects.map((project) => {
            const notes = projectNotes(project.id);
            const isExpanded = expandedProjects.has(project.id);
            const isSelected = selectedProjectId === project.id;

            return (
              <div key={project.id}>
                {/* Project Header */}
                <Button
                  onClick={() => {
                    toggleProject(project.id);
                    setSelectedProject(isSelected ? null : project.id);
                  }}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start h-10 px-3 text-sm font-medium hover:bg-accent text-foreground transition-colors',
                    isSelected && 'bg-accent'
                  )}
                  size="sm"
                >
                  {notes.length > 0 ? (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0 text-muted-foreground" />
                    )
                  ) : (
                    <div className="w-4 mr-2" />
                  )}
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-2.5 shadow-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <Folder className="w-4 h-4 mr-2 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate text-foreground">{project.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded">{notes.length}</span>
                </Button>

                {/* Project Notes - Tree children */}
                {isExpanded && notes.length > 0 && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {notes.slice(0, NUMERIC_CONSTANTS.projectNotesLimit).map((note) => (
                      <Button
                        key={note.id}
                        onClick={() => setActiveNote(note.id)}
                        variant="ghost"
                        className="w-full justify-start h-9 px-3 text-sm font-normal hover:bg-accent text-foreground transition-colors"
                        size="sm"
                      >
                        <FileText className="w-3.5 h-3.5 mr-2.5 flex-shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-left truncate">{note.title}</span>
                        {note.isPinned && (
                          <Star className="w-3.5 h-3.5 text-foreground fill-foreground flex-shrink-0 ml-2" />
                        )}
                      </Button>
                    ))}
                    {notes.length > NUMERIC_CONSTANTS.projectNotesLimit && (
                      <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
                        +{notes.length - NUMERIC_CONSTANTS.projectNotesLimit} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions - ClickUp style */}
      <div className={cn(SPACING.sidebar.contentPaddingX, 'py-3 border-t border-border')}>
        <Button variant="ghost" className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-accent text-foreground transition-colors" size="sm">
          <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
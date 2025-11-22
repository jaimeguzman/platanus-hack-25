'use client';

import React, { useState } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import {
  FileText,
  Plus,
  Clock,
  Star,
  Settings,
  Home,
  ChevronRight,
  ChevronDown,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { SPACING } from '@/constants/spacing';
import { DEFAULT_VALUES, NUMERIC_CONSTANTS } from '@/constants/mockData';

const PROJECT_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'
];

const Sidebar: React.FC = () => {
  const {
    projects,
    notes,
    selectedProjectId,
    setSelectedProject,
    setActiveNote,
    addNote,
    addProject,
    getRecentNotes,
    getPinnedNotes
  } = usePKMStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['default']));
  const [activeNav, setActiveNav] = useState('home');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);

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
      tags: DEFAULT_VALUES.note.tags,
      projectId: selectedProjectId ?? undefined
    });
    setActiveNote(newNoteId);
  };

  const projectNotes = (projectId: string) => {
    return notes.filter(n => n.projectId === projectId);
  };

  const pinnedNotes = notes.filter(n => n.isPinned);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProjectId = addProject({
        name: newProjectName.trim(),
        color: newProjectColor,
        noteCount: 0
      });
      // Seleccionar y expandir el nuevo proyecto
      setSelectedProject(newProjectId);
      setExpandedProjects(prev => new Set([...prev, newProjectId]));
      setActiveNav('project');
      setNewProjectName('');
      setNewProjectColor(PROJECT_COLORS[0]);
      setIsAddingProject(false);
    }
  };

  const handleAddNoteToProject = (projectId: string) => {
    const newNoteId = addNote({
      title: DEFAULT_VALUES.note.title,
      content: DEFAULT_VALUES.note.content,
      tags: DEFAULT_VALUES.note.tags,
      projectId: projectId
    });
    setActiveNote(newNoteId);
    // Expandir el proyecto si no está expandido
    if (!expandedProjects.has(projectId)) {
      setExpandedProjects(prev => new Set([...prev, projectId]));
    }
  };

  const handleCancelAddProject = () => {
    setNewProjectName('');
    setNewProjectColor(PROJECT_COLORS[0]);
    setIsAddingProject(false);
  };

  return (
    <div className="h-full w-64 bg-sidebar border-r border-border flex flex-col flex-shrink-0">
      {/* Workspace/Header - Logo Section */}
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-base font-bold text-foreground leading-tight tracking-tight">SecondBrain</span>
            <span className="text-[11px] text-muted-foreground font-medium">Tu segundo cerebro</span>
          </div>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className={cn(SPACING.sidebar.contentPaddingX, 'py-3 border-b border-border')}>
        <Button
          onClick={handleNewNote}
          className="w-full justify-start h-9 px-3 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="flex-1 text-left">Nueva nota</span>
          <span className="text-xs opacity-70">Ctrl+N</span>
        </Button>
      </div>

      {/* Main Navigation */}
      <div className={cn(SPACING.sidebar.contentPaddingX, 'py-3 border-b border-border space-y-0.5')}>
        <Button
          variant="ghost"
          onClick={() => { setActiveNav('home'); setSelectedProject(null); }}
          className={cn(
            "w-full justify-start h-9 px-3 text-sm font-medium transition-colors",
            activeNav === 'home' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          size="sm"
        >
          <Home className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="flex-1 text-left">Inicio</span>
          <span className="text-xs text-muted-foreground">{notes.length}</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveNav('recent')}
          className={cn(
            "w-full justify-start h-9 px-3 text-sm font-medium transition-colors",
            activeNav === 'recent' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          size="sm"
        >
          <Clock className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="flex-1 text-left">Recientes</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveNav('starred')}
          className={cn(
            "w-full justify-start h-9 px-3 text-sm font-medium transition-colors",
            activeNav === 'starred' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          size="sm"
        >
          <Star className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="flex-1 text-left">Favoritos</span>
          {pinnedNotes.length > 0 && (
            <span className="text-xs text-muted-foreground">{pinnedNotes.length}</span>
          )}
        </Button>
      </div>

      {/* Content Section - Changes based on activeNav */}
      <div className={cn('flex-1 overflow-y-auto py-3 min-h-0', SPACING.sidebar.contentPaddingX)}>
        {/* Recientes Section */}
        {activeNav === 'recent' && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recientes</span>
            </div>
            <div className="space-y-0.5">
              {getRecentNotes().length > 0 ? (
                getRecentNotes().map((note) => (
                  <Button
                    key={note.id}
                    onClick={() => setActiveNote(note.id)}
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-[13px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md"
                    size="sm"
                  >
                    <FileText className="w-3.5 h-3.5 mr-2 flex-shrink-0 opacity-60" />
                    <span className="flex-1 text-left truncate">{note.title}</span>
                    {note.isPinned && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0 ml-1" />
                    )}
                  </Button>
                ))
              ) : (
                <div className="py-4 px-2 text-center">
                  <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay notas recientes</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Favoritos Section */}
        {activeNav === 'starred' && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favoritos</span>
            </div>
            <div className="space-y-0.5">
              {getPinnedNotes().length > 0 ? (
                getPinnedNotes().map((note) => (
                  <Button
                    key={note.id}
                    onClick={() => setActiveNote(note.id)}
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-[13px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md"
                    size="sm"
                  >
                    <Star className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-amber-500 fill-amber-500" />
                    <span className="flex-1 text-left truncate">{note.title}</span>
                  </Button>
                ))
              ) : (
                <div className="py-4 px-2 text-center">
                  <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay favoritos</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Marca notas como favoritas desde el editor</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Projects Section - Shows on home or project */}
        {(activeNav === 'home' || activeNav === 'project') && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proyectos</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Agregar proyecto"
                onClick={() => setIsAddingProject(true)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

        {/* Add Project Form */}
        {isAddingProject && (
          <div className="mb-3 p-4 bg-card rounded-xl border border-border shadow-lg">
            <p className="text-xs font-medium text-muted-foreground mb-3">Nuevo proyecto</p>
            <Input
              type="text"
              placeholder="Nombre del proyecto"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="h-9 text-sm mb-3 bg-background"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddProject();
                if (e.key === 'Escape') handleCancelAddProject();
              }}
            />
            <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
            <div className="grid grid-cols-8 gap-2 mb-4">
              {PROJECT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewProjectColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-md transition-all hover:scale-110",
                    newProjectColor === color
                      ? "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                      : "opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-violet-500 hover:bg-violet-600 text-white font-medium"
                onClick={handleAddProject}
                disabled={!newProjectName.trim()}
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Crear proyecto
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={handleCancelAddProject}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Projects Tree */}
        <div className="space-y-0.5">
          {projects.map((project) => {
            const pNotes = projectNotes(project.id);
            const isExpanded = expandedProjects.has(project.id);
            const isSelected = selectedProjectId === project.id;

            return (
              <div key={project.id} className="group">
                {/* Project Header */}
                <div className="flex items-center">
                  <Button
                    onClick={() => {
                      toggleProject(project.id);
                      setSelectedProject(isSelected ? null : project.id);
                      setActiveNav('project');
                    }}
                    variant="ghost"
                    className={cn(
                      'flex-1 justify-start h-8 px-2 text-sm font-medium transition-colors rounded-md',
                      isSelected
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                    size="sm"
                  >
                    {pNotes.length > 0 || isExpanded ? (
                      isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 opacity-60" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 opacity-60" />
                      )
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 opacity-60" />
                    )}
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0 mr-2"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 text-left truncate">{project.name}</span>
                    <span className="text-[10px] font-medium text-muted-foreground ml-1 opacity-70">{pNotes.length}</span>
                  </Button>
                  {/* Add note to project button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddNoteToProject(project.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex-shrink-0"
                    title={`Agregar nota a ${project.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Project Notes */}
                {isExpanded && (
                  <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
                    {pNotes.length > 0 ? (
                      <>
                        {pNotes.slice(0, NUMERIC_CONSTANTS.projectNotesLimit).map((note) => (
                          <Button
                            key={note.id}
                            onClick={() => setActiveNote(note.id)}
                            variant="ghost"
                            className="w-full justify-start h-7 px-2 text-[13px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md"
                            size="sm"
                          >
                            <FileText className="w-3 h-3 mr-2 flex-shrink-0 opacity-60" />
                            <span className="flex-1 text-left truncate">{note.title}</span>
                            {note.isPinned && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0 ml-1" />
                            )}
                          </Button>
                        ))}
                        {pNotes.length > NUMERIC_CONSTANTS.projectNotesLimit && (
                          <div className="px-2 py-1 text-[11px] text-muted-foreground">
                            +{pNotes.length - NUMERIC_CONSTANTS.projectNotesLimit} más
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-2 px-2">
                        <p className="text-[11px] text-muted-foreground mb-2">Sin notas aún</p>
                        <Button
                          onClick={() => handleAddNoteToProject(project.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Crear primera nota
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tags Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</span>
          </div>
          <div className="flex flex-wrap gap-1.5 px-1">
            {Array.from(new Set(notes.flatMap(n => n.tags))).slice(0, 8).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-violet-500/10 text-violet-400 rounded-md cursor-pointer hover:bg-violet-500/20 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className={cn(SPACING.sidebar.contentPaddingX, 'py-3 border-t border-border')}>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
          Configuración
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
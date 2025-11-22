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
  Brain,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { APP_CONFIG, UI_MESSAGES } from '@/constants/config';
import { EMPTY_NOTE } from '@/data/mockData';

const PILLARS = [
  { id: 'career', label: 'Desarrollo de Carrera', icon: Briefcase },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'hobby', label: 'Hobby', icon: Heart },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
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
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Brain className="h-5 w-5 shrink-0" />
          {state === 'expanded' && (
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-semibold truncate">Segundo Cerebro</h1>
              <p className="text-xs text-muted-foreground truncate">PKM System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <SidebarInput
                    placeholder={UI_MESSAGES.SEARCH_PLACEHOLDER}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setViewMode('dashboard')}
                  isActive={viewMode === 'dashboard'}
                  tooltip="Dashboard"
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setViewMode('graph')}
                  isActive={viewMode === 'graph'}
                  tooltip="Graph View"
                >
                  <Network />
                  <span>Graph View</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setViewMode('note')}
                  isActive={viewMode === 'note'}
                  tooltip="Notas"
                >
                  <FileText />
                  <span>Notas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  isActive={showFavoritesOnly}
                  tooltip={`Favoritos (${getFavoriteNotes().length})`}
                >
                  <Star className={showFavoritesOnly ? 'fill-yellow-500 text-yellow-500' : ''} />
                  <span>Favoritos</span>
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-primary text-xs text-sidebar-primary-foreground">
                    {getFavoriteNotes().length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pillars */}
        <SidebarGroup>
          <SidebarGroupLabel>Pilares</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSelectedPillar('all')}
                  isActive={selectedPillar === 'all'}
                  tooltip="Todos"
                >
                  <span>Todos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <SidebarMenuItem key={pillar.id}>
                    <SidebarMenuButton
                      onClick={() => setSelectedPillar(pillar.id as 'career' | 'social' | 'hobby')}
                      isActive={selectedPillar === pillar.id}
                      tooltip={pillar.label}
                    >
                      <Icon />
                      <span>{pillar.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Notes */}
        <SidebarGroup>
          <SidebarGroupLabel>Recientes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentNotes.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {UI_MESSAGES.NO_RECENT_NOTES}
                  </div>
                </SidebarMenuItem>
              ) : (
                recentNotes.map((note) => (
                  <SidebarMenuItem key={note.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        setCurrentNote(note);
                        setViewMode('note');
                      }}
                      tooltip={note.title}
                    >
                      <FileText />
                      <span className="truncate">{note.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Actions */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleCreateNote} size="lg" tooltip="Nueva Nota">
              <Plus />
              <span>Nueva Nota</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Configuración">
              <Settings />
              <span>Configuración</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

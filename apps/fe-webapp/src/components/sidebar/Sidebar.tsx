'use client';

import { useEffect, useState } from 'react';
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
  Star,
  Brain,
  MessageSquare,
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
import { ThemeToggle } from '@/components/theme-toggle';
import { getSupabaseClient } from '@/lib/supabase';

const ICON_MAP: Record<string, typeof Briefcase> = {
  'Desarrollo de Carrera': Briefcase,
  'Social': Users,
  'Hobby': Heart,
};

interface Pillar {
  id: 'career' | 'social' | 'hobby';
  label: string;
  icon: typeof Briefcase;
}

const PILLAR_NAME_TO_ID: Record<string, 'career' | 'social' | 'hobby'> = {
  'Desarrollo de Carrera': 'career',
  'Social': 'social',
  'Hobby': 'hobby',
};

export function AppSidebar() {
  const { state } = useSidebar();
  const {
    viewMode,
    setViewMode,
    selectedPillar,
    setSelectedPillar,
    searchQuery,
    setSearchQuery,
    setCurrentNote,
    showFavoritesOnly,
    setShowFavoritesOnly,
    getFavoriteNotes,
    getFilteredNotes,
  } = useNoteStore();
  
  const [pillars, setPillars] = useState<Pillar[]>([
    { id: 'career', label: 'Desarrollo de Carrera', icon: Briefcase },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'hobby', label: 'Hobby', icon: Heart },
  ]);

  useEffect(() => {
    const loadPillars = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('projects')
        .select('name')
        .in('name', ['Desarrollo de Carrera', 'Social', 'Hobby'])
        .order('name');
      
      if (data) {
        const loadedPillars: Pillar[] = (data as Array<{ name: string }>)
          .map((p) => {
            const id = PILLAR_NAME_TO_ID[p.name];
            const icon = ICON_MAP[p.name] || Briefcase;
            return id ? { id, label: p.name, icon } : null;
          })
          .filter((p): p is Pillar => p !== null);
        
        if (loadedPillars.length > 0) {
          setPillars(loadedPillars);
        }
      }
    };
    
    loadPillars();
  }, []);

  const filteredNotes = getFilteredNotes();
  
  const recentNotes = filteredNotes
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, APP_CONFIG.RECENT_NOTES_LIMIT);

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
                  onClick={() => setViewMode('chat')}
                  isActive={viewMode === 'chat'}
                  tooltip="Chat"
                >
                  <MessageSquare />
                  <span>Chat</span>
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
                  isActive={false}
                  tooltip={`Favoritos (${getFavoriteNotes().length})`}
                  className="data-[active=true]:bg-transparent data-[active=true]:font-normal data-[active=true]:text-sidebar-foreground"
                >
                  <Star />
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
          <SidebarGroupLabel>Areas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                const isActive = selectedPillar === pillar.id;
                return (
                  <SidebarMenuItem key={pillar.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        // Toggle: si ya está seleccionado, deseleccionar (mostrar todas)
                        if (isActive) {
                          setSelectedPillar('all');
                        } else {
                          setSelectedPillar(pillar.id);
                        }
                      }}
                      isActive={isActive}
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
          <ThemeToggle />
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

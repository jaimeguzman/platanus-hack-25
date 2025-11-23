import { useState, useEffect } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { getAllCategories } from '@/services/ragService';
import {
  LayoutDashboard,
  Network,
  FileText,
  Search,
  Briefcase,
  Users,
  Heart,
  Brain,
  MessageSquare,
  Activity,
  Dumbbell,
  GraduationCap,
  DollarSign,
  Home,
  Utensils,
  Smile,
  Target,
  Plane,
  Gamepad2,
  TrendingUp,
  Laptop,
  Palette,
  Sparkles,
  Calendar,
  Moon,
  PawPrint,
  ShoppingCart,
  Film,
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

// Category icon mapping based on RAG categories
const CATEGORY_ICON_MAP: Record<string, typeof Activity> = {
  'Salud': Activity,
  'Ejercicio y Deporte': Dumbbell,
  'Trabajo / Laboral': Briefcase,
  'Estudios / Aprendizaje': GraduationCap,
  'Finanzas': DollarSign,
  'Relaciones Amorosas': Heart,
  'Familia': Users,
  'Amistades': Users,
  'Vida Social': Users,
  'Hogar y Organización': Home,
  'Alimentación': Utensils,
  'Estado de Ánimo / Emociones': Smile,
  'Proyectos Personales': Target,
  'Viajes': Plane,
  'Hobbies': Gamepad2,
  'Crecimiento Personal': TrendingUp,
  'Tecnología / Gadgets': Laptop,
  'Creatividad / Arte': Palette,
  'Espiritualidad': Sparkles,
  'Eventos Importantes': Calendar,
  'Metas y Hábitos': Target,
  'Sueño': Moon,
  'Mascotas': PawPrint,
  'Compras': ShoppingCart,
  'Tiempo Libre / Entretenimiento': Film,
};

// Hardcoded categories from RAG
const CATEGORIES = [
  'Salud',
  'Ejercicio y Deporte',
  'Trabajo / Laboral',
  'Estudios / Aprendizaje',
  'Finanzas',
  'Relaciones Amorosas',
  'Familia',
  'Amistades',
  'Vida Social',
  'Hogar y Organización',
  'Alimentación',
  'Estado de Ánimo / Emociones',
  'Proyectos Personales',
  'Viajes',
  'Hobbies',
  'Crecimiento Personal',
  'Tecnología / Gadgets',
  'Creatividad / Arte',
  'Espiritualidad',
  'Eventos Importantes',
  'Metas y Hábitos',
  'Sueño',
  'Mascotas',
  'Compras',
  'Tiempo Libre / Entretenimiento',
];

interface Category {
  id: string;
  label: string;
  icon: typeof Activity;
  count?: number;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const {
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setCurrentNote,
    getFilteredNotes,
  } = useNoteStore();
  
  const [categories, setCategories] = useState<Category[]>(
    CATEGORIES.map((cat) => ({
      id: cat,
      label: cat,
      icon: CATEGORY_ICON_MAP[cat] || FileText,
      count: 0,
    }))
  );

  // Load category counts from RAG API
  useEffect(() => {
    const loadCategoryCounts = async () => {
      try {
        const { category_counts } = await getAllCategories();
        
        // Update categories with counts
        setCategories(prev => 
          prev.map(cat => {
            const countData = category_counts.find(c => c.category === cat.id);
            return {
              ...cat,
              count: countData?.count || 0,
            };
          })
        );
      } catch (error) {
        console.error('Error loading category counts:', error);
      }
    };

    loadCategoryCounts();
  }, []);

  const filteredNotes = getFilteredNotes();
  
  const recentNotes = filteredNotes
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, APP_CONFIG.RECENT_NOTES_LIMIT);

  // Get notes for selected category
  const categoryNotes = selectedCategory && selectedCategory !== 'all'
    ? filteredNotes
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : [];

  // Show category notes when a category is selected, otherwise show recent notes
  const displayNotes = selectedCategory && selectedCategory !== 'all' ? categoryNotes : recentNotes;
  const notesLabel = selectedCategory && selectedCategory !== 'all' 
    ? `${selectedCategory} (${categoryNotes.length})`
    : 'Recientes';

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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Categories */}
        <SidebarGroup>
          <SidebarGroupLabel>Áreas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                const hasNotes = (category.count || 0) > 0;
                
                // Only show categories with notes
                if (!hasNotes && !isActive) return null;
                
                return (
                  <SidebarMenuItem key={category.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        // Toggle: if already selected, deselect (show all)
                        if (isActive) {
                          setSelectedCategory('all');
                        } else {
                          setSelectedCategory(category.id);
                          // Don't change view mode, just update the notes list
                        }
                      }}
                      isActive={isActive}
                      tooltip={category.label}
                    >
                      <Icon />
                      <span>{category.label}</span>
                      {hasNotes && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-accent text-xs">
                          {category.count}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Notes List (Category or Recent) */}
        <SidebarGroup>
          <SidebarGroupLabel>{notesLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayNotes.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {selectedCategory && selectedCategory !== 'all' 
                      ? 'No hay notas en esta categoría'
                      : UI_MESSAGES.NO_RECENT_NOTES
                    }
                  </div>
                </SidebarMenuItem>
              ) : (
                displayNotes.map((note) => (
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

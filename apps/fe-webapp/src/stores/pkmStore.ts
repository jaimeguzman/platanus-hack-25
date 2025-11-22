import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Note, Project } from '../types/note';
import { MOCK_PROJECTS, FALLBACK_VALUES, NUMERIC_CONSTANTS } from '../constants/mockData';

interface PKMState {
  // Notes
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  selectedProjectId: string | null;
  
  // Projects
  projects: Project[];
  
  // UI State
  sidebarOpen: boolean;
  viewMode: 'editor' | 'graph' | 'split';
  
  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setSelectedProject: (id: string | null) => void;
  
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: 'editor' | 'graph' | 'split') => void;
  
  // Getters
  getFilteredNotes: () => Note[];
  getProjectNotes: (projectId: string) => Note[];
  getNoteById: (id: string) => Note | undefined;
  getRecentNotes: () => Note[];
}

export const usePKMStore = create<PKMState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notes: [],
      activeNoteId: null,
      searchQuery: '',
      selectedProjectId: null,
      projects: MOCK_PROJECTS,
      sidebarOpen: true,
      viewMode: 'editor',

      // Actions
      addNote: (noteData) => {
        const state = get();
        const newNote: Note = {
          ...noteData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: noteData.projectId ?? state.selectedProjectId ?? FALLBACK_VALUES.project.id,
          tags: noteData.tags ?? [],
          backlinks: noteData.backlinks ?? []
        };
        
        set((state) => ({
          notes: [...state.notes, newNote],
          activeNoteId: newNote.id
        }));
        
        return newNote.id;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map(note => 
            note.id === id 
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          )
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter(note => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
        }));
      },

      setActiveNote: (id) => {
        set({ activeNoteId: id });
      },

      addProject: (projectData) => {
        const newProject: Project = {
          ...projectData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          noteCount: 0
        };
        
        set((state) => ({
          projects: [...state.projects, newProject]
        }));
        
        return newProject.id;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map(project => 
            project.id === id 
              ? { ...project, ...updates }
              : project
          )
        }));
      },

      deleteProject: (id) => {
        if (id === FALLBACK_VALUES.project.id) return; // Can't delete default project
        
        set((state) => ({
          projects: state.projects.filter(project => project.id !== id),
          notes: state.notes.map(note => 
            note.projectId === id 
              ? { ...note, projectId: FALLBACK_VALUES.project.id }
              : note
          ),
          selectedProjectId: state.selectedProjectId === id ? FALLBACK_VALUES.project.id : state.selectedProjectId
        }));
      },

      setSelectedProject: (id) => {
        set({ selectedProjectId: id });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      // Getters
      getFilteredNotes: () => {
        const { notes, searchQuery, selectedProjectId } = get();
        let filtered = notes;
        
        if (selectedProjectId) {
          filtered = filtered.filter(note => note.projectId === selectedProjectId);
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query) ||
            note.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }
        
        return filtered.sort((a, b) => {
          const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
          const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
          return bTime - aTime;
        });
      },

      getProjectNotes: (projectId) => {
        return get().notes
          .filter(note => note.projectId === projectId)
          .sort((a, b) => {
            const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
            const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
            return bTime - aTime;
          });
      },

      getNoteById: (id) => {
        return get().notes.find(note => note.id === id);
      },

      getRecentNotes: () => {
        return get().notes
          .sort((a, b) => {
            const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
            const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
            return bTime - aTime;
          })
          .slice(0, NUMERIC_CONSTANTS.recentNotesLimit);
      }
    })
  )
);
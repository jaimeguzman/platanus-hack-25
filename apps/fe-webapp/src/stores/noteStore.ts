import { create } from 'zustand';
import type { Note } from '@/types/note';
import { updateNote as updateNoteService, createNote as createNoteService } from '@/services/noteService';

interface NoteStore {
  // Notes state
  notes: Note[];
  currentNote: Note | null;
  
  // UI state
  searchQuery: string;
  selectedPillar: 'career' | 'social' | 'hobby' | 'all';
  viewMode: 'dashboard' | 'graph' | 'note';
  showFavoritesOnly: boolean;
  
  // Editor state
  editorTitle: string;
  editorContent: string;
  editorTags: string[];
  editorTagInput: string;
  editorViewMode: 'edit' | 'preview';
  editorHasChanges: boolean;
  
  // Actions - Notes
  setNotes: (notes: Note[]) => void;
  setCurrentNote: (note: Note | null) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // Actions - UI
  setSearchQuery: (query: string) => void;
  setSelectedPillar: (pillar: 'career' | 'social' | 'hobby' | 'all') => void;
  setViewMode: (mode: 'dashboard' | 'graph' | 'note') => void;
  setShowFavoritesOnly: (show: boolean) => void;
  toggleNoteFavorite: (id: string) => void;
  
  // Actions - Editor
  setEditorTitle: (title: string) => void;
  setEditorContent: (content: string) => void;
  setEditorTags: (tags: string[]) => void;
  setEditorTagInput: (input: string) => void;
  setEditorViewMode: (mode: 'edit' | 'preview') => void;
  setEditorHasChanges: (hasChanges: boolean) => void;
  addEditorTag: (tag: string) => void;
  removeEditorTag: (tag: string) => void;
  resetEditor: () => void;
  syncEditorWithCurrentNote: () => void;
  
  // Computed
  getFilteredNotes: () => Note[];
  getFavoriteNotes: () => Note[];
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  // Initial state
  notes: [],
  currentNote: null,
  searchQuery: '',
  selectedPillar: 'all',
  viewMode: 'dashboard',
  showFavoritesOnly: false,
  editorTitle: '',
  editorContent: '',
  editorTags: [],
  editorTagInput: '',
  editorViewMode: 'edit',
  editorHasChanges: false,

  // Notes actions
  setNotes: (notes) => set({ notes }),
  
  setCurrentNote: (note) => {
    set({ currentNote: note });
    // Sincronizar editor con la nota actual
    if (note) {
      set({
        editorTitle: note.title,
        editorContent: note.content,
        editorTags: note.tags,
        editorHasChanges: false,
      });
    } else {
      get().resetEditor();
    }
  },
  
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  
  updateNote: (id, updates) =>
    set((state) => {
      // Detectar si es una nota nueva (ID temporal que empieza con "note-")
      const isNewNote = id.startsWith('note-');
      
      if (isNewNote) {
        // Es una nota nueva, crear en Supabase primero
        const note = state.notes.find((n) => n.id === id) || state.currentNote;
        if (note) {
          // Determinar el pillar: usar el de updates, luego el de la nota, luego el seleccionado
          const pillar = updates.pillar ?? note.pillar ?? (state.selectedPillar === 'all' ? 'career' : state.selectedPillar);
          
          // Crear la nota en Supabase con los datos actualizados
          const noteToCreate = {
            title: updates.title ?? note.title,
            content: updates.content ?? note.content,
            tags: updates.tags ?? note.tags,
            pillar: pillar as 'career' | 'social' | 'hobby',
            isFavorite: updates.isFavorite ?? note.isFavorite,
            linkedNotes: updates.linkedNotes ?? note.linkedNotes,
          };
          
          createNoteService(noteToCreate)
            .then((createdNote) => {
              // Reemplazar la nota temporal con la nota real de Supabase
              set((currentState) => {
                const updatedNotes = currentState.notes.map((n) =>
                  n.id === id ? createdNote : n,
                );
                const updatedCurrentNote =
                  currentState.currentNote?.id === id ? createdNote : currentState.currentNote;
                
                return {
                  notes: updatedNotes,
                  currentNote: updatedCurrentNote,
                  editorHasChanges: false,
                };
              });
            })
            .catch((error) => {
              console.error('Error creating note in backend:', error);
            });
        }
        
        // Actualizar estado local inmediatamente mientras se crea en Supabase
        const updatedNotes = state.notes.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note,
        );
        const updatedCurrentNote =
          state.currentNote?.id === id
            ? { ...state.currentNote, ...updates, updatedAt: new Date().toISOString() }
            : state.currentNote;
        
        // Sincronizar editor
        if (state.currentNote?.id === id && updates.title !== undefined) {
          set({ editorTitle: updates.title });
        }
        if (state.currentNote?.id === id && updates.content !== undefined) {
          set({ editorContent: updates.content });
        }
        if (state.currentNote?.id === id && updates.tags !== undefined) {
          set({ editorTags: updates.tags });
        }
        
        return {
          notes: updatedNotes,
          currentNote: updatedCurrentNote,
        };
      } else {
        // Es una nota existente, actualizar normalmente
        const updatedNotes = state.notes.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note,
        );
        const updatedCurrentNote =
          state.currentNote?.id === id
            ? { ...state.currentNote, ...updates, updatedAt: new Date().toISOString() }
            : state.currentNote;
        
        // Si estamos editando esta nota, sincronizar el editor
        if (state.currentNote?.id === id && updates.title !== undefined) {
          set({ editorTitle: updates.title });
        }
        if (state.currentNote?.id === id && updates.content !== undefined) {
          set({ editorContent: updates.content });
        }
        if (state.currentNote?.id === id && updates.tags !== undefined) {
          set({ editorTags: updates.tags });
        }
        if (state.currentNote?.id === id) {
          set({ editorHasChanges: false });
        }
        
        // Persistir cambios en el backend de forma asíncrona
        updateNoteService(id, updates).catch((error) => {
          console.error('Error updating note in backend:', error);
        });
        
        return {
          notes: updatedNotes,
          currentNote: updatedCurrentNote,
        };
      }
    }),
  
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote,
    })),

  // UI actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedPillar: (pillar) => set({ selectedPillar: pillar }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
  
  toggleNoteFavorite: (id) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    if (note) {
      get().updateNote(id, { isFavorite: !note.isFavorite });
    }
  },

  // Editor actions
  setEditorTitle: (title) => {
    set({ editorTitle: title, editorHasChanges: true });
  },
  
  setEditorContent: (content) => {
    set({ editorContent: content, editorHasChanges: true });
  },
  
  setEditorTags: (tags) => {
    set({ editorTags: tags, editorHasChanges: true });
  },
  
  setEditorTagInput: (input) => set({ editorTagInput: input }),
  
  setEditorViewMode: (mode) => set({ editorViewMode: mode }),
  
  setEditorHasChanges: (hasChanges) => set({ editorHasChanges: hasChanges }),
  
  addEditorTag: (tag) => {
    const { editorTags } = get();
    if (tag.trim() && !editorTags.includes(tag.trim())) {
      set({
        editorTags: [...editorTags, tag.trim()],
        editorTagInput: '',
        editorHasChanges: true,
      });
    }
  },
  
  removeEditorTag: (tagToRemove) => {
    const { editorTags } = get();
    set({
      editorTags: editorTags.filter((tag) => tag !== tagToRemove),
      editorHasChanges: true,
    });
  },
  
  resetEditor: () => {
    set({
      editorTitle: '',
      editorContent: '',
      editorTags: [],
      editorTagInput: '',
      editorViewMode: 'edit',
      editorHasChanges: false,
    });
  },
  
  syncEditorWithCurrentNote: () => {
    const { currentNote } = get();
    if (currentNote) {
      set({
        editorTitle: currentNote.title,
        editorContent: currentNote.content,
        editorTags: currentNote.tags,
        editorHasChanges: false,
      });
    }
  },

  // Computed
  getFilteredNotes: () => {
    const { notes, searchQuery, selectedPillar, showFavoritesOnly } = get();
    // Las notas ya vienen filtradas por búsqueda desde Supabase si hay searchQuery
    // Solo aplicamos filtros adicionales de pilar y favoritos
    return notes.filter((note) => {
      const matchesPillar =
        selectedPillar === 'all' || note.pillar === selectedPillar;
      const matchesFavorites = !showFavoritesOnly || note.isFavorite;
      return matchesPillar && matchesFavorites;
    });
  },
  
  getFavoriteNotes: () => {
    const { notes } = get();
    return notes.filter((note) => note.isFavorite);
  },
}));


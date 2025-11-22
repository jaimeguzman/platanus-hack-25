import { useState } from 'react';
import { noteService, CreateNoteParams } from '@/services/noteService';
import { usePKMStore } from '@/stores/pkmStore';
import type { Note } from '@/types/note';

export const useNotes = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { notes, setActiveNote } = usePKMStore();

  const createNote = async (params: CreateNoteParams) => {
    setIsCreating(true);
    setError(null);

    try {
      const newNote = await noteService.createNote(params);

      usePKMStore.setState((state) => ({
        notes: [...state.notes, newNote],
        activeNoteId: newNote.id,
      }));

      setActiveNote(newNote.id);

      return newNote;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error creating note');
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await noteService.updateNote(noteId, updates);

      usePKMStore.setState((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId ? updatedNote : note
        ),
      }));

      return updatedNote;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error updating note');
      setError(error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await noteService.deleteNote(noteId);

      usePKMStore.setState((state) => ({
        notes: state.notes.filter((note) => note.id !== noteId),
        activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error deleting note');
      setError(error);
      throw error;
    }
  };

  const loadUserNotes = async (userId: string) => {
    try {
      const userNotes = await noteService.getNotesByUserId(userId);

      usePKMStore.setState({
        notes: userNotes,
      });

      return userNotes;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error loading notes');
      setError(error);
      throw error;
    }
  };

  return {
    notes,
    isCreating,
    error,
    createNote,
    updateNote,
    deleteNote,
    loadUserNotes,
  };
};

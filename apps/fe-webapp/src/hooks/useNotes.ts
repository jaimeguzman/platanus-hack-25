import { useEffect, useState, useMemo } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { fetchNotes, searchNotes } from '@/services/noteService';
import { NoteServiceError } from '@/lib/errors';

export function useNotes() {
  const { setNotes, notes, searchQuery } = useNoteStore();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const hasQuery = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedNotes = hasQuery 
          ? await searchNotes(searchQuery)
          : await fetchNotes();
        setNotes(fetchedNotes);
      } catch (err) {
        const noteError = err instanceof NoteServiceError 
          ? err 
          : new NoteServiceError('Failed to load notes', 'FETCH_FAILED');
        setError(noteError);
        console.error('Error loading notes:', noteError);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(loadNotes, hasQuery ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [setNotes, searchQuery, hasQuery]);

  return {
    notes,
    isLoading,
    error,
  };
}


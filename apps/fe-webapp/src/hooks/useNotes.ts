import { useEffect, useState, useMemo } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { searchNotes } from '@/services/noteService';
import { getAllMemories, getMemoriesByCategory } from '@/services/ragService';
import { NoteServiceError } from '@/lib/errors';
import type { Note } from '@/types/note';

export function useNotes() {
  const { setNotes, notes, searchQuery, selectedCategory } = useNoteStore();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const hasQuery = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let fetchedNotes: Note[];
        
        // If there's a search query, use the search endpoint
        if (hasQuery) {
          fetchedNotes = await searchNotes(searchQuery);
        } 
        // If a specific category is selected, fetch from RAG by category
        else if (selectedCategory && selectedCategory !== 'all') {
          const memories = await getMemoriesByCategory(selectedCategory);
          // Convert memories to notes format
          fetchedNotes = memories.map(memory => ({
            id: String(memory.id),
            title: memory.text.substring(0, 100) + (memory.text.length > 100 ? '...' : ''),
            content: memory.text,
            tags: memory.category ? [memory.category] : [],
            pillar: memory.category || 'career',
            createdAt: memory.created_at,
            updatedAt: memory.created_at,
            linkedNotes: [],
            isFavorite: false,
          }));
        }
        // Otherwise, fetch all memories from RAG
        else {
          const memories = await getAllMemories();
          // Convert memories to notes format
          fetchedNotes = memories.map(memory => ({
            id: String(memory.id),
            title: memory.text.substring(0, 100) + (memory.text.length > 100 ? '...' : ''),
            content: memory.text,
            tags: memory.category ? [memory.category] : [],
            pillar: memory.category || 'career',
            createdAt: memory.created_at,
            updatedAt: memory.created_at,
            linkedNotes: [],
            isFavorite: false,
          }));
        }
        
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
  }, [setNotes, searchQuery, hasQuery, selectedCategory]);

  return {
    notes,
    isLoading,
    error,
  };
}


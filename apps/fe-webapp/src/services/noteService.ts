import { getSupabaseClient } from '@/lib/supabase';
import type { Note } from '@/types/note';
import { NoteServiceError, ERROR_CODES } from '@/lib/errors';
import { DB_TABLES } from '@/constants';
import { saveNoteToRag, updateNoteInRag, deleteNoteFromRag } from './ragService';

// Mapeo de pillar a project_id (cache)
const PILLAR_TO_PROJECT_ID: Record<string, string> = {};
const PROJECT_NAME_TO_PILLAR: Record<string, 'career' | 'social' | 'hobby'> = {
  'Desarrollo de Carrera': 'career',
  'Social': 'social',
  'Hobby': 'hobby',
};

// NOTE: Las notas ahora se guardan SOLO en RAG, no en Supabase
// Las funciones createNote y updateNote ahora solo manejan RAG

// Obtener project_id desde pillar
async function getProjectIdByPillar(pillar: 'career' | 'social' | 'hobby'): Promise<string> {
  if (PILLAR_TO_PROJECT_ID[pillar]) {
    return PILLAR_TO_PROJECT_ID[pillar];
  }
  
  const supabase = getSupabaseClient();
  const projectName = pillar === 'career' ? 'Desarrollo de Carrera' : pillar === 'social' ? 'Social' : 'Hobby';
  
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('name', projectName)
    .limit(1)
    .single();
  
  const projectData = data as { id: string } | null;
  if (projectData?.id) {
    PILLAR_TO_PROJECT_ID[pillar] = projectData.id;
    return projectData.id;
  }
  
  throw new NoteServiceError(`Project not found for pillar: ${pillar}`, ERROR_CODES.NOT_FOUND);
}

/**
 * Obtiene los backlinks (linkedNotes) de una nota desde note_backlinks
 */
async function fetchLinkedNotes(noteId: string): Promise<string[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('note_backlinks')
      .select('target_note_id')
      .eq('source_note_id', noteId);

    if (error) {
      console.warn(`Error fetching linked notes for ${noteId}:`, error);
      return [];
    }

    return (data || []).map((link) => (link as { target_note_id: string }).target_note_id);
  } catch (error) {
    console.warn(`Error fetching linked notes for ${noteId}:`, error);
    return [];
  }
}

/**
 * Obtiene todas las notas desde el RAG
 */
export async function fetchNotes(): Promise<Note[]> {
  try {
    // For now, return empty array as we'll need to implement a way to get all memories from RAG
    // The RAG doesn't have a direct concept of "notes" separate from memories
    // We'll need to filter by source='text_new_note' when the RAG API supports it
    console.warn('fetchNotes: Notes are now stored in RAG only. Returning empty array for now.');
    return [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
}

/**
 * Crea o actualiza tags en la base de datos
 */
async function syncTags(noteId: string, tags: string[], userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Obtener tags existentes de la nota
  const { data: existingNoteTags } = await supabase
    .from('note_tags')
    .select('tag_id, tags!inner(name)')
    .eq('note_id', noteId);

  const existingTagNames = (existingNoteTags || []).map((nt) => {
    const noteTag = nt as { tags: { name: string } };
    return noteTag.tags?.name || '';
  }).filter((name) => name !== '');

  // Crear tags que no existen
  const tagsToCreate = tags.filter((tag) => !existingTagNames.includes(tag));
  for (const tagName of tagsToCreate) {
    // Verificar si el tag ya existe para este usuario
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .eq('name', tagName)
      .single();

    let tagId: string;
    const existingTagRecord = existingTag as { id?: string } | null;
    if (existingTagRecord?.id) {
      tagId = existingTagRecord.id;
    } else {
      // Crear nuevo tag
      const { data: newTag, error: tagError } = await supabase
        .from('tags')
        .insert({
          user_id: userId,
          name: tagName,
        } as never)
        .select('id')
        .single();

      const newTagRecord = newTag as { id?: string } | null;
      if (tagError || !newTagRecord?.id) {
        console.warn(`Error creating tag ${tagName}:`, tagError);
        continue;
      }
      tagId = newTagRecord.id;
    }

    // Asociar tag con la nota
    await supabase.from('note_tags').insert({
      note_id: noteId,
      tag_id: tagId,
    } as never);
  }

  // Eliminar tags que ya no están en la lista
  const tagsToRemove = existingTagNames.filter((tag) => !tags.includes(tag));
  if (tagsToRemove.length > 0) {
    const { data: tagsToDelete } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .in('name', tagsToRemove);

    const tagIdsToDelete = (tagsToDelete || []).map((t) => (t as { id: string }).id);
    if (tagIdsToDelete.length > 0) {
      await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId)
        .in('tag_id', tagIdsToDelete);
    }
  }
}

/**
 * Sincroniza backlinks (linkedNotes) en note_backlinks
 */
async function syncBacklinks(noteId: string, linkedNotes: string[]): Promise<void> {
  const supabase = getSupabaseClient();

  // Eliminar backlinks existentes de esta nota
  await supabase.from('note_backlinks').delete().eq('source_note_id', noteId);

    // Crear nuevos backlinks
    if (linkedNotes.length > 0) {
      const backlinksToInsert = linkedNotes
        .filter((linkedId) => linkedId !== noteId) // Evitar self-loops
        .map((targetId) => ({
          source_note_id: noteId,
          target_note_id: targetId,
        }));

      if (backlinksToInsert.length > 0) {
        await supabase.from('note_backlinks').insert(backlinksToInsert as never);
      }
    }
}

export async function createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  try {
    const pillar = note.pillar ?? 'career';
    const now = new Date().toISOString();
    
    // Save ONLY to RAG (no Supabase)
    const noteText = `${note.title}\n\n${note.content}`;
    const ragResponse = await saveNoteToRag(
      noteText,
      pillar,
      'text_new_note'
    );
    
    const memoryId = ragResponse.memory.id;
    console.log('Note saved to RAG with ID:', memoryId);
    
    // Create a Note object from the RAG response
    const createdNote: Note = {
      id: String(memoryId), // Use memory ID as note ID
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      pillar,
      isFavorite: note.isFavorite ?? false,
      createdAt: ragResponse.memory.created_at || now,
      updatedAt: ragResponse.memory.created_at || now,
      linkedNotes: note.linkedNotes || [],
      ragMemoryId: memoryId,
    };
    
    return createdNote;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new NoteServiceError(
      `Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ERROR_CODES.CREATE_FAILED,
    );
  }
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  try {
    const now = new Date().toISOString();
    
    // Parse memory ID from note ID (if it's a number, it's from RAG)
    const memoryId = parseInt(id);
    
    if (isNaN(memoryId)) {
      throw new NoteServiceError(
        'Invalid note ID format',
        ERROR_CODES.UPDATE_FAILED,
      );
    }

    // Update in RAG if content or title changed
    if (updates.title !== undefined || updates.content !== undefined) {
      // We need to get the current note to have complete data
      // For now, we'll require both title and content in updates
      if (!updates.title || !updates.content) {
        throw new NoteServiceError(
          'Both title and content are required for updates',
          ERROR_CODES.UPDATE_FAILED,
        );
      }
      
      const noteText = `${updates.title}\n\n${updates.content}`;
      const pillar = updates.pillar;
      
      const ragResponse = await updateNoteInRag(
        memoryId,
        noteText,
        pillar,
        'text_new_note'
      );
      
      console.log('Note updated in RAG:', memoryId);
      
      // Return updated note
      return {
        id: String(memoryId),
        title: updates.title,
        content: updates.content,
        tags: updates.tags || [],
        pillar: pillar || 'career',
        isFavorite: updates.isFavorite ?? false,
        createdAt: ragResponse.memory.created_at || now,
        updatedAt: now,
        linkedNotes: updates.linkedNotes || [],
        ragMemoryId: memoryId,
      };
    }
    
    // If only non-content fields changed, just return the note with updates
    // (we don't store these in RAG)
    throw new NoteServiceError(
      'No content to update',
      ERROR_CODES.UPDATE_FAILED,
    );
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  try {
    // Parse memory ID from note ID
    const memoryId = parseInt(id);
    
    if (isNaN(memoryId)) {
      throw new NoteServiceError(
        'Invalid note ID format',
        ERROR_CODES.DELETE_FAILED || 'DELETE_FAILED',
      );
    }

    // Delete from RAG only (no Supabase)
    await deleteNoteFromRag(memoryId);
    console.log('Note deleted from RAG:', memoryId);

    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

export async function fetchFavoriteNotes(): Promise<Note[]> {
  try {
    const supabase = getSupabaseClient();
    
    // Usar notes_full para obtener tags automáticamente
    const { data: notesData, error: notesError } = await supabase
      .from('notes_full')
      .select('*')
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false });

    if (notesError) {
      throw new NoteServiceError(
        `Failed to fetch favorite notes: ${notesError.message}`,
        ERROR_CODES.FETCH_FAILED,
      );
    }

    if (!notesData) {
      throw new NoteServiceError(
        'No data returned from database',
        ERROR_CODES.FETCH_FAILED,
      );
    }

    // Obtener backlinks para todas las notas
    const notesWithBacklinks = await Promise.all(
      notesData.map(async (note) => {
        const noteRecord = note as Record<string, unknown>;
        const noteId = noteRecord.id as string;
        const linkedNotes = await fetchLinkedNotes(noteId);
        return {
          ...noteRecord,
          linked_notes: linkedNotes,
        };
      }),
    );

    return notesWithBacklinks.map(mapDbNoteToNote);
  } catch (error) {
    console.error('Error fetching favorite notes:', error);
    throw error;
  }
}

export async function toggleNoteFavorite(id: string, isFavorite: boolean): Promise<Note> {
  return updateNote(id, { isFavorite });
}

export async function searchNotes(query: string): Promise<Note[]> {
  try {
    if (!query || !query.trim()) {
      return [];
    }

    const supabase = getSupabaseClient();
    const searchTerm = `%${query.trim()}%`;
    
    // Buscar en notes_full (incluye tags) y filtrar por título o contenido
    // Usar ilike para búsqueda case-insensitive
    // La sintaxis correcta para .or() es: 'field1.ilike.value1,field2.ilike.value2'
    const { data: notesData, error: searchError } = await supabase
      .from('notes_full')
      .select('*')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order('updated_at', { ascending: false });

    if (searchError) {
      throw new NoteServiceError(
        `Failed to search notes: ${searchError.message}`,
        ERROR_CODES.SEARCH_FAILED,
      );
    }

    if (!notesData || notesData.length === 0) {
      return [];
    }

    // Filtrar por tags si el query coincide (búsqueda en memoria sobre tags)
    const queryLower = query.toLowerCase().trim();
    const filteredByTags = (notesData as Array<Record<string, unknown>>).filter((note) => {
      const tags = Array.isArray(note.tags) ? (note.tags as string[]) : [];
      return tags.some((tag: string) => tag.toLowerCase().includes(queryLower));
    });

    // Combinar resultados y eliminar duplicados
    const allResults = [...notesData, ...filteredByTags];
    const uniqueResults = Array.from(
      new Map(allResults.map((note) => {
        const noteRecord = note as Record<string, unknown>;
        return [noteRecord.id as string, note];
      })).values()
    );

    // Obtener backlinks para todas las notas
    const notesWithBacklinks = await Promise.all(
      uniqueResults.map(async (note) => {
        const noteRecord = note as Record<string, unknown>;
        const noteId = noteRecord.id as string;
        const linkedNotes = await fetchLinkedNotes(noteId);
        return {
          ...noteRecord,
          linked_notes: linkedNotes,
        };
      }),
    );

    return notesWithBacklinks.map(mapDbNoteToNote);
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
}

/**
 * Mapea datos de la base de datos al tipo Note
 * Maneja datos desde notes_full (con tags) o notes (sin tags)
 */
function mapDbNoteToNote(dbNote: Record<string, unknown>): Note {
  // Tags pueden venir de notes_full como array o estar vacíos
  const tags = Array.isArray(dbNote.tags) 
    ? (dbNote.tags as string[]) 
    : [];
  
  // Linked notes pueden venir como array o estar vacíos
  const linkedNotes = Array.isArray(dbNote.linked_notes)
    ? (dbNote.linked_notes as string[])
    : [];
  
  // is_favorite puede ser boolean o null/undefined, mapear desde is_pinned
  const isFavorite = typeof dbNote.is_pinned === 'boolean' 
    ? dbNote.is_pinned 
    : false;

  // Mapear project_name a pillar, o usar pillar si existe (compatibilidad)
  const projectName = dbNote.project_name as string | undefined;
  const pillar = projectName && PROJECT_NAME_TO_PILLAR[projectName]
    ? PROJECT_NAME_TO_PILLAR[projectName]
    : ((dbNote.pillar as 'career' | 'social' | 'hobby') || 'career');

  // Get memory_id if available
  const ragMemoryId = typeof dbNote.memory_id === 'number' 
    ? dbNote.memory_id 
    : undefined;

  return {
    id: dbNote.id as string,
    title: dbNote.title as string,
    content: dbNote.content as string,
    tags,
    pillar,
    isFavorite,
    createdAt: (dbNote.created_at as string) || new Date().toISOString(),
    updatedAt: (dbNote.updated_at as string) || new Date().toISOString(),
    linkedNotes,
    ragMemoryId,
  };
}


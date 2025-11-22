import { supabase } from '@/lib/supabase';
import type { Note } from '@/types/note';
import type { Database } from '@/types/supabase';

type NoteUpdate = Database['public']['Tables']['notes']['Update'];

export interface CreateNoteParams {
  userId: string;
  title: string;
  content: string;
  projectId?: string | null;
  isPinned?: boolean;
  tags?: string[];
}

export const noteService = {
  async createNote(params: CreateNoteParams): Promise<Note> {
    const { userId, title, content, projectId, isPinned = false, tags = [] } = params;

    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content,
        project_id: projectId || null,
        is_pinned: isPinned,
      })
      .select()
      .single();

    if (noteError) throw noteError;

    if (tags.length > 0) {
      for (const tagName of tags) {
        let tagId: string;

        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', userId)
          .eq('name', tagName)
          .single();

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({ user_id: userId, name: tagName })
            .select('id')
            .single();

          if (tagError) throw tagError;
          tagId = newTag.id;
        }

        const { error: noteTagError } = await supabase
          .from('note_tags')
          .insert({ note_id: noteData.id, tag_id: tagId });

        if (noteTagError) throw noteTagError;
      }
    }

    return {
      id: noteData.id,
      title: noteData.title,
      content: noteData.content,
      tags,
      createdAt: new Date(noteData.created_at!),
      updatedAt: new Date(noteData.updated_at!),
      projectId: noteData.project_id || undefined,
      isPinned: noteData.is_pinned || false,
      backlinks: [],
    };
  },

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
    const updateData: NoteUpdate = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId || null;

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;

    const { data: tagsData } = await supabase
      .from('note_tags')
      .select('tags(name)')
      .eq('note_id', noteId);

    const tags = tagsData?.map((item) => (item as { tags: { name: string } }).tags?.name).filter(Boolean) || [];

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      tags,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
      projectId: data.project_id || undefined,
      isPinned: data.is_pinned || false,
      backlinks: [],
    };
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  async getNotesByUserId(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_tags(tags(name))
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: (note.note_tags as Array<{ tags: { name: string } }>)?.map((nt) => nt.tags?.name).filter(Boolean) || [],
      createdAt: new Date(note.created_at!),
      updatedAt: new Date(note.updated_at!),
      projectId: note.project_id || undefined,
      isPinned: note.is_pinned || false,
      backlinks: [],
    }));
  },
};

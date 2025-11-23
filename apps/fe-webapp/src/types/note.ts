export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pillar: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  linkedNotes?: string[];
  ragMemoryId?: number; // ID of the corresponding memory in RAG
}

export interface NoteMetadata {
  id: string;
  title: string;
  tags: string[];
  pillar: string;
  updatedAt: string;
}


export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pillar: 'career' | 'social' | 'hobby';
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  linkedNotes?: string[];
}

export interface NoteMetadata {
  id: string;
  title: string;
  tags: string[];
  pillar: 'career' | 'social' | 'hobby';
  updatedAt: string;
}


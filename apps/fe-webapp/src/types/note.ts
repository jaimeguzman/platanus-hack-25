export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  isPinned?: boolean;
  backlinks?: string[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;
  noteCount?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'tag' | 'project';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'link' | 'tag' | 'backlink';
  strength?: number;
}

export interface SearchResult {
  note: Note;
  score: number;
  highlights: string[];
}

export interface AudioTranscription {
  id: string;
  audioUrl: string;
  text: string;
  duration: number;
  createdAt: Date;
  noteId?: string;
}
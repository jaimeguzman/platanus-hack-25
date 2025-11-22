/**
 * Mock data constants - Centralized source of truth
 * NO HARDCODED MOCK DATA - All mock data is defined here
 */
import { Project, Note } from '@/types/note';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'default',
    name: 'General',
    color: '#3B82F6',
    createdAt: new Date(),
    noteCount: 0,
  },
];

export const MOCK_NOTES: Note[] = [];

export const DEFAULT_VALUES = {
  note: {
    title: 'Untitled Note',
    content: '',
    tags: [],
  },
  project: {
    name: 'New Project',
    color: '#3B82F6',
  },
} as const;

export const FALLBACK_VALUES = {
  project: {
    id: 'default',
    name: 'General',
  },
  note: {
    title: 'Untitled Note',
    content: '',
  },
} as const;

/**
 * Numeric constants - NO MAGIC NUMBERS
 */
export const NUMERIC_CONSTANTS = {
  recentNotesLimit: 10,
  projectNotesLimit: 10,
  edgeStrength: {
    default: 0.5,
    multiplier: 2,
  },
  nodeSize: {
    default: 8,
  },
  canvas: {
    lineWidth: 2,
    fontSize: 12,
    labelOffset: 15,
  },
} as const;


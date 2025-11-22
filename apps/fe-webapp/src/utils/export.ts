import { Note } from '@/types/note';

export const exportToMarkdown = (note: Note): string => {
  const frontmatter = `---
title: ${note.title}
created: ${note.createdAt.toISOString()}
updated: ${note.updatedAt.toISOString()}
tags: [${note.tags.map(tag => `"${tag}"`).join(', ')}]
${note.projectId ? `project: ${note.projectId}` : ''}
---

`;

  return frontmatter + note.content;
};

export const exportMultipleToMarkdown = (notes: Note[]): string => {
  return notes.map(exportToMarkdown).join('\n\n---\n\n');
};

export const downloadMarkdown = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportProjectToZip = async (notes: Note[], projectName: string) => {
  // This would require JSZip library in a real implementation
  // For now, we'll export as a single markdown file
  const content = exportMultipleToMarkdown(notes);
  downloadMarkdown(content, `${projectName}-notes.md`);
};
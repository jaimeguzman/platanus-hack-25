'use client';

import React, { useState, useCallback } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Eye, Edit3, Save, Hash, Calendar, Download, Plus, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { exportToMarkdown, downloadMarkdown } from '@/utils/export';

const NoteEditor: React.FC = () => {
  const { activeNoteId, getNoteById, updateNote, projects, togglePinned } = usePKMStore();
  const [isPreview, setIsPreview] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const [newTag, setNewTag] = useState('');
  
  const activeNote = activeNoteId ? getNoteById(activeNoteId) : null;
  const project = activeNote ? projects.find(p => p.id === activeNote.projectId) : null;
  
  React.useEffect(() => {
    if (activeNote) {
      setLocalContent(activeNote.content);
    }
  }, [activeNote]);

  const handleContentChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (activeNoteId && localContent !== activeNote?.content) {
      updateNote(activeNoteId, { content: localContent });
    }
  }, [activeNoteId, localContent, activeNote?.content, updateNote]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeNoteId) {
      updateNote(activeNoteId, { title: e.target.value });
    }
  }, [activeNoteId, updateNote]);

  const handleTagAdd = useCallback(() => {
    if (activeNoteId && newTag.trim()) {
      const currentNote = getNoteById(activeNoteId);
      if (currentNote && !currentNote.tags.includes(newTag.trim())) {
        updateNote(activeNoteId, { 
          tags: [...currentNote.tags, newTag.trim()] 
        });
        setNewTag('');
      }
    }
  }, [activeNoteId, newTag, getNoteById, updateNote]);

  const handleTagRemove = useCallback((tagToRemove: string) => {
    if (activeNoteId) {
      const currentNote = getNoteById(activeNoteId);
      if (currentNote) {
        updateNote(activeNoteId, { 
          tags: currentNote.tags.filter(tag => tag !== tagToRemove) 
        });
      }
    }
  }, [activeNoteId, getNoteById, updateNote]);

  const handleExport = useCallback(() => {
    if (activeNote) {
      const markdown = exportToMarkdown(activeNote);
      downloadMarkdown(markdown, activeNote.title);
    }
  }, [activeNote]);

  const handleTogglePinned = useCallback(() => {
    if (activeNoteId) {
      togglePinned(activeNoteId);
    }
  }, [activeNoteId, togglePinned]);

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full min-h-0">
        <div className="text-center max-w-lg px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Edit3 className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Selecciona una nota</h3>
          <p className="text-muted-foreground text-base leading-relaxed">
            Elige una nota del panel lateral o crea una nueva para comenzar a capturar tus ideas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full min-h-0 overflow-hidden">
      {/* Breadcrumbs */}
      {project && (
        <div className="px-8 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: project.color }}
            />
            <span className="hover:text-foreground cursor-pointer transition-colors font-medium">{project.name}</span>
            <span className="opacity-40">/</span>
            <span className="text-foreground font-semibold">{activeNote.title || 'Sin título'}</span>
          </div>
        </div>
      )}

      {/* Note Header */}
      <div className="px-8 pt-6 pb-5 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Input
            type="text"
            value={activeNote.title}
            onChange={handleTitleChange}
            className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-foreground placeholder-muted-foreground tracking-tight h-auto p-0 focus-visible:ring-0"
            placeholder="Sin título"
          />
          {/* Botones de acción agrupados */}
          <div className="flex items-center gap-4 flex-shrink-0 pt-3 pr-">
            {/* Toggle Preview/Edit - estilo link */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreview(false)}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-all duration-200 underline-offset-4",
                  !isPreview
                    ? "text-violet-500 underline decoration-violet-500"
                    : "text-muted-foreground hover:text-violet-500 underline decoration-transparent hover:decoration-violet-500"
                )}
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <span className="text-muted-foreground/50">|</span>
              <button
                onClick={() => setIsPreview(true)}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-all duration-200 underline-offset-4",
                  isPreview
                    ? "text-violet-500 underline decoration-violet-500"
                    : "text-muted-foreground hover:text-violet-500 underline decoration-transparent hover:decoration-violet-500"
                )}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>

            {/* Separador */}
            <div className="h-4 w-px bg-border" />

            {/* Favorito, Guardar y Exportar */}
            <div className="flex items-center gap-3 pr-6">
              <button
                onClick={handleTogglePinned}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-all duration-200 underline-offset-4",
                  activeNote.isPinned
                    ? "text-amber-500 underline decoration-amber-500"
                    : "text-muted-foreground hover:text-amber-500 underline decoration-transparent hover:decoration-amber-500"
                )}
                title={activeNote.isPinned ? "Quitar de favoritos" : "Agregar a favoritos"}
              >
                <Star className={cn("w-4 h-4", activeNote.isPinned && "fill-amber-500")} />
                Favorito
              </button>
              <span className="text-muted-foreground/50">|</span>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-violet-500 underline underline-offset-4 decoration-transparent hover:decoration-violet-500 transition-all duration-200"
                title="Guardar (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <span className="text-muted-foreground/50">|</span>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-violet-500 underline underline-offset-4 decoration-transparent hover:decoration-violet-500 transition-all duration-200"
                title="Exportar a Markdown"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{new Date(activeNote.updatedAt).toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span className="font-medium">{activeNote.tags.length} {activeNote.tags.length === 1 ? 'tag' : 'tags'}</span>
          </div>
        </div>

        {/* Tags */}
        {activeNote.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 pt-2">
            {activeNote.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:border-violet-500/40 transition-colors"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="hover:bg-violet-500/20 rounded-full w-4 h-4 flex items-center justify-center transition-colors -mr-0.5"
                  aria-label={`Eliminar tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add tag input */}
        <div className="flex items-center gap-2 pt-2">
          <Input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Agregar tag..."
            className="w-40 h-8 text-sm border border-border bg-muted/50 text-foreground focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-muted-foreground"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTagAdd();
              }
            }}
          />
          <Button
            onClick={handleTagAdd}
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Editor Content - Minimalist and elegant */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto px-12 py-10 prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-semibold mb-4 mt-6 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3 mt-5 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold mb-2 mt-4 text-foreground">{children}</h3>,
                p: ({ children }) => <p className="mb-4 leading-7 text-foreground">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-4 text-foreground space-y-2 ml-6">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-4 text-foreground space-y-2 ml-6">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 my-6 italic text-muted-foreground bg-muted/50 py-2 rounded-r">{children}</blockquote>
                ),
                code: ({ children, ...props }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm border border-border text-foreground font-mono" {...props}>
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="block bg-muted p-4 rounded-lg my-6 overflow-x-auto border border-border">
                    {children}
                  </pre>
                ),
                a: ({ children, href }) => (
                  <a href={href} className="text-primary hover:text-primary/80 underline transition-colors" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              }}
            >
              {localContent}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="h-full">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={localContent}
              onChange={handleContentChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                fontSize: 15,
                fontFamily: 'Monaco, "SF Mono", Monaco, Menlo, "Ubuntu Mono", monospace',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                suggest: {
                  showWords: true,
                  showSnippets: true
                },
                quickSuggestions: true,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
                lineHeight: 24,
                padding: { top: 32, bottom: 32 },
                cursorStyle: 'line-thin',
                cursorBlinking: 'smooth',
                selectionHighlight: false,
                renderLineHighlight: 'line'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
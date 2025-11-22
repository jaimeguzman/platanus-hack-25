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
  const [showTagInput, setShowTagInput] = useState(false);
  
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
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-lg px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
            <Edit3 className="w-10 h-10 text-muted-foreground" />
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
    <div className="flex-1 flex flex-col bg-background">
      {/* Breadcrumbs */}
      {project && (
        <div className="px-4 lg:px-6 py-3 border-b border-border bg-muted/30">
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
      <div className="px-4 lg:px-6 py-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            type="text"
            value={activeNote.title}
            onChange={handleTitleChange}
            className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-foreground placeholder-muted-foreground tracking-tight h-auto p-0 focus-visible:ring-0"
            placeholder="Sin título"
          />
          {/* Botones de acción agrupados */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Toggle Preview/Edit */}
            <div className="flex items-center bg-muted rounded-md p-1 gap-1">
              <Button
                onClick={() => setIsPreview(false)}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-4 text-sm font-medium rounded-md transition-all",
                  !isPreview
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                )}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => setIsPreview(true)}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-4 text-sm font-medium rounded-md transition-all",
                  isPreview
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                )}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista previa
              </Button>
            </div>

            {/* Separador */}
            <div className="h-8 w-px bg-border" />

            {/* Favorito, Guardar y Exportar */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTogglePinned}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-sm hover:bg-accent transition-colors",
                  activeNote.isPinned
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={activeNote.isPinned ? "Quitar de favoritos" : "Agregar a favoritos"}
              >
                <Star className={cn("w-4 h-4 mr-2", activeNote.isPinned && "fill-current")} />
                {activeNote.isPinned ? "Favorito" : "Favorito"}
              </Button>
              <Button
                onClick={handleSave}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                title="Guardar (Ctrl+S)"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button
                onClick={handleExport}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                title="Exportar a Markdown"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(activeNote.updatedAt).toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span>{activeNote.tags.length} {activeNote.tags.length === 1 ? 'tag' : 'tags'}</span>
          </div>
        </div>

        {/* Tags */}
        {activeNote.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {activeNote.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="hover:bg-muted-foreground/10 rounded-sm w-3.5 h-3.5 flex items-center justify-center"
                  aria-label={`Eliminar tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add tag input (colapsado) */}
        <div className="flex items-center gap-2 mt-2">
          {showTagInput && (
            <Input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Agregar tag..."
              className="w-40 h-8 text-xs bg-muted border-transparent focus-visible:ring-1 focus-visible:ring-ring"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTagAdd();
                  setShowTagInput(false);
                }
              }}
            />
          )}
          <Button
            onClick={() => {
              if (showTagInput && newTag.trim()) {
                handleTagAdd();
                setShowTagInput(false);
              } else {
                setShowTagInput((v) => !v);
              }
            }}
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            title={showTagInput ? 'Agregar tag' : 'Nuevo tag'}
            aria-label={showTagInput ? 'Agregar tag' : 'Nuevo tag'}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto px-4 lg:px-6 py-6 prose max-w-none">
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
              theme="light"
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'off',
                fontSize: 16,
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'none',
                bracketPairColorization: { enabled: false },
                suggest: {
                  showWords: true,
                  showSnippets: true
                },
                quickSuggestions: true,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: false,
                lineHeight: 24,
                padding: { top: 24, bottom: 24 },
                cursorStyle: 'line',
                cursorBlinking: 'blink',
                selectionHighlight: false,
                renderLineHighlight: 'none'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
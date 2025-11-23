'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as React from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Eye, Edit, X, Star, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import type { Components } from 'react-markdown';
import { APP_CONFIG, UI_MESSAGES, DEFAULT_VALUES, FORMATTING } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { createNote as createNoteService } from '@/services/noteService';

export function NoteEditor() {
  const {
    currentNote,
    editorContent,
    editorTags,
    editorTagInput,
    editorViewMode,
    editorHasChanges,
    setEditorContent,
    setEditorTagInput,
    setEditorViewMode,
    addEditorTag,
    removeEditorTag,
    updateNote,
    toggleNoteFavorite,
    setViewMode,
    addNote,
  } = useNoteStore();

  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  // Evitar hidration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Componentes personalizados para ReactMarkdown (memoizados para evitar recreación)
  const markdownComponents: Partial<Components> = useMemo(() => {
    // Seleccionar estilo según el tema
    const codeStyle = mounted && theme === 'dark' 
      ? vscDarkPlus 
      : oneLight;

    return {
      // Renderizado personalizado para bloques de código
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const isInline = !className || !match;
        
        return !isInline && language ? (
          <SyntaxHighlighter
            style={codeStyle as Record<string, React.CSSProperties>}
            language={language}
            PreTag="div"
            className="rounded-md"
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
            {children}
          </code>
        );
      },
    };
  }, [theme, mounted]);

  // Manual save handler
  const handleSaveNote = async () => {
    if (!currentNote || !editorHasChanges) return;

    let addingToGraphToast: { dismiss: () => void } | null = null;

    try {
      setIsSaving(true);
      
      // Detect if it's a new note (temporary ID starts with "note-")
      const isNewNote = currentNote.id.startsWith('note-');
      
      let savedNote;
      if (isNewNote) {
        // Create new note in RAG
        const pillar = currentNote.pillar || 'career';
        savedNote = await createNoteService({
          title: editorContent.substring(0, 50),
          content: editorContent,
          tags: editorTags,
          pillar: pillar as 'career' | 'social' | 'hobby',
          isFavorite: currentNote.isFavorite || false,
          linkedNotes: currentNote.linkedNotes || [],
        });
        
        // At this point, the log "Note saved to RAG with ID: X" has already been printed
        console.log('Nota guardada exitosamente, preparando para agregar al grafo...');
      } else {
        // Update existing note
        savedNote = await updateNote(currentNote.id, {
          title: editorContent.substring(0, 50),
          content: editorContent,
          tags: editorTags,
        });
      }

      // After the note is saved and we have the RAG ID, show "adding to graph" message
      if (savedNote) {
        addNote(savedNote);
        
        // Show "adding to graph" toast AFTER we have the saved note from RAG
        addingToGraphToast = toast({
          title: "Agregando al grafo...",
          description: "Conectando con conocimientos relacionados",
          duration: Infinity,
        });
        
        // Store the graph node data globally for the GraphView to pick up
        const windowWithGraph = window as unknown as { 
          pendingGraphNode?: {
            node: {
              id: string;
              label: string;
              type: string;
              category?: string;
              created_at?: string;
            };
            edges: {
              source: string;
              target: string;
              weight: number;
            }[];
          };
          focusPendingNode?: boolean;
          onNodeAdded?: () => void;
        };
        
        // Create graph node data from the saved note
        windowWithGraph.pendingGraphNode = {
          node: {
            id: savedNote.ragMemoryId ? String(savedNote.ragMemoryId) : savedNote.id,
            label: savedNote.content.substring(0, 50) + (savedNote.content.length > 50 ? '...' : ''),
            type: 'memory',
            category: savedNote.pillar,
            created_at: savedNote.createdAt,
          },
          edges: [], // Edges will be loaded from the RAG
        };
        windowWithGraph.focusPendingNode = true;
        
        // Callback when node is added and focused
        windowWithGraph.onNodeAdded = () => {
          // Dismiss the loading toast
          if (addingToGraphToast) {
            addingToGraphToast.dismiss();
          }
          setIsSaving(false);
          
          // Show success toast
          toast({
            title: "¡Nota agregada al grafo!",
            description: "Tu nota ha sido conectada exitosamente",
          });
        };
      }

      // Switch to graph view to show the new node
      setViewMode('graph');
    } catch (error) {
      console.error('Error saving note:', error);
      if (addingToGraphToast) {
        addingToGraphToast.dismiss();
      }
      setIsSaving(false);
      
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la nota. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!currentNote) return;

    const markdown = `${editorContent}\n\n${editorTags.map((tag) => `#${tag}`).join(' ')}`;
    const blob = new Blob([markdown], { type: DEFAULT_VALUES.MARKDOWN_FILE_TYPE });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = editorContent.substring(0, 30).replace(FORMATTING.FILE_NAME_REPLACE_PATTERN, FORMATTING.FILE_NAME_REPLACE_WITH) || 'note';
    a.download = `${filename}${DEFAULT_VALUES.MARKDOWN_FILE_EXTENSION}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentNote) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {UI_MESSAGES.SELECT_OR_CREATE_NOTE}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col relative">
      {/* Loading overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Procesando nota...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nueva Nota</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={editorHasChanges ? "default" : "outline"}
              size="icon"
              onClick={handleSaveNote}
              disabled={!editorHasChanges || isSaving}
              title="Guardar nota"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => currentNote && toggleNoteFavorite(currentNote.id)}
              title={currentNote?.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            >
              <Star
                className={`h-4 w-4 ${
                  currentNote?.isFavorite
                    ? 'fill-yellow-500 text-yellow-500'
                    : ''
                }`}
              />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setEditorViewMode(editorViewMode === 'edit' ? 'preview' : 'edit')
              }
            >
              {editorViewMode === 'edit' ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {editorTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
            >
              #{tag}
              <button
                onClick={() => removeEditorTag(tag)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Input
            value={editorTagInput}
            onChange={(e) => setEditorTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEditorTag(editorTagInput);
              }
            }}
            placeholder={UI_MESSAGES.TAG_PLACEHOLDER}
            className="h-7 w-32 text-xs"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {editorViewMode === 'edit' ? (
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            placeholder={UI_MESSAGES.NOTE_CONTENT_PLACEHOLDER}
            className="h-full w-full resize-none border-0 p-6 font-mono text-sm focus:outline-none"
            disabled={isSaving}
          />
        ) : (
          <div className="prose prose-sm prose-slate max-w-none p-6 dark:prose-invert">
            <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
              {editorContent || UI_MESSAGES.NO_CONTENT}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}


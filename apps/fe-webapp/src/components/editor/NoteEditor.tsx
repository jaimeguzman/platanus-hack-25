'use client';

import React, { useState, useCallback } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Eye, Edit3, Save, Hash, Calendar, Download, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { exportToMarkdown, downloadMarkdown } from '@/utils/export';

const NoteEditor: React.FC = () => {
  const { activeNoteId, getNoteById, updateNote, projects } = usePKMStore();
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

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111111]">
        <div className="text-center max-w-md px-6">
          <Edit3 className="w-20 h-20 text-[#666666] mx-auto mb-8 opacity-50" />
          <h3 className="text-2xl font-semibold text-[#EEEEEE] mb-3 tracking-tight">No note selected</h3>
          <p className="text-[#999999] text-base leading-relaxed">Select a note from the sidebar or create a new one to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#111111]">
      {/* Breadcrumbs - ClickUp style */}
      {project && (
        <div className="px-8 py-3 border-b border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center gap-2 text-sm text-[#999999]">
            <span className="hover:text-[#EEEEEE] cursor-pointer transition-colors font-medium">{project.name}</span>
            <span className="text-[#666666]">/</span>
            <span className="text-[#EEEEEE] font-semibold">{activeNote.title || 'Untitled Note'}</span>
          </div>
        </div>
      )}

      {/* Note Header - ClickUp style: compact */}
      <div className="px-8 py-6 border-b border-[#2A2A2A] space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            type="text"
            value={activeNote.title}
            onChange={handleTitleChange}
            className="text-3xl font-bold bg-transparent border-none outline-none flex-1 text-[#EEEEEE] placeholder-[#666666] tracking-tight h-auto p-0 focus-visible:ring-0"
            placeholder="Untitled Note"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleExport}
              variant="ghost"
              size="sm"
              className="h-9 px-4 text-sm font-medium text-[#EEEEEE] hover:bg-[#1A1A1A]"
              title="Export to Markdown"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleSave}
              variant="ghost"
              size="sm"
              className="h-9 px-4 text-sm font-medium text-[#EEEEEE] hover:bg-[#1A1A1A]"
              title="Save note"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={() => setIsPreview(!isPreview)}
              variant={isPreview ? 'default' : 'ghost'}
              size="sm"
              className="h-9 px-4 text-sm font-medium text-[#EEEEEE] hover:bg-[#1A1A1A] data-[state=on]:bg-[#2A2A2A]"
              title="Toggle preview"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
        
        {/* Metadata - ClickUp style: minimal */}
        <div className="flex items-center gap-6 text-sm text-[#999999]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{new Date(activeNote.updatedAt).toLocaleDateString('en-US', { 
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
        
        {/* Tags - ClickUp style: compact */}
        {activeNote.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 pt-2">
            {activeNote.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-[#1A1A1A] text-[#EEEEEE] border border-[#2A2A2A] hover:border-[#4A5560] transition-colors"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="hover:bg-[#2A2A2A] rounded-full w-4 h-4 flex items-center justify-center transition-colors -mr-1"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3 text-[#999999] hover:text-[#EEEEEE]" />
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
            placeholder="Add tag..."
            className="w-48 h-9 text-sm border border-[#2A2A2A] bg-[#1A1A1A] text-[#EEEEEE] focus:border-[#4A5560] focus:ring-2 focus:ring-[#4A5560]/20 transition-all placeholder:text-[#666666]"
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
            className="h-9 px-3 text-[#EEEEEE] hover:bg-[#1A1A1A]"
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
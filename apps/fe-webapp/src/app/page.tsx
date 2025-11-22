'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { GraphView } from '@/components/graph/GraphView';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { VoiceNoteRecorder } from '@/components/voice-note/VoiceNoteRecorder';
import { useNoteStore } from '@/stores/noteStore';
import { useNotes } from '@/hooks/useNotes';
import { APP_CONFIG, UI_MESSAGES } from '@/constants/config';
import { EMPTY_NOTE } from '@/data/mockData';

export default function Home() {
  const { viewMode, setViewMode, setCurrentNote, addNote, selectedPillar } = useNoteStore();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  useNotes();

  const handleNewNote = () => {
    const now = new Date().toISOString();
    const pillar = selectedPillar === 'all' ? APP_CONFIG.DEFAULT_PILLAR : selectedPillar;
    
    const newNote = {
      id: `note-${Date.now()}`,
      title: UI_MESSAGES.NEW_NOTE_TITLE,
      content: EMPTY_NOTE.content,
      tags: EMPTY_NOTE.tags,
      pillar,
      createdAt: now,
      updatedAt: now,
      linkedNotes: EMPTY_NOTE.linkedNotes,
      isFavorite: EMPTY_NOTE.isFavorite,
    };
    addNote(newNote);
    setCurrentNote(newNote);
    setViewMode('note');
  };

  const handleNewVoiceNote = () => {
    setShowVoiceRecorder(true);
  };

  const handleVoiceNoteSave = async (audioBlob: Blob, duration: number) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      const now = new Date().toISOString();
      const pillar = selectedPillar === 'all' ? APP_CONFIG.DEFAULT_PILLAR : selectedPillar;
      const formattedDuration = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
      const recordedDate = new Date().toLocaleString('es-ES');
      
      const audioContent = `# ${UI_MESSAGES.NEW_VOICE_NOTE_TITLE}\n\n<audio controls>\n  <source src="${base64Audio}" type="audio/webm">\n  Tu navegador no soporta el elemento de audio.\n</audio>\n\n*Duración: ${formattedDuration}*\n\n*Grabado el ${recordedDate}*`;
      
      const newNote = {
        id: `note-${Date.now()}`,
        title: `${UI_MESSAGES.NEW_VOICE_NOTE_TITLE} - ${new Date().toLocaleDateString('es-ES')}`,
        content: audioContent,
        tags: ['voz', 'audio'],
        pillar,
        createdAt: now,
        updatedAt: now,
        linkedNotes: [],
        isFavorite: false,
      };
      
      addNote(newNote);
      setCurrentNote(newNote);
      setViewMode('note');
      setShowVoiceRecorder(false);
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleVoiceNoteCancel = () => {
    setShowVoiceRecorder(false);
  };

  const renderMainContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return <Dashboard />;
      case 'graph':
        return <GraphView />;
      case 'note':
        return <NoteEditor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
        {renderMainContent()}
        {!showVoiceRecorder && (
          <FloatingActionButton
            onNewNote={handleNewNote}
            onNewVoiceNote={handleNewVoiceNote}
          />
        )}
        {showVoiceRecorder && (
          <VoiceNoteRecorder
            onSave={handleVoiceNoteSave}
            onCancel={handleVoiceNoteCancel}
          />
        )}
      </main>
    </div>
  );
}

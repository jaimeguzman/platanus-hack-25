import { useState } from 'react';
import { AppSidebar } from '@/components/sidebar/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { NoteEditor } from '@/components/editor/NoteEditor';
import GraphView from '@/components/graph/GraphView';
import { ChatView } from '@/components/chat/ChatView';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { VoiceNoteRecorder } from '@/components/voice-note/VoiceNoteRecorder';
import { useNoteStore } from '@/stores/noteStore';
import { useNotes } from '@/hooks/useNotes';
import { APP_CONFIG, UI_MESSAGES, FORMATTING, DEFAULT_TAGS, DEFAULT_VALUES, DEFAULT_MESSAGES } from '@/constants';
import { EMPTY_NOTE } from '@/data/mockData';
import { transcribeAudioDirect } from '@/services/transcriptionService';
import { useToast } from '@/hooks/use-toast';

export default function App() {
  useNotes();
  const { viewMode, setViewMode, setCurrentNote, addNote, selectedCategory } = useNoteStore();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

  const handleNewNote = () => {
    const now = new Date().toISOString();
    const pillar: "career" | "social" | "hobby" = selectedCategory === 'all' ? 'career' : selectedCategory as "career" | "social" | "hobby";

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
    try {
      setIsTranscribing(true);

      toast({
        title: "Transcribiendo audio...",
        description: "Por favor espera mientras procesamos tu nota de voz",
        duration: Infinity,
      });

      const pillar = selectedCategory === 'all' ? APP_CONFIG.DEFAULT_PILLAR : selectedCategory;

      const transcriptionResult = await transcribeAudioDirect(
        audioBlob,
        `voice-note-${Date.now()}.webm`,
        'voice-recorder'
      );

      const transcriptionText = transcriptionResult.transcription.text;
      const graphNodeData = transcriptionResult.graph_node;

      const now = new Date().toISOString();
      const formattedDuration = `${Math.floor(duration / FORMATTING.DURATION_MINUTES_PER_HOUR)}:${(duration % FORMATTING.DURATION_SECONDS_PER_MINUTE).toString().padStart(FORMATTING.DURATION_PAD_START, '0')}`;
      const recordedDate = new Date().toLocaleString(FORMATTING.DATE_LOCALE);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;

        const audioContent = `# ${UI_MESSAGES.NEW_VOICE_NOTE_TITLE}\n\n## Transcripción\n\n${transcriptionText}\n\n---\n\n## Audio Original\n\n<audio controls>\n  <source src="${base64Audio}" type="${DEFAULT_VALUES.AUDIO_MIME_TYPE}">\n  ${DEFAULT_MESSAGES.AUDIO_NOT_SUPPORTED}\n</audio>\n\n*Duración: ${formattedDuration}*\n\n*Grabado el ${recordedDate}*`;

        const newNote = {
          id: `note-${Date.now()}`,
          title: `${UI_MESSAGES.NEW_VOICE_NOTE_TITLE} - ${new Date().toLocaleDateString(FORMATTING.DATE_LOCALE)}`,
          content: audioContent,
          tags: DEFAULT_TAGS.VOICE_NOTE,
          pillar,
          createdAt: now,
          updatedAt: now,
          linkedNotes: [],
          isFavorite: false,
        };

        addNote(newNote);
        setCurrentNote(newNote);
        setShowVoiceRecorder(false);

        toast({
          title: "Agregando al grafo...",
          description: "Ubicando tu nota en el mapa de conocimiento",
          duration: Infinity,
        });

        const windowWithGraph = window as unknown as {
          pendingGraphNode?: typeof graphNodeData;
          focusPendingNode?: boolean;
          onNodeAdded?: () => void;
        };
        windowWithGraph.pendingGraphNode = graphNodeData;
        windowWithGraph.focusPendingNode = true;

        windowWithGraph.onNodeAdded = () => {
          setIsTranscribing(false);
          toast({
            title: "¡Listo!",
            description: "Tu nota de voz ha sido agregada al grafo",
          });
          delete windowWithGraph.onNodeAdded;
        };

        setViewMode('graph');
      };

      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Error al transcribir audio:', error);
      setIsTranscribing(false);

      toast({
        title: "Error al transcribir",
        description: error instanceof Error ? error.message : "Hubo un problema al procesar tu nota de voz",
        variant: "destructive",
      });
    }
  };

  const handleVoiceNoteCancel = () => {
    setShowVoiceRecorder(false);
  };

  const renderMainContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <ChatView />;
      case 'graph':
        return <GraphView />;
      case 'note':
        return <NoteEditor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 z-10 bg-background">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-hidden relative">
          {renderMainContent()}
          {showVoiceRecorder && (
            <VoiceNoteRecorder
              onSave={handleVoiceNoteSave}
              onCancel={handleVoiceNoteCancel}
            />
          )}
          {isTranscribing && !showVoiceRecorder && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-card p-6 rounded-lg shadow-lg border max-w-md text-center">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Procesando tu nota de voz</h3>
                <p className="text-sm text-muted-foreground">
                  Estamos agregando tu nota al grafo de conocimiento...
                </p>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
      {!showVoiceRecorder && !isTranscribing && viewMode !== 'chat' && (
        <FloatingActionButton
          onNewNote={handleNewNote}
          onNewVoiceNote={handleNewVoiceNote}
        />
      )}
    </SidebarProvider>
  );
}

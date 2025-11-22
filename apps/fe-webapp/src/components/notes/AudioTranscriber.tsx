'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import { Mic, Square, Upload, FileAudio, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { transcribeAudioDirect, type GraphNodeData } from '@/services/transcriptionService';

interface AudioTranscriberProps {
  onTranscriptionComplete?: () => void;
}

const AudioTranscriber: React.FC<AudioTranscriberProps> = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { addNote, setActiveNote } = usePKMStore();

  // Crear y limpiar URL del audio cuando cambia el blob
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioBlob]);

  const startRecording = async () => {
    try {
      // Clear previous recording when starting a new one
      setAudioBlob(null);
      setTranscription('');
      setSaved(false);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('No se pudo iniciar la grabación. Por favor verifica los permisos del micrófono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear previous state
      setTranscription('');
      setSaved(false);
      setError(null);
      setAudioBlob(file);
      // Reset input to allow uploading the same file again
      event.target.value = '';
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    setError(null);

    try {
      // Call the real transcription API
      const result = await transcribeAudioDirect(
        audioBlob,
        audioBlob instanceof File ? audioBlob.name : 'recording.wav'
      );

      // Extract the transcription text
      const transcriptionText = result.transcription.text || '';
      
      if (!transcriptionText.trim()) {
        throw new Error('La transcripción está vacía. Por favor intenta de nuevo.');
      }

      setTranscription(transcriptionText);
      
      // Store graph node data globally for graph view
      if (result.graph_node) {
        const windowWithGraph = window as unknown as { 
          addGraphNode?: (nodeData: GraphNodeData) => void;
          pendingGraphNode?: GraphNodeData;
        };
        windowWithGraph.pendingGraphNode = result.graph_node;
      }

      // Close the modal if callback is provided
      if (onTranscriptionComplete) {
        setTimeout(() => {
          onTranscriptionComplete();
        }, 500);
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al transcribir el audio';
      setError(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const saveAsNote = () => {
    if (transcription.trim()) {
      const noteId = addNote({
        title: `Nota de Audio - ${new Date().toLocaleDateString('es-ES')}`,
        content: transcription,
        tags: ['audio', 'transcripción'],
        projectId: undefined
      });

      setSaved(true);
      setTimeout(() => {
        // Reset form
        setAudioBlob(null);
        setTranscription('');
        setSaved(false);
        setActiveNote(noteId);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="flex items-center justify-center gap-2 px-5 py-2.5 h-auto bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
          >
            <Mic className="w-4 h-4" />
            <span>Iniciar Grabación</span>
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="flex items-center justify-center gap-2 px-5 py-2.5 h-auto bg-red-500 hover:bg-red-600 text-white font-medium transition-colors animate-pulse"
          >
            <Square className="w-4 h-4" />
            <span>Detener Grabación</span>
          </Button>
        )}

        <label className="flex items-center justify-center gap-2 px-5 py-2.5 h-auto bg-secondary hover:bg-accent rounded-md text-foreground cursor-pointer transition-colors font-medium border border-border">
          <Upload className="w-4 h-4" />
          <span>Subir Audio</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Audio Preview - Solo mostrar cuando hay audio Y no está grabando */}
      {audioBlob && audioUrl && !isRecording && (
        <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-violet-500" />
              <p className="text-sm font-medium text-foreground">Audio listo</p>
            </div>
            <p className="text-xs text-muted-foreground">{Math.round(audioBlob.size / 1024)} KB</p>
          </div>
          <audio controls className="w-full h-10" key={audioUrl}>
            <source src={audioUrl} type="audio/wav" />
          </audio>
          <Button
            onClick={transcribeAudio}
            disabled={isTranscribing}
            className="w-full px-5 py-2.5 h-auto bg-violet-600 hover:bg-violet-700 disabled:bg-muted disabled:text-muted-foreground text-white font-medium transition-colors"
          >
            {isTranscribing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Transcribiendo...
              </span>
            ) : (
              'Transcribir Audio'
            )}
          </Button>
        </div>
      )}

      {/* Transcription Result */}
      {transcription && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Transcripción</label>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="w-full min-h-[180px] p-4 bg-background border border-border rounded-lg text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-muted-foreground transition-all"
              placeholder="La transcripción aparecerá aquí..."
            />
          </div>
          <Button
            onClick={saveAsNote}
            disabled={saved}
            className="w-full px-5 py-2.5 h-auto bg-violet-600 hover:bg-violet-700 disabled:bg-green-600 text-white font-medium transition-colors"
          >
            {saved ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                ¡Nota guardada!
              </span>
            ) : (
              'Guardar como Nota'
            )}
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!audioBlob && !transcription && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Instrucciones:</span> Haz clic en "Iniciar Grabación" para grabar tu voz, o sube un archivo de audio existente. La transcripción se realizará usando IA y luego podrás editarla y guardarla como nota en tu base de conocimiento.
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioTranscriber;

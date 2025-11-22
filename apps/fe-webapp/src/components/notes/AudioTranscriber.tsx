'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import { Mic, Square, Upload, FileAudio, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saved, setSaved] = useState(false);
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
      // Limpiar grabación anterior al iniciar una nueva
      setAudioBlob(null);
      setTranscription('');
      setSaved(false);

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
      alert('No se pudo iniciar la grabación. Por favor verifica los permisos del micrófono.');
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
      // Limpiar estado anterior
      setTranscription('');
      setSaved(false);
      setAudioBlob(file);
      // Resetear el input para permitir subir el mismo archivo de nuevo
      event.target.value = '';
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);

    // Simulate transcription (in a real app, you'd call an AI API)
    setTimeout(() => {
      const mockTranscription = `Esta es una transcripción simulada de tu grabación de audio.

En una implementación real, esto usaría servicios de IA como:
- OpenAI Whisper API
- Google Cloud Speech-to-Text
- Azure Speech Services
- Web Speech API (nativo del navegador)

La transcripción capturaría tus pensamientos, ideas y notas que luego puedes organizar y conectar con otras notas en tu base de conocimiento.`;

      setTranscription(mockTranscription);
      setIsTranscribing(false);
    }, 2000);
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
            <span className="font-medium text-foreground">Instrucciones:</span> Haz clic en "Iniciar Grabación" para grabar tu voz, o sube un archivo de audio existente. Edita la transcripción y guárdala como nota para añadirla a tu base de conocimiento.
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioTranscriber;

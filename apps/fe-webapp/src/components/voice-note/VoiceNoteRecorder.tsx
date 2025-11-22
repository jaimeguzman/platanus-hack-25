'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UI_MESSAGES, FORMATTING, MEDIA_RECORDING, MEDIA_PLAYBACK } from '@/constants';

interface VoiceNoteRecorderProps {
  onSave: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceNoteRecorder({ onSave, onCancel }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Formatear duración en formato MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / FORMATTING.DURATION_MINUTES_PER_HOUR);
    const secs = Math.floor(seconds % FORMATTING.DURATION_SECONDS_PER_MINUTE);
    return `${mins.toString().padStart(FORMATTING.DURATION_PAD_START, '0')}:${secs.toString().padStart(FORMATTING.DURATION_PAD_START, '0')}`;
  };

  // Iniciar grabación
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_RECORDING.AUDIO_CONSTRAINTS);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > MEDIA_PLAYBACK.MIN_DATA_SIZE) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: MEDIA_RECORDING.AUDIO_MIME_TYPE });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Actualizar duración cada segundo
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, MEDIA_RECORDING.DURATION_UPDATE_INTERVAL);
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // Reproducir audio grabado
  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Guardar nota de voz
  const handleSave = () => {
    if (audioBlob) {
      onSave(audioBlob, duration);
    }
  };

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl, isRecording]);

  return (
    <Card className="fixed inset-4 z-50 flex flex-col max-w-md mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-6 gap-4 h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Grabar Nota de Voz</h3>
          <p className="text-sm text-muted-foreground">
            {isRecording ? UI_MESSAGES.RECORDING : audioBlob ? UI_MESSAGES.AUDIO_RECORDED : UI_MESSAGES.PRESS_TO_START}
          </p>
        </div>

        {/* Indicador de duración */}
        <div className="text-3xl font-mono font-bold">
          {formatDuration(duration)}
        </div>

        {/* Botones de control */}
        <div className="flex gap-3 items-center">
          {!audioBlob ? (
            <>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="h-16 w-16 rounded-full"
                  variant="default"
                >
                  <Mic className="h-8 w-8" />
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="h-16 w-16 rounded-full"
                  variant="destructive"
                >
                  <Square className="h-8 w-8" />
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={playAudio}
                size="lg"
                variant="outline"
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                onClick={handleSave}
                size="lg"
                variant="default"
                className="h-12 w-12 rounded-full"
              >
                <Check className="h-6 w-6" />
              </Button>
            </>
          )}
          <Button
            onClick={onCancel}
            size="lg"
            variant="outline"
            className="h-12 w-12 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Audio element para reproducción */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </CardContent>
    </Card>
  );
}


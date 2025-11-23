'use client';

import { Send, X, Trash2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useEffect, useState, useRef } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Uint8Array, fileName: string, duration: number, blobUrl: string) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const { recordingDuration, startRecording, stopRecording, cancelRecording } = useAudioRecorder();
  const [dragOffset, setDragOffset] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<number>(0); // Ref para evitar stale closure

  const CANCEL_THRESHOLD = -200;

  // Iniciar grabación cuando el componente se monta
  useEffect(() => {
    let mounted = true;

    const initRecording = async () => {
      try {
        await startRecording();
        if (mounted) {
          setIsReady(true);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error starting recording:', error);
          alert('No se pudo acceder al micrófono. Por favor verifica los permisos.');
          onCancel();
        }
      }
    };

    initRecording();

    // Cleanup al desmontar
    return () => {
      mounted = false;
      cancelRecording();
    };
  }, [startRecording, cancelRecording, onCancel]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    try {
      dragOffsetRef.current = 0;
      const result = await stopRecording();
      onRecordingComplete(
        result.audioData,
        result.fileName,
        result.duration,
        result.blobUrl
      );
    } catch (error) {
      console.error('Error stopping recording:', error);
      onCancel();
    }
  };

  const handleCancel = async () => {
    dragOffsetRef.current = 0;
    await cancelRecording();
    onCancel();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;

    const handleMouseMove = (e: MouseEvent) => {
      const offset = e.clientX - startX;
      const clampedOffset = Math.min(0, offset);
      dragOffsetRef.current = clampedOffset; // Actualizar ref
      setDragOffset(clampedOffset);
      setIsCancelling(offset < CANCEL_THRESHOLD);
    };

    const handleMouseUp = () => {
      // Usar el ref para obtener el valor actual, no el stale del closure
      const shouldCancel = dragOffsetRef.current < CANCEL_THRESHOLD;
      
      if (shouldCancel) {
        handleCancel();
      } else {
        dragOffsetRef.current = 0;
        setDragOffset(0);
        setIsCancelling(false);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const cancelProgress = Math.min(1, Math.abs(dragOffset) / Math.abs(CANCEL_THRESHOLD));

  // Mostrar loading mientras se inicializa
  if (!isReady) {
    return (
      <div className="flex items-center justify-center gap-3 p-3 rounded-3xl bg-gray-100">
        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-sm text-gray-600">Iniciando grabación...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-3 p-3 rounded-3xl transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
      style={{
        background: `linear-gradient(90deg,
          rgba(239, 68, 68, ${0.1 + cancelProgress * 0.2}),
          rgba(239, 68, 68, ${0.05 + cancelProgress * 0.1}))`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `rgba(239, 68, 68, ${0.2 + cancelProgress * 0.8})`,
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        onClick={handleCancel}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer"
        style={{
          backgroundColor: `rgba(239, 68, 68, ${0.1 + cancelProgress * 0.9})`,
          color: cancelProgress > 0.5 ? 'white' : 'rgb(239, 68, 68)',
        }}
      >
        {isCancelling ? <X className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
      </button>

      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-sm font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
          {formatDuration(recordingDuration)}
        </span>
      </div>

      <div
        className="flex-1 flex items-center justify-center gap-2 transition-all duration-150"
        style={{
          opacity: isCancelling ? 0 : 1 - cancelProgress * 0.5,
          transform: `translateX(${dragOffset * 0.3}px)`
        }}
      >
        <div className="flex items-center gap-2 bg-gray-200/60 px-3 py-1 rounded-full">
          <span className="text-xs text-gray-600 font-medium">Desliza para cancelar</span>
          <span className="text-gray-500 animate-pulse">←←</span>
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={isCancelling}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-all duration-150 shadow-lg cursor-pointer"
        style={{
          transform: `scale(${isCancelling ? 0.8 : 1})`,
        }}
      >
        <Send className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
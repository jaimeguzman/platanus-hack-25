'use client';

import { useState, useRef, useCallback } from 'react';

export interface RecordingResult {
  audioData: Uint8Array;
  duration: number;
  blobUrl: string;
  fileName: string;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });

      // Intentar usar opus si está disponible
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Recoger datos cada 100ms
      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Timer para actualizar duración
      timerRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - startTimeRef.current);
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('No se pudo acceder al micrófono');
    }
  }, []);

  const stopRecording = useCallback((): Promise<RecordingResult> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No hay grabación activa'));
        return;
      }

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - startTimeRef.current;
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // Crear blob URL para reproducción
        const blobUrl = URL.createObjectURL(blob);
        
        console.log('🎙️ Recording stopped:', {
          mimeType,
          blobSize: blob.size,
          blobUrl,
          chunks: chunksRef.current.length,
          duration
        });
        
        // Convertir a Uint8Array
        const arrayBuffer = await blob.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);
        
        const fileName = `recording_${Date.now()}.webm`;
        
        // Limpiar
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setIsRecording(false);
        setRecordingDuration(0);
        
        resolve({
          audioData,
          duration,
          blobUrl,
          fileName
        });
      };

      mediaRecorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    chunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}


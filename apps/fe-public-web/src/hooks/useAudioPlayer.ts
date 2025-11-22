'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimeUpdates = useCallback(() => {
    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Actualizar cada 50ms para animación fluida
    intervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
          setDuration(audioRef.current.duration);
        }
      }
    }, 50);
  }, []);

  const stopTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(async (messageId: string, audioSrc: string) => {
    try {
      console.log('▶️ Play called:', { messageId, audioSrc: audioSrc.substring(0, 50) + '...' });

      // Si es el mismo audio y está pausado, resumir
      if (currentPlayingId === messageId && audioRef.current && audioRef.current.paused) {
        console.log('▶️ Resuming paused audio');
        await audioRef.current.play();
        setIsPlaying(true);
        startTimeUpdates();
        return;
      }

      // Si hay otro audio reproduciéndose, detenerlo
      if (audioRef.current) {
        console.log('▶️ Stopping previous audio');
        audioRef.current.pause();
        audioRef.current.src = '';
        stopTimeUpdates();
      }

      // Crear nuevo audio element
      console.log('▶️ Creating new Audio element');
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      setCurrentPlayingId(messageId);
      setCurrentTime(0);

      audio.onloadedmetadata = () => {
        console.log('▶️ Metadata loaded, duration:', audio.duration);
        setDuration(audio.duration);
      };

      audio.onended = () => {
        console.log('▶️ Audio ended');
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentPlayingId(null);
        stopTimeUpdates();
      };

      audio.onerror = (e) => {
        console.error('▶️ Audio error event:', e);
        console.error('▶️ Audio error details:', {
          error: audio.error,
          src: audio.src,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        setIsPlaying(false);
        setCurrentPlayingId(null);
        stopTimeUpdates();
      };

      console.log('▶️ Attempting to play...');
      await audio.play();
      console.log('▶️ Play successful!');
      setIsPlaying(true);
      startTimeUpdates();
    } catch (error) {
      console.error('▶️ Error playing audio:', error);
      setIsPlaying(false);
      setCurrentPlayingId(null);
      stopTimeUpdates();
    }
  }, [currentPlayingId, startTimeUpdates, stopTimeUpdates]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopTimeUpdates();
    }
  }, [stopTimeUpdates]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentPlayingId(null);
      stopTimeUpdates();
    }
  }, [stopTimeUpdates]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      stopTimeUpdates();
    };
  }, [stopTimeUpdates]);

  return {
    isPlaying,
    currentTime,
    duration,
    currentPlayingId,
    play,
    pause,
    stop,
    seek,
  };
}


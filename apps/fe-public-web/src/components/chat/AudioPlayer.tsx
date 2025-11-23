'use client';

import { Play, Pause } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Message } from '@/types/chat';
import { useEffect, useState } from 'react';

interface AudioPlayerProps {
  message: Message;
}

export function AudioPlayer({ message }: AudioPlayerProps) {
  const { isPlaying, currentTime, duration, currentPlayingId, play, pause } = useAudioPlayer();
  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    // Usar el blob URL si está disponible, sino crear uno desde los datos
    if (message.audioBlobUrl) {
      console.log('🔊 Using cached blob URL:', message.audioBlobUrl);
      setAudioUrl(message.audioBlobUrl);
    } else if (message.audioData) {
      // Usar el mimeType del mensaje o defaultear a webm
      const mimeType = message.audioMimeType || 'audio/webm';
      console.log('🔊 Creating new blob URL from data:', {
        mimeType,
        dataSize: message.audioData.length
      });
      const blob = new Blob([new Uint8Array(message.audioData)], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      return () => {
        console.log('🔊 Revoking blob URL:', url);
        URL.revokeObjectURL(url);
      };
    }
  }, [message.audioData, message.audioBlobUrl, message.audioMimeType]);

  const isThisPlaying = currentPlayingId === message.id && isPlaying;
  const isThisMessage = currentPlayingId === message.id;

  // El progreso solo aplica si este es el mensaje actual reproduciéndose
  const progress = isThisMessage && duration > 0 ? (currentTime / duration) * 100 : 0;

  const messageDuration = message.audioDuration ? message.audioDuration / 1000 : duration;
  const displayTime = isThisMessage ? currentTime : 0;

  const handlePlayPause = () => {
    if (!audioUrl) {
      console.error('🔊 No audio URL available');
      return;
    }
    
    console.log('🔊 Play/Pause clicked:', {
      messageId: message.id,
      audioUrl,
      isThisPlaying,
      audioMimeType: message.audioMimeType
    });
    
    if (isThisPlaying) {
      pause();
    } else {
      play(message.id, audioUrl);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={handlePlayPause}
        className="shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center cursor-pointer"
      >
        {isThisPlaying ? (
          <Pause className="w-5 h-5" fill="currentColor" />
        ) : (
          <Play className="w-5 h-5" fill="currentColor" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-white rounded-full"
            style={{
              width: `${progress}%`,
              transition: isThisPlaying ? 'width 0.1s linear' : 'width 0.3s ease-out'
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-xs opacity-80 font-mono">
            {isThisMessage ? formatTime(displayTime) : '0:00'}
          </span>
          <span className="text-xs opacity-80 font-mono">
            {formatTime(messageDuration || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
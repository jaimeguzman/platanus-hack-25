'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Loader2 } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendAudio: (audioData: Uint8Array, fileName: string, duration: number, blobUrl: string, mimeType?: string) => void;
}

export function ChatInput({ onSendText, onSendAudio }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSendText = () => {
    const trimmedText = text.trim();
    if (trimmedText) {
      onSendText(trimmedText);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleRecordingComplete = (
    audioData: Uint8Array,
    fileName: string,
    duration: number,
    blobUrl: string
  ) => {
    setIsRecording(false);
    console.log('🎤 Recording complete:', {
      fileName,
      duration,
      blobUrl,
      dataSize: audioData.length
    });
    // Las grabaciones son siempre webm con opus
    onSendAudio(audioData, fileName, duration, blobUrl, 'audio/webm;codecs=opus');
  };

  const handleRecordingCancel = () => {
    setIsRecording(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Por favor selecciona un archivo de audio válido');
      return;
    }

    setIsProcessingFile(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);
      
      // Crear blob URL para el audio (NO se revoca para permitir reproducción)
      const blob = new Blob([audioData], { type: file.type });
      const blobUrl = URL.createObjectURL(blob);
      
      // Obtener duración del audio
      const audio = new Audio();
      audio.src = blobUrl;
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration * 1000; // convertir a ms
        onSendAudio(audioData, file.name, duration, blobUrl, file.type);
        setIsProcessingFile(false);
        // NO revocamos el blob URL aquí porque se necesita para reproducción
      };

      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        setIsProcessingFile(false);
        alert('Error al cargar el archivo de audio');
      };
    } catch (error) {
      console.error('Error loading audio file:', error);
      setIsProcessingFile(false);
      alert('Error al procesar el archivo de audio');
    }

    // Reset input
    e.target.value = '';
  };

  if (isRecording) {
    return (
      <div className="p-2">
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={handleRecordingCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-2 bg-white border-t border-gray-200">
      {/* Processing file indicator */}
      {isProcessingFile && (
        <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Procesando archivo de audio...</span>
          </div>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessingFile}
          className="flex-shrink-0 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isProcessingFile ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex-1 bg-gray-100 rounded-3xl px-4 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="w-full bg-transparent border-none outline-none resize-none max-h-[120px] text-gray-800 placeholder-gray-500"
            rows={1}
          />
        </div>

        {text.trim() ? (
          <button
            onClick={handleSendText}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors shadow-lg cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleStartRecording}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors shadow-lg cursor-pointer"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
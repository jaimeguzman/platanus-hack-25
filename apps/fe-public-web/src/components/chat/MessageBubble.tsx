'use client';

import { Message, MessageStatus, MessageType } from '@/types/chat';
import { AudioPlayer } from './AudioPlayer';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderStatusIcon = () => {
    switch (message.status) {
      case MessageStatus.Sending:
        return <Clock className="w-3.5 h-3.5 opacity-70" />;
      case MessageStatus.Sent:
        return <Check className="w-3.5 h-3.5 opacity-70" />;
      case MessageStatus.Error:
        return (
          <button
            onClick={() => onRetry?.(message.id)}
            className="hover:opacity-80 transition-opacity"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          </button>
        );
    }
  };

  return (
    <div className="flex justify-end px-4 py-1 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-br-sm p-3 shadow-md animate-in zoom-in-95 duration-200">
        {message.type === MessageType.Text ? (
          <p className="text-base whitespace-pre-wrap break-words">{message.text}</p>
        ) : (
          <AudioPlayer message={message} />
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">
            {formatTime(message.timestamp)}
          </span>
          {renderStatusIcon()}
        </div>
      </div>
    </div>
  );
}


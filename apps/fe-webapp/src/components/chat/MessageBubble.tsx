'use client';

import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';
import { User, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-violet-500 text-white'
            : 'bg-muted text-foreground'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isUser ? (
            <p className="m-0">{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}


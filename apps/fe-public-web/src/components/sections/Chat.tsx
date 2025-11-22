'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Message } from '@/types/chat';
import { MessageBubble } from '../chat/MessageBubble';
import { ChatInput } from '../chat/ChatInput';
import chatService from '@/services/chatService';

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Setup callback to update messages when they change
  useEffect(() => {
    const updateMessages = () => {
      setMessages(chatService.getMessages());
      scrollToBottom();
    };
    
    chatService.setOnMessagesChange(updateMessages);
    
    // Cleanup
    return () => {
      chatService.setOnMessagesChange(() => {});
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendText = async (text: string) => {
    await chatService.sendTextMessage(text);
    scrollToBottom();
  };

  const handleSendAudio = async (
    audioData: Uint8Array,
    fileName: string,
    duration: number,
    blobUrl: string,
    mimeType?: string
  ) => {
    // Start the process - the callback will update the UI as states change
    chatService.sendAudioMessage(audioData, fileName, duration, blobUrl, mimeType);
    scrollToBottom();
  };

  const handleRetry = async (messageId: string) => {
    await chatService.retryMessage(messageId);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  return (
    <section id="chat" className="relative z-10 py-20 px-4 bg-linear-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Prueba SecondBrain ahora
          </h2>
          <p className="text-xl text-gray-600">
            Envía mensajes de texto o audio y ve cómo SecondBrain te ayuda
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-center">
            <h3 className="text-lg font-semibold">SecondBrain</h3>
          </div>

          {/* Messages area */}
          <div
            ref={scrollContainerRef}
            className="h-[500px] overflow-y-auto bg-gray-50"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle className="w-20 h-20 text-blue-600 opacity-50 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  ¡Bienvenido!
                </h3>
                <p className="text-gray-600 mb-8">
                  Envía un mensaje de texto o audio para comenzar
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                    <span>💬</span>
                    <span>Texto</span>
                  </div>
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                    <span>🎤</span>
                    <span>Grabar audio</span>
                  </div>
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                    <span>📎</span>
                    <span>Adjuntar audio</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-2">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onRetry={handleRetry}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Input area */}
          <ChatInput
            onSendText={handleSendText}
            onSendAudio={handleSendAudio}
          />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Los mensajes se procesan localmente y se preparan para enviar al API</p>
          <p className="mt-1">Revisa la consola del navegador para ver el payload generado</p>
        </div>
      </div>
    </section>
  );
}


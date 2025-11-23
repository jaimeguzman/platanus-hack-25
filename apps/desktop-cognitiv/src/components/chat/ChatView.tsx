import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { MiniGraph } from '@/components/chat/MiniGraph';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Brain, Trash2, Sparkles } from 'lucide-react';

interface NodeFamily {
  parentId: number;
  neighborIds: number[];
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [highlightedMemoryIds, setHighlightedMemoryIds] = useState<number[]>([]);
  const [nodeFamilies, setNodeFamilies] = useState<NodeFamily[]>([]);
  const [originalSearchNodes, setOriginalSearchNodes] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat-history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: ChatMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleClearHistory = () => {
    if (confirm('¿Estás seguro de que quieres limpiar el historial del chat?')) {
      setMessages([]);
      setStreamingMessage('');
      setHighlightedMemoryIds([]);
      setNodeFamilies([]);
      setOriginalSearchNodes([]);
      localStorage.removeItem('chat-history');
    }
  };

  const handleSendMessage = async (content: string) => {
    // Check if this is an expand-only request
    const isExpandOnly = content.startsWith('[EXPAND_ONLY]');
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: isExpandOnly ? 'Explorar ideas relacionadas' : content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingMessage('');
    // Don't clear highlights here - they'll be updated when new metadata arrives

    try {
      // Prepare conversation history (exclude the current message)
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          history,
          activeMemoryIds: highlightedMemoryIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedText = '';
      let memoryIds: number[] = isExpandOnly ? highlightedMemoryIds : [];
      let newFamilies: NodeFamily[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Split by newlines in case multiple JSON objects come together
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            
            if (parsed.type === 'metadata' && parsed.memoryIds) {
              // Received memory IDs, highlight them in the graph
              // Only update if not expand-only
              if (!isExpandOnly) {
                memoryIds = parsed.memoryIds;
                console.log('Received memory IDs from API:', memoryIds);
                setHighlightedMemoryIds(memoryIds);
                // These are the original search nodes - store them for color assignment
                setOriginalSearchNodes(memoryIds);
              }
            } else if (parsed.type === 'text' && parsed.content) {
              // Received text chunk
              accumulatedText += parsed.content;
              setStreamingMessage(accumulatedText);
            } else if (parsed.type === 'expand' && parsed.expandedNodes) {
              // Received expanded nodes from function calling
              console.log('Received expanded nodes:', parsed.expandedNodes);
              newFamilies = parsed.expandedNodes.map((node: { parentId: number; neighbors: number[] }) => ({
                parentId: node.parentId,
                neighborIds: node.neighbors,
              }));
              
              // Add all new neighbor IDs to highlighted nodes
              const allNeighborIds = newFamilies.flatMap(f => f.neighborIds);
              const combinedIds = [...memoryIds, ...allNeighborIds];
              setHighlightedMemoryIds(combinedIds);
              setNodeFamilies(newFamilies);
            }
          } catch {
            // If it's not JSON, treat it as plain text (backward compatibility)
            accumulatedText += line;
            setStreamingMessage(accumulatedText);
          }
        }
      }

      // Save the complete assistant message
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: accumulatedText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessage('');
      setIsStreaming(false);
      
      // Keep nodes highlighted (don't clear)
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingMessage('');
      setIsStreaming(false);
      setHighlightedMemoryIds([]);
      setNodeFamilies([]);
      setOriginalSearchNodes([]);
    }
  };

  const handleExploreAdjacent = () => {
    // Create a special message that triggers expansion without RAG search
    const message = '[EXPAND_ONLY] Explorar nodos adyacentes';
    handleSendMessage(message);
  };

  return (
    <div className="flex max-h-[calc(100vh-64px)] h-full">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">SecondBrain Chat</h2>
              <p className="text-xs text-muted-foreground">
                Pregúntame sobre tu conocimiento almacenado
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              title="Limpiar historial"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col" ref={scrollRef}>
              {messages.length === 0 && !streamingMessage && (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                  <Brain className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    ¡Bienvenido a tu Segundo Cerebro!
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Pregúntame cualquier cosa sobre tu conocimiento almacenado. 
                    Buscaré en tus notas y memorias para darte la mejor respuesta.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {streamingMessage && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingMessage,
                    timestamp: new Date(),
                  }}
                  isStreaming={true}
                />
              )}
              
              {/* Invisible element at the end for scrolling */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="border-t bg-background">
          {highlightedMemoryIds.length > 0 && !isStreaming && (
            <div className="px-4 pt-3 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExploreAdjacent}
                className="w-full justify-start gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Explorar ideas relacionadas ({highlightedMemoryIds.length} nodos activos)
              </Button>
            </div>
          )}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? 'Esperando respuesta...'
                : 'Escribe tu pregunta...'
            }
          />
        </div>
      </div>

      {/* Mini Graph Sidebar */}
      <div className="w-[500px] border-l bg-background p-4 flex flex-col">
        <div className="mb-3">
          <h3 className="text-sm font-semibold mb-1">Grafo de Memoria</h3>
          <p className="text-xs text-muted-foreground">
            Los nodos resaltados son las memorias usadas en la respuesta
          </p>
        </div>
        <MiniGraph 
          highlightedNodeIds={highlightedMemoryIds}
          nodeFamilies={nodeFamilies}
          originalSearchNodes={originalSearchNodes}
          className="flex-1"
        />
      </div>
    </div>
  );
}


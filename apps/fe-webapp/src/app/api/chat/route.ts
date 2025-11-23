import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export const runtime = 'edge';

/**
 * POST /api/chat
 * Chat endpoint with RAG context and streaming response
 */
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { message, history = [] } = body as { 
      message: string; 
      history?: Message[] 
    };

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Retrieve relevant memories from RAG
    const params = new URLSearchParams({
      query: message,
      limit: '5',
    });

    const ragResponse = await fetch(`${RAG_API_URL}/search?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!ragResponse.ok) {
      const errorText = await ragResponse.text();
      console.error('RAG search error:', errorText);
      // Continue without context if RAG fails
    }

    let context = 'No context available.';
    let topResults: Array<{
      memory: { id: number; text: string; category?: string; source?: string };
      similarity_score: number;
    }> = [];
    
    if (ragResponse.ok) {
      const searchResults = (await ragResponse.json()) as Array<{
        memory: { id: number; text: string; category?: string; source?: string };
        similarity_score: number;
      }>;

      // Take top 3 most relevant memories
      topResults = searchResults.slice(0, 3);
      context = topResults
        .map((r) => `- [Memory ID ${r.memory.id}] ${r.memory.text.slice(0, 600)}`)
        .join('\n');
    }

    // Step 2: Build conversation history
    const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Add previous messages from history
    history.forEach((msg: Message) => {
      conversationMessages.push({
        role: msg.role,
        content: msg.content,
      });
    });
    
    // Add current message with context
    conversationMessages.push({
      role: 'user',
      content:
        `User Question:\n${message}\n\n` +
        `Available Context from Memory:\n${context}\n\n` +
        `Include brief source citations when relevant.`,
    });

    // Step 3: Stream the answer using Claude
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: [
        'You are SecondBrain, the user\'s digital second brain and personal knowledge assistant.',
        'Your role: Answer questions using the provided context from their stored memories and previous conversation.',
        '',
        'Rules:',
        '- Language: Neutral Spanish. Clear, professional yet friendly tone.',
        '- Style: Brief (2-5 sentences), direct. Use bullet points for steps if needed.',
        '- Never invent information. If context is insufficient, say so and suggest: "¿Quieres que lo guarde como nota?"',
        '- When applicable, mention relationships or connections detected in the context.',
        '- When appropriate, include brief source mentions in parentheses (e.g., memory ID or excerpt).',
        '- Respect privacy: do not use external data or assume information not in context.',
        '- Maintain conversation continuity: reference previous messages when relevant.',
        '- If asked about previous messages, use the conversation history to answer.',
      ].join('\n'),
      messages: conversationMessages,
      temperature: 0.6,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // First, send the memory IDs being used
          const memoryIds = topResults.map(r => r.memory.id);
          const metadataChunk = JSON.stringify({ type: 'metadata', memoryIds }) + '\n';
          controller.enqueue(encoder.encode(metadataChunk));

          // Then stream the text response
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text;
              const textChunk = JSON.stringify({ type: 'text', content: text }) + '\n';
              controller.enqueue(encoder.encode(textChunk));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}


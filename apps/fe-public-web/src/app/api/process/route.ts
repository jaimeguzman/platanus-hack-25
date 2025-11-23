import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type ProcessRequest = {
  text: string;
  category?: string | null;
  source?: string | null;
};

const RAG_API_URL =
  process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';

  const CATEGORIES =[
  "Salud",
  "Ejercicio y Deporte",
  "Trabajo / Laboral",
  "Estudios / Aprendizaje",
  "Finanzas",
  "Relaciones Amorosas",
  "Familia",
  "Amistades",
  "Vida Social",
  "Hogar y Organización",
  "Alimentación",
  "Estado de Ánimo / Emociones",
  "Proyectos Personales",
  "Viajes",
  "Hobbies",
  "Crecimiento Personal",
  "Tecnología / Gadgets",
  "Creatividad / Arte",
  "Espiritualidad",
  "Eventos Importantes",
  "Metas y Hábitos",
  "Sueño",
  "Mascotas",
  "Compras",
  "Tiempo Libre / Entretenimiento"
] as const;
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProcessRequest;
    const text = (body.text || '').trim();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on server' },
        { status: 500 },
      );
    }

    const url = new URL(req.url);
    const wantStream =
      url.searchParams.get('stream') === '1' ||
      url.searchParams.get('stream') === 'true';

    // Define tools for function calling
    const tools = {
      save_memory: {
        description:
          'Use this function when the user wants to save information to their second brain. ' +
          'This includes personal experiences, learnings, memories, notes, or any content they want to remember. ' +
          'Examples: "Remember that...", "Save this note...", "I learned today that..."',
        parameters: z.object({
          category: z.enum(CATEGORIES).describe('The category this memory belongs to. Must be one of the predefined categories.'),
          source: z.enum(['chat', 'voice_note', 'conversation']).describe('The source of this memory. Must be one of the predefined sources.'),
        }),
      },
      answer_question: {
        description:
          'Use this function when the user is asking a question or requesting information from their second brain. ' +
          'This retrieves relevant memories using RAG and constructs an answer based on stored context. ' +
          'Examples: "What did I learn about...?", "Tell me about...", "Do I have notes on...?"',
        parameters: z.object({
          needs_citation: z.boolean().describe('Whether to include source citations in the answer'),
        }),
      },
    } as const;

    // Step 1: Use GPT function calling to determine intent
    const { toolCalls } = await generateText({
      model: openai('gpt-4o-mini'),
      system: [
        'You are an intent router for SecondBrain, a personal knowledge management system.',
        'Your job is to determine if the user wants to:',
        '1. SAVE information to their memory (save_memory)',
        '2. QUERY/ASK about information in their memory (answer_question)',
        '',
        'Decision criteria:',
        '- Use save_memory when user explicitly wants to store/remember/save information',
        '- Use answer_question when user asks questions or wants to retrieve information',
        '- Default to answer_question for conversational queries',
        '',
        'You must choose exactly ONE tool. Provide appropriate arguments for the chosen tool.',
      ].join('\n'),
      prompt: text,
      tools,
      toolChoice: 'required',
      temperature: 0.4,
    });

    // Step 2: Execute the chosen tool
    const call = toolCalls[0] as
      | { toolName: 'save_memory'; args: { category: string; source: string } }
      | { toolName: 'answer_question'; args: { needs_citation: boolean } }
      | undefined;

    if (!call) {
      return NextResponse.json(
        { error: 'No tool was selected by the model' },
        { status: 500 },
      );
    }

    // Execute save_memory
    if (call.toolName === 'save_memory') {
      const memory = await saveMemory({
        text,
        category: call.args?.category || body.category || 'general',
        source: call.args?.source || body.source || 'web_chat',
      });
      
      return NextResponse.json({
        action: 'saved',
        intent: 'save',
        message: '✓ Memoria guardada exitosamente',
        memory,
      });
    }

    // Execute answer_question
    if (call.toolName === 'answer_question') {
      const needsCitation = call.args?.needs_citation ?? false;
      
      if (wantStream) {
        return streamAnswerWithRag({
          text,
          category: body.category || undefined,
          needsCitation,
        });
      } else {
        const { results, answer } = await answerWithRag({
          text,
          category: body.category || undefined,
          needsCitation,
        });
        
        return NextResponse.json({
          action: 'answered',
          intent: 'ask',
          answer,
          sources: results,
        });
      }
    }

    // Fallback (should not reach here)
    return NextResponse.json(
      { error: 'Unknown tool selected' },
      { status: 500 },
    );
    
  } catch (err) {
    console.error('process route error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Stream answer using RAG context
 * Step 1: Retrieve relevant memories from RAG
 * Step 2: Stream answer generation using retrieved context
 */
function streamAnswerWithRag(input: {
  text: string;
  category?: string;
  needsCitation?: boolean;
}) {
  return (async () => {
    // Step 1: Retrieve relevant memories from RAG
    const params = new URLSearchParams({
      query: input.text,
      limit: '5',
    });
    if (input.category) params.set('category', input.category);
    
    const res = await fetch(`${RAG_API_URL}/search?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`RAG /search error: ${res.status} - ${t}`);
    }
    
    const search = (await res.json()) as Array<{
      memory: { id: number; text: string; category?: string; source?: string };
      similarity_score: number;
    }>;
    
    // Take top 3 most relevant memories
    const top = search.slice(0, 3);
    const context = top
      .map((r) => `- [Memory ID ${r.memory.id}] ${r.memory.text.slice(0, 600)}`)
      .join('\n');

    // Step 2: Stream the answer using retrieved context
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: [
        'You are SecondBrain, the user\'s digital second brain and personal knowledge assistant.',
        'Your role: Answer questions using ONLY the provided context from their stored memories.',
        '',
        'Rules:',
        '- Language: Neutral Spanish. Clear, professional yet friendly tone.',
        '- Style: Brief (2-4 sentences), direct. Use bullet points for steps if needed.',
        '- Never invent information. If context is insufficient, say so and suggest: "¿Quieres que lo guarde como nota?"',
        '- When applicable, mention relationships or connections detected in the context.',
        '- When appropriate, include brief source mentions in parentheses (e.g., memory ID or excerpt).',
        '- Respect privacy: do not use external data or assume information not in context.',
      ].join('\n'),
      prompt:
        `User Question:\n${input.text}\n\n` +
        `Available Context from Memory:\n${context || 'No context available.'}\n\n` +
        `${input.needsCitation ? 'Include brief source citations.' : ''}`,
      temperature: 0.6,
    });
    
    // Return text stream for clean client display
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  })();
}

/**
 * Save memory to RAG system
 */
async function saveMemory(input: {
  text: string;
  category?: string;
  source?: string;
}) {
  const res = await fetch(`${RAG_API_URL}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: input.text,
      category: input.category,
      source: input.source,
    }),
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`RAG /memories error: ${res.status} - ${t}`);
  }
  
  return await res.json();
}

/**
 * Answer question using RAG (non-streaming)
 * Step 1: Retrieve relevant memories
 * Step 2: Generate answer using context
 */
async function answerWithRag(input: {
  text: string;
  category?: string;
  needsCitation?: boolean;
}) {
  // Step 1: Retrieve relevant memories from RAG
  const params = new URLSearchParams({
    query: input.text,
    limit: '5',
  });
  if (input.category) params.set('category', input.category);
  
  const res = await fetch(`${RAG_API_URL}/search?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`RAG /search error: ${res.status} - ${t}`);
  }
  
  const search = (await res.json()) as Array<{
    memory: { id: number; text: string; category?: string; source?: string };
    similarity_score: number;
  }>;

  // Take top 3 most relevant memories
  const top = search.slice(0, 3);
  const context = top
    .map((r) => `- [Memory ID ${r.memory.id}] ${r.memory.text.slice(0, 600)}`)
    .join('\n');

  // Step 2: Generate answer using retrieved context
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: [
      'You are SecondBrain, the user\'s digital second brain and personal knowledge assistant.',
      'Your role: Answer questions using ONLY the provided context from their stored memories.',
      '',
      'Rules:',
      '- Language: Neutral Spanish. Clear, professional yet friendly tone.',
      '- Style: Brief (2-4 sentences), direct. Use bullet points for steps if needed.',
      '- Never invent information. If context is insufficient, say so and suggest: "¿Quieres que lo guarde como nota?"',
      '- When applicable, mention relationships or connections detected in the context.',
      '- When appropriate, include brief source mentions in parentheses (e.g., memory ID or excerpt).',
      '- Respect privacy: do not use external data or assume information not in context.',
    ].join('\n'),
    prompt:
      `User Question:\n${input.text}\n\n` +
      `Available Context from Memory:\n${context || 'No context available.'}\n\n` +
      `${input.needsCitation ? 'Include brief source citations.' : ''}`,
    temperature: 0.6,
  });

  return {
    results: search.map((r) => ({
      memory: r.memory,
      similarity_score: r.similarity_score,
    })),
    answer: text,
  };
}



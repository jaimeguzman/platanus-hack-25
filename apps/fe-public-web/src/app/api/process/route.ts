import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

type ProcessRequest = {
  text: string;
  category?: string | null;
  source?: string | null;
};

const RAG_API_URL =
  process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';

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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured on server' },
        { status: 500 },
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const url = new URL(req.url);
    const wantStream =
      url.searchParams.get('stream') === '1' ||
      url.searchParams.get('stream') === 'true';

    // Define tools for function calling (Claude format)
    const tools: Anthropic.Tool[] = [
      {
        name: 'save_memory',
        description:
          'Use this function when the user wants to save information to their second brain. ' +
          'This includes personal experiences, learnings, memories, notes, or any content they want to remember. ' +
          'Examples: "Remember that...", "Save this note...", "I learned today that..."',
        input_schema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'answer_question',
        description:
          'Use this function when the user is asking a question or requesting information from their second brain. ' +
          'This retrieves relevant memories using RAG and constructs an answer based on stored context. ' +
          'Examples: "What did I learn about...?", "Tell me about...", "Do I have notes on...?"',
        input_schema: {
          type: 'object',
          properties: {
            needs_citation: {
              type: 'boolean',
              description: 'Whether to include source citations in the answer',
            },
          },
          required: ['needs_citation'],
        },
      },
    ];

    // Step 1: Use Claude function calling to determine intent
    const intentResponse = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Latest Haiku model with tool support
      max_tokens: 1024,
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
        'You must choose exactly ONE tool.',
      ].join('\n'),
      messages: [{ role: 'user', content: text }],
      tools,
      tool_choice: { type: 'any' },
      temperature: 0.4,
    });

    // Step 2: Execute the chosen tool
    const toolUse = intentResponse.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
    );

    if (!toolUse) {
      return NextResponse.json(
        { error: 'No tool was selected by the model' },
        { status: 500 },
      );
    }

    // Execute save_memory
    if (toolUse.name === 'save_memory') {
      const memory = await saveMemory({
        text,
        category: body.category || null,
        source: body.source || 'web_chat',
      });
      
      return NextResponse.json({
        action: 'saved',
        intent: 'save',
        message: '✓ Memoria guardada exitosamente',
        memory,
      });
    }

    // Execute answer_question
    if (toolUse.name === 'answer_question') {
      const args = toolUse.input as { needs_citation: boolean };
      const needsCitation = args?.needs_citation ?? false;
      
      if (wantStream) {
        return streamAnswerWithRag({
          text,
          category: body.category || undefined,
          needsCitation,
          anthropic,
        });
      } else {
        const { results, answer } = await answerWithRag({
          text,
          category: body.category || undefined,
          needsCitation,
          anthropic,
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
  anthropic: Anthropic;
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

    // Step 2: Stream the answer using retrieved context with Claude
    const stream = await input.anthropic.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
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
      messages: [
        {
          role: 'user',
          content:
            `User Question:\n${input.text}\n\n` +
            `Available Context from Memory:\n${context || 'No context available.'}\n\n` +
            `${input.needsCitation ? 'Include brief source citations.' : ''}`,
        },
      ],
      temperature: 0.6,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });
    
    // Return text stream for clean client display
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  })();
}

/**
 * Save memory to RAG system
 * Category will be auto-detected by the RAG service
 */
async function saveMemory(input: {
  text: string;
  category?: string | null;
  source?: string;
}) {
  const res = await fetch(`${RAG_API_URL}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: input.text,
      category: input.category,
      source: input.source,
      auto_categorize: true, // Enable auto-categorization in RAG service
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
  anthropic: Anthropic;
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

  // Step 2: Generate answer using retrieved context with Claude
  const response = await input.anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
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
    messages: [
      {
        role: 'user',
        content:
          `User Question:\n${input.text}\n\n` +
          `Available Context from Memory:\n${context || 'No context available.'}\n\n` +
          `${input.needsCitation ? 'Include brief source citations.' : ''}`,
      },
    ],
    temperature: 0.6,
  });

  // Extract text from response
  const textContent = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
  );

  return {
    results: search.map((r) => ({
      memory: r.memory,
      similarity_score: r.similarity_score,
    })),
    answer: textContent?.text || '',
  };
}



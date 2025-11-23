import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

type ProcessRequest = {
  text: string;
  category?: string | null;
  source?: string | null;
};

const RAG_API_URL =
  process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';

// Utility function for structured logging (Amplify CloudWatch friendly)
function logError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack,
    } : String(error),
    metadata: {
      ...metadata,
      ragApiUrl: RAG_API_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  };
  console.error(JSON.stringify(errorData));
}

function logInfo(context: string, metadata?: Record<string, unknown>) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'info',
    context,
    metadata,
  };
  console.log(JSON.stringify(logData));
}

// Utility function for fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  }
}

function isToolUseBlock(
  block: unknown
): block is Anthropic.Messages.ToolUseBlock {
  return (
    typeof block === 'object' &&
    block !== null &&
    (block as { type?: string }).type === 'tool_use'
  );
}

function isTextBlock(
  block: unknown
): block is Anthropic.Messages.TextBlock {
  return (
    typeof block === 'object' &&
    block !== null &&
    (block as { type?: string }).type === 'text'
  );
}

export async function POST(req: Request) {
  try {
    logInfo('POST /api/process - Request received');

    const body = (await req.json()) as ProcessRequest;
    const text = (body.text || '').trim();

    if (!text) {
      logError('POST /api/process - Empty text', new Error('Text is empty'));
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 },
      );
    }

    // Validate required environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      logError('POST /api/process - Missing ANTHROPIC_API_KEY', new Error('ANTHROPIC_API_KEY not configured'));
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured on server' },
        { status: 500 },
      );
    }

    if (!process.env.NEXT_PUBLIC_RAG_API_URL) {
      logError('POST /api/process - Missing NEXT_PUBLIC_RAG_API_URL', new Error('NEXT_PUBLIC_RAG_API_URL not configured'), {
        defaultValue: RAG_API_URL,
        warning: 'Using default localhost - this will fail in production',
      });
    }

    logInfo('POST /api/process - Environment validated', {
      ragApiUrl: RAG_API_URL,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      textLength: text.length,
      source: body.source,
    });

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
      {
        name: 'small_talk',
        description:
          'Use this when the user is engaging in casual conversation, greetings, or pleasantries. ' +
          'Examples: "hola", "¿cómo estás?", "gracias", "buen día", emojis, risas, saludos.',
        input_schema: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              enum: ['es'],
              description: 'Language to answer in. Default: es (Spanish).',
            },
          },
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
        '3. Engage in casual conversation, greetings or pleasantries (small_talk)',
        '',
        'Decision criteria:',
        '- Use save_memory when user explicitly wants to store/remember/save information',
        '- Use answer_question when user asks questions or wants to retrieve information',
        '- Use small_talk for greetings/pleasantries (e.g., "hola", "¿cómo estás?", "gracias")',
        '- Default to small_talk when the message is clearly social nicety and non-task',
        '',
        'You must choose exactly ONE tool.',
      ].join('\n'),
      messages: [{ role: 'user', content: text }],
      tools,
      tool_choice: { type: 'any' },
      temperature: 0.4,
    });

    // Step 2: Execute the chosen tool
    const toolUse = (intentResponse.content as Array<unknown>).find(isToolUseBlock);

    // Execute save_memory
    if (!toolUse || toolUse.name === 'save_memory') {
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

    // Execute small_talk
    if (toolUse.name === 'small_talk') {
      if (wantStream) {
        return streamSmallTalk({ text, anthropic });
      } else {
        const answer = await smallTalk({ text, anthropic });
        return NextResponse.json({
          action: 'chatted',
          intent: 'small_talk',
          answer,
        });
      }
    }

    // Fallback (should not reach here)
    return NextResponse.json(
      { error: 'Unknown tool selected' },
      { status: 500 },
    );
    
  } catch (err) {
    logError('POST /api/process - Unhandled error', err, {
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Stream small talk (no RAG)
 */
function streamSmallTalk(input: { text: string; anthropic: Anthropic }) {
  return (async () => {
    const stream = await input.anthropic.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      system: [
        'Eres un asistente conversacional en español, cercano y natural.',
        'Responde saludos y small talk con 1-2 frases, de forma amable y directa.',
        'No menciones memorias, herramientas ni contexto interno.',
      ].join('\n'),
      messages: [
        {
          role: 'user',
          content: input.text,
        },
      ],
      temperature: 0.6,
    });

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
          logError('streamSmallTalk - Stream error', error);
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
  })();
}

/**
 * Non-stream small talk (no RAG)
 */
async function smallTalk(input: { text: string; anthropic: Anthropic }) {
  const response = await input.anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 512,
    system: [
      'Eres un asistente conversacional en español, cercano y natural.',
      'Responde saludos y small talk con 1-2 frases, de forma amable y directa.',
      'No menciones memorias, herramientas ni contexto interno.',
    ].join('\n'),
    messages: [
      {
        role: 'user',
        content: input.text,
      },
    ],
    temperature: 0.6,
  });

  const textContent = (response.content as Array<unknown>).find(isTextBlock);
  return textContent?.text || '';
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

    const searchUrl = `${RAG_API_URL}/search?${params.toString()}`;
    logInfo('streamAnswerWithRag - Fetching from RAG', { url: searchUrl });

    const res = await fetchWithTimeout(searchUrl, {
      method: 'GET',
      cache: 'no-store',
    }, 10000);

    if (!res.ok) {
      const t = await res.text();
      logError('streamAnswerWithRag - RAG search failed', new Error(`RAG /search error: ${res.status}`), {
        url: searchUrl,
        status: res.status,
        responseText: t,
      });
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
          logError('streamAnswerWithRag - Stream error', error);
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
  const saveUrl = `${RAG_API_URL}/memories`;
  logInfo('saveMemory - Saving to RAG', { url: saveUrl, source: input.source });

  const res = await fetchWithTimeout(saveUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: input.text,
      category: input.category,
      source: input.source,
      auto_categorize: true, // Enable auto-categorization in RAG service
    }),
    cache: 'no-store',
  }, 10000);

  if (!res.ok) {
    const t = await res.text();
    logError('saveMemory - RAG save failed', new Error(`RAG /memories error: ${res.status}`), {
      url: saveUrl,
      status: res.status,
      responseText: t,
    });
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

  const searchUrl = `${RAG_API_URL}/search?${params.toString()}`;
  logInfo('answerWithRag - Fetching from RAG', { url: searchUrl });

  const res = await fetchWithTimeout(searchUrl, {
    method: 'GET',
    cache: 'no-store',
  }, 10000);

  if (!res.ok) {
    const t = await res.text();
    logError('answerWithRag - RAG search failed', new Error(`RAG /search error: ${res.status}`), {
      url: searchUrl,
      status: res.status,
      responseText: t,
    });
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
  const textContent = (response.content as Array<unknown>).find(isTextBlock);

  return {
    results: search.map((r) => ({
      memory: r.memory,
      similarity_score: r.similarity_score,
    })),
    answer: textContent?.text || '',
  };
}



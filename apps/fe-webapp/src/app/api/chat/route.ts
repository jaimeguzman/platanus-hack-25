import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export const runtime = 'edge';

/**
 * POST /api/chat
 * Chat endpoint with RAG context, function calling, and streaming response
 */
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NeighborResult {
  memory_id: number;
  similarity_score: number;
}

interface MemoryDetail {
  id: number;
  text: string;
  category?: string;
  source?: string;
  created_at: string;
}

interface ExpandedNode {
  parentId: number;
  neighbors: number[];
}

interface ExpandedNodeWithDetails {
  parentId: number;
  parentMemory: MemoryDetail;
  neighbors: MemoryDetail[];
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
    const { message, history = [], activeMemoryIds = [] } = body as { 
      message: string; 
      history?: Message[];
      activeMemoryIds?: number[];
    };

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is an expand-only request (no RAG search needed)
    const isExpandOnly = message.startsWith('[EXPAND_ONLY]');

    let context = 'No context available.';
    let topResults: Array<{
      memory: { id: number; text: string; category?: string; source?: string; created_at: string };
      similarity_score: number;
    }> = [];

    // Step 1: Retrieve relevant memories from RAG (skip if expand-only)
    if (!isExpandOnly) {
      // Build query context from recent conversation for enhancement
      const queryContext = history
        .slice(-3) // Last 3 messages for context
        .map(msg => `${msg.role}: ${msg.content}`);
      
      const params = new URLSearchParams({
        query: message,
        limit: '5',
        enhance_query: 'true',
        query_context: queryContext.length > 0 ? JSON.stringify(queryContext) : '',
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
    
      if (ragResponse.ok) {
        const searchResults = (await ragResponse.json()) as Array<{
          memory: { id: number; text: string; category?: string; source?: string; created_at: string };
          similarity_score: number;
        }>;

        // Take top 3 most relevant memories
        topResults = searchResults.slice(0, 3);
        context = topResults
          .map((r) => {
            const createdDate = new Date(r.memory.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            return `- [Memory ID ${r.memory.id}, creada el ${createdDate}] ${r.memory.text.slice(0, 600)}`;
          })
          .join('\n');
      }
    } else {
      // For expand-only, use existing active memories as context
      context = `Active memory IDs: ${activeMemoryIds.join(', ')}`;
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
      content: isExpandOnly
        ? `The user wants to explore adjacent memories connected to the currently active nodes (IDs: ${activeMemoryIds.join(', ')}). Use the expand_adjacent_memories tool to show related concepts.`
        : `User Question:\n${message}\n\n` +
          `Available Context from Memory:\n${context}\n\n` +
          `Include brief source citations when relevant.`,
    });

    // Step 3: Define tools for function calling
    const tools: Anthropic.Tool[] = [];
    
    // Only add expand_adjacent_memories tool if there are active memory IDs
    if (activeMemoryIds.length > 0) {
      tools.push({
        name: 'expand_adjacent_memories',
        description: 'Expands the knowledge graph by retrieving adjacent memories (neighbors) of currently active memory nodes. Use this when the user wants to explore related ideas, concepts, or memories connected to the current context.',
        input_schema: {
          type: 'object',
          properties: {
            memory_ids: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of memory IDs to expand. Use the currently active memory IDs.',
            },
            neighbors_per_node: {
              type: 'number',
              description: 'Number of adjacent nodes to retrieve per memory (default: 3, max: 10)',
              default: 3,
            },
          },
          required: ['memory_ids'],
        },
      });
    }

    // Step 4: Stream the answer using Claude with function calling
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    const systemPrompt = [
      'You are Cognitive Context, the user\'s digital second brain and personal knowledge assistant.',
      'Your role: Answer questions using the provided context from their stored memories and previous conversation.',
      '',
      'Rules:',
      '- Language: Neutral Spanish. Clear, professional yet friendly tone.',
      '- Style: Brief (2-5 sentences), direct. Use bullet points for steps if needed.',
      '- Never invent information. If context is insufficient, say ask to get more information',
      '- When applicable, mention relationships or connections detected in the context.',
      '- IMPORTANT: When relevant, mention creation dates to provide temporal context (e.g., "según una nota de marzo de 2024").',
      '- Respect privacy: do not use external data or assume information not in context.',
      '- Maintain conversation continuity: reference previous messages when relevant.',
      '- If asked about previous messages, use the conversation history to answer.',
    ];

    if (activeMemoryIds.length > 0) {
      systemPrompt.push('');
      systemPrompt.push(`Currently active memory IDs: ${activeMemoryIds.join(', ')}`);
      systemPrompt.push('- When the user asks to "expand", "explore adjacent", "show related", "what connects to this", or similar, use the expand_adjacent_memories tool.');
      systemPrompt.push('- The tool will reveal memories (ideas/concepts) that are semantically connected to the active nodes.');
      systemPrompt.push('- When expanding, respond briefly in Spanish explaining that you are revealing connected concepts.');
    }

    const streamParams: Anthropic.MessageStreamParams = {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: systemPrompt.join('\n'),
      messages: conversationMessages,
      temperature: 0.8,
    };

    if (tools.length > 0) {
      streamParams.tools = tools;
    }

    const stream = await anthropic.messages.stream(streamParams);

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // First, send the memory IDs being used (only if not expand-only)
          if (!isExpandOnly) {
            const memoryIds = topResults.map(r => r.memory.id);
            if (memoryIds.length > 0) {
              const metadataChunk = JSON.stringify({ type: 'metadata', memoryIds }) + '\n';
              controller.enqueue(encoder.encode(metadataChunk));
            }
          }

          // Then stream the text response and handle tool calls
          for await (const chunk of stream) {
            // Handle text deltas
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text;
              const textChunk = JSON.stringify({ type: 'text', content: text }) + '\n';
              controller.enqueue(encoder.encode(textChunk));
            }
            
            // Handle tool use (function calls)
            if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
              console.log('Tool use detected:', chunk.content_block.name);
            }
            
            // Handle tool input
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'input_json_delta'
            ) {
              console.log('Tool input delta:', chunk.delta.partial_json);
            }
          }

          // After streaming completes, check if there were any tool uses
          const finalMessage = await stream.finalMessage();
          
          for (const block of finalMessage.content) {
            if (block.type === 'tool_use' && block.name === 'expand_adjacent_memories') {
              console.log('Expanding adjacent memories:', block.input);
              
              const input = block.input as { 
                memory_ids: number[]; 
                neighbors_per_node?: number 
              };
              
              const neighborsPerNode = Math.min(input.neighbors_per_node || 3, 10);
              const expandedNodes: ExpandedNode[] = [];
              const expandedNodesWithDetails: ExpandedNodeWithDetails[] = [];
              
              // Fetch neighbors for each memory ID
              for (const memoryId of input.memory_ids) {
                try {
                  const params = new URLSearchParams({
                    limit: String(neighborsPerNode),
                  });
                  
                  // Get neighbors
                  const neighborsResponse = await fetch(
                    `${RAG_API_URL}/memories/${memoryId}/neighbors?${params.toString()}`,
                    { method: 'GET', cache: 'no-store' }
                  );
                  
                  if (neighborsResponse.ok) {
                    const neighbors = await neighborsResponse.json() as NeighborResult[];
                    const neighborIds = neighbors.map(n => n.memory_id);
                    
                    expandedNodes.push({
                      parentId: memoryId,
                      neighbors: neighborIds,
                    });
                    
                    // Fetch full details for parent and neighbors
                    const parentResponse = await fetch(
                      `${RAG_API_URL}/memories/${memoryId}`,
                      { method: 'GET', cache: 'no-store' }
                    );
                    
                    if (parentResponse.ok) {
                      const parentMemory = await parentResponse.json() as MemoryDetail;
                      const neighborDetails: MemoryDetail[] = [];
                      
                      // Fetch each neighbor's details
                      for (const neighborId of neighborIds) {
                        const neighborResponse = await fetch(
                          `${RAG_API_URL}/memories/${neighborId}`,
                          { method: 'GET', cache: 'no-store' }
                        );
                        
                        if (neighborResponse.ok) {
                          const neighborMemory = await neighborResponse.json() as MemoryDetail;
                          neighborDetails.push(neighborMemory);
                        }
                      }
                      
                      expandedNodesWithDetails.push({
                        parentId: memoryId,
                        parentMemory,
                        neighbors: neighborDetails,
                      });
                    }
                  }
                } catch (error) {
                  console.error(`Error fetching neighbors for memory ${memoryId}:`, error);
                }
              }
              
              // Send expanded nodes information (for UI highlighting)
              if (expandedNodes.length > 0) {
                const expandChunk = JSON.stringify({ 
                  type: 'expand', 
                  expandedNodes 
                }) + '\n';
                controller.enqueue(encoder.encode(expandChunk));
              }
              
              // Generate detailed analysis of expanded groups
              if (expandedNodesWithDetails.length > 0) {
                try {
                  // Build context with all expanded memories
                  let analysisContext = 'Grupos de recuerdos expandidos:\n\n';
                  
                  expandedNodesWithDetails.forEach((group, index) => {
                    const parentCreatedDate = new Date(group.parentMemory.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    analysisContext += `Grupo ${index + 1} - Nodo Central [ID ${group.parentId}]:\n`;
                    analysisContext += `"${group.parentMemory.text}"\n`;
                    analysisContext += `Categoría: ${group.parentMemory.category || 'sin categoría'}\n`;
                    analysisContext += `Creado el: ${parentCreatedDate}\n\n`;
                    analysisContext += `Recuerdos conectados:\n`;
                    
                    group.neighbors.forEach((neighbor, nIdx) => {
                      const neighborCreatedDate = new Date(neighbor.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      analysisContext += `  ${nIdx + 1}. [ID ${neighbor.id}] ${neighbor.text}\n`;
                      if (neighbor.category) {
                        analysisContext += `     Categoría: ${neighbor.category}\n`;
                      }
                      analysisContext += `     Creado el: ${neighborCreatedDate}\n`;
                    });
                    analysisContext += '\n';
                  });
                  
                  // Create a new stream for the analysis
                  const analysisStream = await anthropic.messages.stream({
                    model: 'claude-3-5-haiku-20241022',
                    max_tokens: 2048,
                    system: [
                      'Eres Cognitive Context, el asistente de memoria del usuario.',
                      'Acabas de expandir nodos adyacentes en su grafo de conocimiento.',
                      'Tu tarea: Analizar cada grupo de recuerdos expandidos en detalle.',
                      '',
                      'Para cada grupo:',
                      '- Identifica el tema central del nodo padre',
                      '- Analiza cómo se conectan los recuerdos adyacentes',
                      '- Encuentra patrones, relaciones o insights',
                      '- Menciona categorías relevantes',
                      '- IMPORTANTE: Considera las fechas de creación para identificar evolución temporal del conocimiento',
                      '',
                      'Formato:',
                      '- Usa encabezados con emoji para cada grupo (📊, 🔗, 💡, etc.)',
                      '- Sé extensivo pero conciso (3-5 oraciones por grupo)',
                      '- Resalta conexiones interesantes entre conceptos',
                      '- Menciona fechas cuando sea relevante para mostrar evolución temporal',
                      '- Termina con un resumen general de lo que se descubrió',
                      '',
                      'Tono: Profesional, analítico, pero accesible. En español neutral.',
                    ].join('\n'),
                    messages: [{
                      role: 'user',
                      content: `Analiza estos grupos de recuerdos que acabamos de expandir:\n\n${analysisContext}`,
                    }],
                    temperature: 0.7,
                  });
                  
                  // Stream the analysis
                  for await (const chunk of analysisStream) {
                    if (
                      chunk.type === 'content_block_delta' &&
                      chunk.delta.type === 'text_delta'
                    ) {
                      const text = chunk.delta.text;
                      const textChunk = JSON.stringify({ type: 'text', content: text }) + '\n';
                      controller.enqueue(encoder.encode(textChunk));
                    }
                  }
                } catch (error) {
                  console.error('Error generating expansion analysis:', error);
                }
              }
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


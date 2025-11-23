/**
 * Service for interacting with the RAG Memory API
 */

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  category?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  [key: string]: unknown;
}

export interface GraphMetadata {
  node_count: number;
  edge_count: number;
  categories?: string[];
  [key: string]: unknown;
}

export interface GraphExportResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface GraphNodeData {
  node: GraphNode;
  edges: GraphEdge[];
}

export interface MemoryResponse {
  id: number;
  text: string;
  category?: string;
  source?: string;
  created_at: string;
  graph_node?: GraphNodeData;
}

export interface SaveToRagResponse {
  memory: MemoryResponse;
  graph_node: GraphNodeData;
}

const RAG_API_BASE_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';

/**
 * Save a note to RAG memory
 */
export async function saveNoteToRag(
  text: string,
  category?: string,
  source?: string
): Promise<SaveToRagResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        category,
        source: source || 'text_new_note',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Failed to save note to RAG: ${response.statusText}`;
      console.error('RAG API Error Response:', errorData);
      throw new Error(errorMessage);
    }

    const data: MemoryResponse = await response.json();
    
    // The API now returns graph_node inside the MemoryResponse
    const graphNode = data.graph_node || {
      node: {
        id: String(data.id),
        label: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
        type: 'memory',
        category: data.category,
        created_at: data.created_at,
      },
      edges: [],
    };
    
    return {
      memory: data,
      graph_node: graphNode,
    };
  } catch (error) {
    console.error('Error saving note to RAG:', error);
    throw error;
  }
}

/**
 * Update a note in RAG memory
 */
export async function updateNoteInRag(
  memoryId: number,
  text: string,
  category?: string,
  source?: string
): Promise<SaveToRagResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/memories/${memoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        category,
        source: source || 'text_new_note',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Failed to update note in RAG: ${response.statusText}`;
      console.error('RAG API Error Response:', errorData);
      throw new Error(errorMessage);
    }

    const data: MemoryResponse = await response.json();
    
    // The API now returns graph_node inside the MemoryResponse
    // For updates, we might not get graph_node, so we fetch it if not present
    let graphNode = data.graph_node;
    
    if (!graphNode) {
      // Fetch graph node data manually if not included in response
      const graphResponse = await fetch(`${RAG_API_BASE_URL}/memories/${memoryId}/neighbors?limit=10`);
      
      if (graphResponse.ok) {
        const neighbors = await graphResponse.json();
        graphNode = {
          node: {
            id: String(data.id),
            label: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
            type: 'memory',
            category: data.category,
            created_at: data.created_at,
          },
          edges: neighbors.map((neighbor: { memory_id: number; similarity_score: number }) => ({
            source: String(data.id),
            target: String(neighbor.memory_id),
            weight: neighbor.similarity_score,
          })),
        };
      } else {
        // Fallback to basic node data
        graphNode = {
          node: {
            id: String(data.id),
            label: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
            type: 'memory',
            category: data.category,
            created_at: data.created_at,
          },
          edges: [],
        };
      }
    }

    return {
      memory: data,
      graph_node: graphNode,
    };
  } catch (error) {
    console.error('Error updating note in RAG:', error);
    throw error;
  }
}

/**
 * Delete a note from RAG memory
 */
export async function deleteNoteFromRag(memoryId: number): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/memories/${memoryId}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete note from RAG: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting note from RAG:', error);
    // Don't throw error, just log it - we don't want to fail the entire deletion
    return false;
  }
}

/**
 * Check if the RAG API is available
 */
export async function checkRagHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('RAG API health check failed:', error);
    return false;
  }
}

/**
 * Fetch the graph data from the RAG API
 */
export async function fetchGraphData(
  maxNodes: number = 500,
  category?: string
): Promise<GraphExportResponse> {
  const params = new URLSearchParams({
    max_nodes: maxNodes.toString(),
  });

  if (category) {
    params.append('category', category);
  }

  const response = await fetch(`${RAG_API_BASE_URL}/export/graph?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch graph data: ${response.statusText}`);
  }

  const data = await response.json();

  // Convert node IDs to strings for D3
  return {
    nodes: data.nodes.map((node: GraphNode) => ({
      ...node,
      id: String(node.id),
      type: 'memory', // Default type
    })),
    edges: data.edges.map((edge: GraphEdge) => ({
      ...edge,
      source: String(edge.source),
      target: String(edge.target),
    })),
    metadata: {
      ...data.metadata,
      node_count: data.metadata.total_nodes || data.nodes.length,
      edge_count: data.metadata.total_edges || data.edges.length,
    },
  };
}

/**
 * Get graph statistics
 */
export async function fetchGraphStatistics(): Promise<GraphMetadata> {
  const response = await fetch(`${RAG_API_BASE_URL}/statistics`);

  if (!response.ok) {
    throw new Error(`Failed to fetch graph statistics: ${response.statusText}`);
  }

  return response.json();
}


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

const RAG_API_BASE_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8000';

export async function saveNoteToRag(
  text: string,
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
        source: source || 'text_new_note',
        auto_categorize: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Failed to save note to RAG: ${response.statusText}`;
      console.error('RAG API Error Response:', errorData);
      throw new Error(errorMessage);
    }

    const data: MemoryResponse = await response.json();

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

export async function updateNoteInRag(
  memoryId: number,
  text: string,
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

    let graphNode = data.graph_node;

    if (!graphNode) {
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
    return false;
  }
}

export async function checkRagHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('RAG API health check failed:', error);
    return false;
  }
}

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

  return {
    nodes: data.nodes.map((node: GraphNode) => ({
      ...node,
      id: String(node.id),
      type: 'memory',
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

export async function fetchGraphStatistics(): Promise<GraphMetadata> {
  const response = await fetch(`${RAG_API_BASE_URL}/statistics`);

  if (!response.ok) {
    throw new Error(`Failed to fetch graph statistics: ${response.statusText}`);
  }

  return response.json();
}

export async function getAllMemories(
  limit?: number,
  offset: number = 0,
  category?: string
): Promise<MemoryResponse[]> {
  try {
    const params = new URLSearchParams({
      offset: offset.toString(),
    });

    if (limit) {
      params.append('limit', limit.toString());
    }

    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`${RAG_API_BASE_URL}/memories?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch memories: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching memories:', error);
    throw error;
  }
}

export async function getMemoriesByCategory(
  category: string,
  limit?: number
): Promise<MemoryResponse[]> {
  try {
    const params = new URLSearchParams();

    if (limit) {
      params.append('limit', limit.toString());
    }

    const response = await fetch(
      `${RAG_API_BASE_URL}/search/category/${encodeURIComponent(category)}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch memories by category: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching memories by category:', error);
    throw error;
  }
}

export async function getAllCategories(): Promise<{
  categories: string[];
  category_counts: Array<{ category: string; count: number }>;
}> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

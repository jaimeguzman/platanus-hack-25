"""
Graph visualization generator for RAG Memory Service.
Creates an interactive HTML visualization similar to Obsidian's graph view.
"""
import sys
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from services.rag_memory import RagMemoryService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_visualization(
    service: RagMemoryService,
    output_file: str = "graph_visualization.html",
    max_nodes: int = 500,
    category: str = None,
):
    """
    Generate an interactive graph visualization HTML file.
    
    Args:
        service: RagMemoryService instance
        output_file: Path to output HTML file
        max_nodes: Maximum number of nodes to display
        category: Optional category filter
    """
    logger.info("Exporting graph data...")
    graph_data = service.export_graph_json(max_nodes=max_nodes, category=category)
    
    logger.info(f"Graph contains {len(graph_data['nodes'])} nodes and {len(graph_data['edges'])} edges")
    
    # Get statistics for the visualization
    stats = service.get_graph_statistics()
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAG Memory Graph - Interactive Visualization</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            overflow: hidden;
        }}

        #graph-container {{
            width: 100vw;
            height: 100vh;
            position: relative;
        }}

        .controls {{
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(22, 27, 34, 0.95);
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            z-index: 1000;
            max-width: 300px;
            backdrop-filter: blur(10px);
        }}

        .controls h2 {{
            font-size: 18px;
            margin-bottom: 15px;
            color: #58a6ff;
        }}

        .stat {{
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #21262d;
        }}

        .stat:last-child {{
            border-bottom: none;
        }}

        .stat-label {{
            color: #8b949e;
            font-size: 13px;
        }}

        .stat-value {{
            color: #c9d1d9;
            font-weight: 600;
            font-size: 13px;
        }}

        .legend {{
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(22, 27, 34, 0.95);
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 15px;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }}

        .legend h3 {{
            font-size: 14px;
            margin-bottom: 10px;
            color: #58a6ff;
        }}

        .legend-item {{
            display: flex;
            align-items: center;
            margin: 8px 0;
            font-size: 12px;
        }}

        .legend-color {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }}

        .info-panel {{
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(22, 27, 34, 0.95);
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            z-index: 1000;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            display: none;
        }}

        .info-panel.visible {{
            display: block;
        }}

        .info-panel h3 {{
            color: #58a6ff;
            margin-bottom: 10px;
            font-size: 16px;
        }}

        .info-panel .memory-text {{
            color: #c9d1d9;
            line-height: 1.6;
            margin-bottom: 15px;
            padding: 10px;
            background: #161b22;
            border-radius: 4px;
        }}

        .info-panel .memory-meta {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
        }}

        .info-panel .tag {{
            background: #1f6feb;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }}

        .info-panel .connections {{
            margin-top: 15px;
        }}

        .info-panel .connection-item {{
            padding: 8px;
            margin: 5px 0;
            background: #161b22;
            border-radius: 4px;
            font-size: 12px;
            border-left: 3px solid #58a6ff;
        }}

        .close-btn {{
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: #8b949e;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            line-height: 24px;
        }}

        .close-btn:hover {{
            color: #c9d1d9;
        }}

        .instructions {{
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(22, 27, 34, 0.95);
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 15px;
            z-index: 1000;
            font-size: 12px;
            color: #8b949e;
            backdrop-filter: blur(10px);
        }}

        .instructions div {{
            margin: 5px 0;
        }}

        .node {{
            cursor: pointer;
            transition: all 0.3s ease;
        }}

        .node:hover {{
            stroke-width: 3px;
        }}

        .node.selected {{
            stroke: #58a6ff;
            stroke-width: 4px;
        }}

        .link {{
            stroke: #30363d;
            stroke-opacity: 0.6;
            transition: all 0.3s ease;
        }}

        .link.highlighted {{
            stroke: #58a6ff;
            stroke-opacity: 1;
            stroke-width: 2px;
        }}

        .node-label {{
            font-size: 10px;
            fill: #8b949e;
            pointer-events: none;
            text-anchor: middle;
        }}

        ::-webkit-scrollbar {{
            width: 8px;
        }}

        ::-webkit-scrollbar-track {{
            background: #161b22;
        }}

        ::-webkit-scrollbar-thumb {{
            background: #30363d;
            border-radius: 4px;
        }}

        ::-webkit-scrollbar-thumb:hover {{
            background: #484f58;
        }}
    </style>
</head>
<body>
    <div id="graph-container">
        <svg id="graph"></svg>
        
        <div class="controls">
            <h2>📊 Graph Statistics</h2>
            <div class="stat">
                <span class="stat-label">Total Nodes</span>
                <span class="stat-value">{stats['total_memories']}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Total Edges</span>
                <span class="stat-value">{stats['total_edges']}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Components</span>
                <span class="stat-value">{stats['connected_components']}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Avg Degree</span>
                <span class="stat-value">{stats['average_degree']:.2f}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Density</span>
                <span class="stat-value">{stats['graph_density']:.4f}</span>
            </div>
        </div>

        <div class="legend">
            <h3>🎨 Categories</h3>
            <div id="legend-items"></div>
        </div>

        <div class="info-panel" id="info-panel">
            <button class="close-btn" onclick="closeInfoPanel()">×</button>
            <div id="info-content"></div>
        </div>

        <div class="instructions">
            <div><strong>🖱️ Controls:</strong></div>
            <div>• Click node to view details</div>
            <div>• Drag nodes to reposition</div>
            <div>• Scroll to zoom in/out</div>
            <div>• Drag background to pan</div>
        </div>
    </div>

    <script>
        // Graph data
        const graphData = {json.dumps(graph_data, indent=8)};

        // Configuration
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Color scale for categories
        const categories = [...new Set(graphData.nodes.map(n => n.category || 'uncategorized'))];
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(d3.schemeTableau10);

        // Create legend
        const legendContainer = d3.select('#legend-items');
        categories.forEach(category => {{
            const item = legendContainer.append('div')
                .attr('class', 'legend-item');
            
            item.append('div')
                .attr('class', 'legend-color')
                .style('background-color', colorScale(category));
            
            item.append('span')
                .text(category || 'uncategorized');
        }});

        // Create SVG
        const svg = d3.select('#graph')
            .attr('width', width)
            .attr('height', height);

        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {{
                container.attr('transform', event.transform);
            }});

        svg.call(zoom);

        // Container for graph elements
        const container = svg.append('g');

        // Create force simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force('link', d3.forceLink(graphData.edges)
                .id(d => d.id)
                .distance(d => 100 / (d.weight + 0.1))
                .strength(d => d.weight))
            .force('charge', d3.forceManyBody()
                .strength(-300)
                .distanceMax(400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));

        // Create links
        const link = container.append('g')
            .selectAll('line')
            .data(graphData.edges)
            .join('line')
            .attr('class', 'link')
            .attr('stroke-width', d => Math.sqrt(d.weight) * 2);

        // Create nodes
        const node = container.append('g')
            .selectAll('circle')
            .data(graphData.nodes)
            .join('circle')
            .attr('class', 'node')
            .attr('r', d => {{
                // Size based on number of connections
                const connections = graphData.edges.filter(e => 
                    e.source.id === d.id || e.target.id === d.id
                ).length;
                return 5 + Math.sqrt(connections) * 3;
            }})
            .attr('fill', d => colorScale(d.category || 'uncategorized'))
            .attr('stroke', '#161b22')
            .attr('stroke-width', 2)
            .call(drag(simulation))
            .on('click', (event, d) => showNodeInfo(d))
            .on('mouseover', (event, d) => highlightNode(d))
            .on('mouseout', () => unhighlightAll());

        // Create labels (only for important nodes)
        const label = container.append('g')
            .selectAll('text')
            .data(graphData.nodes.filter(d => {{
                const connections = graphData.edges.filter(e => 
                    e.source.id === d.id || e.target.id === d.id
                ).length;
                return connections > 2; // Only label well-connected nodes
            }}))
            .join('text')
            .attr('class', 'node-label')
            .attr('dy', -15)
            .text(d => d.label.substring(0, 20) + (d.label.length > 20 ? '...' : ''));

        // Update positions on simulation tick
        simulation.on('tick', () => {{
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        }});

        // Drag behavior
        function drag(simulation) {{
            function dragstarted(event) {{
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }}

            function dragged(event) {{
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }}

            function dragended(event) {{
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }}

            return d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }}

        // Highlight node and its connections
        function highlightNode(nodeData) {{
            // Highlight connected links
            link.classed('highlighted', d => 
                d.source.id === nodeData.id || d.target.id === nodeData.id
            );

            // Highlight connected nodes
            const connectedIds = new Set();
            graphData.edges.forEach(e => {{
                if (e.source.id === nodeData.id) connectedIds.add(e.target.id);
                if (e.target.id === nodeData.id) connectedIds.add(e.source.id);
            }});

            node.style('opacity', d => 
                d.id === nodeData.id || connectedIds.has(d.id) ? 1 : 0.3
            );
        }}

        // Remove highlights
        function unhighlightAll() {{
            link.classed('highlighted', false);
            node.style('opacity', 1);
        }}

        // Show node information panel
        function showNodeInfo(nodeData) {{
            const panel = document.getElementById('info-panel');
            const content = document.getElementById('info-content');

            // Get connections
            const connections = graphData.edges
                .filter(e => e.source.id === nodeData.id || e.target.id === nodeData.id)
                .map(e => {{
                    const otherId = e.source.id === nodeData.id ? e.target.id : e.source.id;
                    const otherNode = graphData.nodes.find(n => n.id === otherId);
                    return {{ node: otherNode, weight: e.weight }};
                }})
                .sort((a, b) => b.weight - a.weight);

            // Build HTML
            let html = `
                <h3>Memory #${{nodeData.id}}</h3>
                <div class="memory-text">${{nodeData.label}}</div>
                <div class="memory-meta">
                    <span class="tag">Category: ${{nodeData.category || 'none'}}</span>
                    <span class="tag">${{connections.length}} connections</span>
                </div>
            `;

            if (connections.length > 0) {{
                html += '<div class="connections"><strong>Connected to:</strong>';
                connections.slice(0, 5).forEach(conn => {{
                    html += `
                        <div class="connection-item">
                            <div style="color: #58a6ff; font-weight: 600;">
                                Similarity: ${{(conn.weight * 100).toFixed(1)}}%
                            </div>
                            <div style="margin-top: 4px;">
                                ${{conn.node.label}}
                            </div>
                        </div>
                    `;
                }});
                if (connections.length > 5) {{
                    html += `<div style="margin-top: 10px; color: #8b949e; font-size: 11px;">
                        ... and ${{connections.length - 5}} more
                    </div>`;
                }}
                html += '</div>';
            }}

            content.innerHTML = html;
            panel.classList.add('visible');

            // Highlight selected node
            node.classed('selected', d => d.id === nodeData.id);
        }}

        // Close info panel
        function closeInfoPanel() {{
            document.getElementById('info-panel').classList.remove('visible');
            node.classed('selected', false);
            unhighlightAll();
        }}

        // Initial zoom to fit
        setTimeout(() => {{
            const bounds = container.node().getBBox();
            const fullWidth = bounds.width;
            const fullHeight = bounds.height;
            const midX = bounds.x + fullWidth / 2;
            const midY = bounds.y + fullHeight / 2;

            const scale = 0.8 / Math.max(fullWidth / width, fullHeight / height);
            const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale));
        }}, 100);
    </script>
</body>
</html>"""

    # Write HTML file
    output_path = Path(output_file)
    output_path.write_text(html_content, encoding='utf-8')
    
    logger.info(f"✅ Visualization saved to: {output_path.absolute()}")
    logger.info(f"📊 Nodes: {len(graph_data['nodes'])}, Edges: {len(graph_data['edges'])}")
    logger.info(f"🌐 Open in browser: file://{output_path.absolute()}")


def main():
    """Generate visualization for existing memories."""
    logger.info("Initializing RAG Memory Service...")
    
    service = RagMemoryService(
        auto_create_schema=False,
        load_graph=True,
    )
    
    # Generate visualization
    generate_visualization(
        service=service,
        output_file="rag_graph_visualization.html",
        max_nodes=500,
        category=None,  # Set to filter by category, e.g., "programming"
    )
    
    logger.info("✨ Done! Open the HTML file in your browser to view the graph.")


if __name__ == "__main__":
    main()


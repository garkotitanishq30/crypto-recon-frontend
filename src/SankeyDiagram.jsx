import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function SankeyDiagram({ nodes, edges }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!nodes.length || !edges.length) return;

    const width = 800;
    const height = 500;
    const nodeWidth = 30;
    const nodeHeight = 60;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Simple positions
    const nodePositions = {};
    nodes.forEach((n, i) => {
      nodePositions[n.id] = {
        x: 50,
        y: (i * (height / nodes.length)) + 30
      };
    });

    // Draw edges
    edges.forEach(e => {
      const source = nodePositions[e.source];
      const target = nodePositions[e.target];
      if (!source || !target) return;

      svg.append('path')
        .attr('d', `M ${source.x + nodeWidth} ${source.y + nodeHeight/2} C ${source.x + 150} ${source.y + nodeHeight/2}, ${target.x - 150} ${target.y + nodeHeight/2}, ${target.x} ${target.y + nodeHeight/2}`)
        .attr('stroke', '#00ff88')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('opacity', 0.5);
    });

    // Draw nodes
    nodes.forEach(n => {
      const pos = nodePositions[n.id];
      if (!pos) return;

      svg.append('rect')
        .attr('x', pos.x)
        .attr('y', pos.y)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 5)
        .attr('fill', n.style?.background || '#78909c')
        .attr('opacity', 0.8);

      svg.append('text')
        .attr('x', pos.x + nodeWidth + 10)
        .attr('y', pos.y + nodeHeight/2)
        .attr('dy', '0.35em')
        .text(n.data?.label?.split('\n')[0] || 'Unknown')
        .style('fill', 'white')
        .style('font-size', '10px');
    });

  }, [nodes, edges]);

  return (
    <svg ref={svgRef} width="100%" height="100%" style={{ background: 'transparent' }} />
  );
}

export default SankeyDiagram;
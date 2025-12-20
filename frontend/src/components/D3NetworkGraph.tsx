import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type D3NetworkGraphProps = {
  className?: string;
};

export function D3NetworkGraph({ className = '' }: D3NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 400;
    const height = 400;

    svg.selectAll('*').remove();

    // Create data nodes representing Atlanta features
    const nodes = [
      { id: 'center', label: 'ATL', group: 0, size: 40 },
      { id: 'crime', label: 'Safety', group: 1, size: 25 },
      { id: 'schools', label: 'Schools', group: 2, size: 25 },
      { id: 'marta', label: 'MARTA', group: 3, size: 25 },
      { id: 'restaurants', label: 'Food', group: 4, size: 25 },
      { id: 'parks', label: 'Parks', group: 5, size: 25 },
      { id: 'grocery', label: 'Grocery', group: 6, size: 25 },
      { id: 'hospitals', label: 'Health', group: 7, size: 25 },
      { id: 'police', label: 'Police', group: 8, size: 25 }
    ];

    const links = [
      { source: 'center', target: 'crime' },
      { source: 'center', target: 'schools' },
      { source: 'center', target: 'marta' },
      { source: 'center', target: 'restaurants' },
      { source: 'center', target: 'parks' },
      { source: 'center', target: 'grocery' },
      { source: 'center', target: 'hospitals' },
      { source: 'center', target: 'police' },
      { source: 'crime', target: 'police' },
      { source: 'schools', target: 'parks' },
      { source: 'marta', target: 'restaurants' },
      { source: 'hospitals', target: 'grocery' }
    ];

    const color = d3.scaleOrdinal()
      .domain(['0', '1', '2', '3', '4', '5', '6', '7', '8'])
      .range(['#10b981', '#14b8a6', '#3b82f6', '#ec4899', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4']);

    // Create simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5));

    // Create gradient definitions
    const defs = svg.append('defs');
    
    nodes.forEach((node, i) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${i}`);
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color(node.group.toString()) as string)
        .attr('stop-opacity', 1);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color(node.group.toString()) as string)
        .attr('stop-opacity', 0.4);
    });

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#10b981')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 2);

    // Draw nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add circles with gradient
    node.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any, i: number) => `url(#gradient-${i})`)
      .attr('stroke', (d: any) => color(d.group.toString()) as string)
      .attr('stroke-width', 3)
      .style('filter', 'drop-shadow(0px 4px 8px rgba(0,0,0,0.3))')
      .style('cursor', 'pointer');

    // Add labels
    node.append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', '#fff')
      .attr('font-size', (d: any) => d.id === 'center' ? '14px' : '10px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.5)');

    // Hover effects
    node.on('mouseenter', function(event, d: any) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.size * 1.3)
        .attr('stroke-width', 4);
    }).on('mouseleave', function(event, d: any) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.size)
        .attr('stroke-width', 3);
    });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={className}
      width="400"
      height="400"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(16, 185, 129, 0.2))' }}
    />
  );
}

import { useEffect, useRef } from 'react';
import type { Neighborhood } from '../App';

type MapProps = {
  neighborhoods: (Neighborhood & { weightedScore: number })[];
  selectedNeighborhood: string | null;
  onSelectNeighborhood: (id: string | null) => void;
};

export function Map({ neighborhoods, selectedNeighborhood, onSelectNeighborhood }: MapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Atlanta coordinates bounds
    const minLat = 33.65;
    const maxLat = 33.92;
    const minLng = -84.55;
    const maxLng = -84.25;

    // Map projection functions
    const latToY = (lat: number) => {
      return rect.height - ((lat - minLat) / (maxLat - minLat)) * rect.height;
    };

    const lngToX = (lng: number) => {
      return ((lng - minLng) / (maxLng - minLng)) * rect.width;
    };

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw background grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const x = (rect.width / 10) * i;
      const y = (rect.height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw main roads (simplified)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    
    // I-75/I-85 connector (vertical)
    ctx.beginPath();
    ctx.moveTo(rect.width * 0.45, 0);
    ctx.lineTo(rect.width * 0.45, rect.height);
    ctx.stroke();

    // I-20 (horizontal)
    ctx.beginPath();
    ctx.moveTo(0, rect.height * 0.65);
    ctx.lineTo(rect.width, rect.height * 0.65);
    ctx.stroke();

    // Draw neighborhood clusters with connections
    const topNeighborhoods = neighborhoods.slice(0, 5);
    
    // Draw connecting lines between top neighborhoods
    ctx.strokeStyle = '#10b98120';
    ctx.lineWidth = 1;
    for (let i = 0; i < topNeighborhoods.length - 1; i++) {
      const from = topNeighborhoods[i];
      const to = topNeighborhoods[i + 1];
      const x1 = lngToX(from.lng);
      const y1 = latToY(from.lat);
      const x2 = lngToX(to.lng);
      const y2 = latToY(to.lat);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw neighborhoods
    neighborhoods.forEach((neighborhood, index) => {
      const x = lngToX(neighborhood.lng);
      const y = latToY(neighborhood.lat);
      const isSelected = neighborhood.id === selectedNeighborhood;
      const isTopRanked = index < 5;

      // Draw glow for top ranked
      if (isTopRanked) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 30, y - 30, 60, 60);
      }

      // Draw outer ring for selected
      if (isSelected) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw neighborhood marker
      const size = isSelected ? 16 : isTopRanked ? 12 : 8;
      
      // Color based on cluster
      let color = '#94a3b8'; // default low
      if (neighborhood.cluster === 'high') color = '#10b981';
      else if (neighborhood.cluster === 'medium') color = '#3b82f6';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add white border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label for top neighborhoods or selected
      if (isTopRanked || isSelected) {
        ctx.fillStyle = '#1e293b';
        ctx.font = isSelected ? 'bold 13px Inter, system-ui, sans-serif' : '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Draw background for text
        const metrics = ctx.measureText(neighborhood.name);
        const textWidth = metrics.width;
        const textHeight = 16;
        const padding = 4;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(
          x - textWidth / 2 - padding,
          y - size - textHeight - padding * 2,
          textWidth + padding * 2,
          textHeight + padding
        );

        // Draw text
        ctx.fillStyle = '#1e293b';
        ctx.fillText(neighborhood.name, x, y - size - padding * 2);
      }
    });

  }, [neighborhoods, selectedNeighborhood]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Atlanta coordinates bounds
    const minLat = 33.65;
    const maxLat = 33.92;
    const minLng = -84.55;
    const maxLng = -84.25;

    const latToY = (lat: number) => {
      return rect.height - ((lat - minLat) / (maxLat - minLat)) * rect.height;
    };

    const lngToX = (lng: number) => {
      return ((lng - minLng) / (maxLng - minLng)) * rect.width;
    };

    // Check if click is near any neighborhood
    let clicked = false;
    for (const neighborhood of neighborhoods) {
      const nx = lngToX(neighborhood.lng);
      const ny = latToY(neighborhood.lat);
      const distance = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
      
      if (distance < 20) {
        onSelectNeighborhood(
          selectedNeighborhood === neighborhood.id ? null : neighborhood.id
        );
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      onSelectNeighborhood(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[500px] bg-slate-50 rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-pointer"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-2">
        <p className="text-slate-900">Cluster Quality</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600">High Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600">Medium Range</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-slate-600">Lower Tier</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4">
        <p className="text-slate-900">Atlanta Metro</p>
        <p className="text-slate-600">{neighborhoods.length} neighborhoods analyzed</p>
      </div>
    </div>
  );
}

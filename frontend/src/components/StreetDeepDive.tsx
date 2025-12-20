import { useMemo, useRef, useEffect, useState } from 'react';
import { ChevronLeft, Heart, ExternalLink, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from './ui/button';
import type { FeatureKey, Street } from '../App';
import { getAtlantaStreets, calculateFitScore } from '../utils/streetData';

type StreetDeepDiveProps = {
  streetId: string;
  priorities: FeatureKey[];
  bookmarkedStreets: string[];
  onToggleBookmark: (streetId: string) => void;
  compareStreets: string[];
  onToggleCompare: (streetId: string) => void;
  onBack: () => void;
  onNavigate: (screen: 'priorities' | 'map' | 'streets' | 'deepdive' | 'export') => void;
  backendStreets?: Street[] | null;
};

// ColorBrewer Professional Palette
const featureConfig: Record<FeatureKey, { label: string; color: string; icon: string }> = {
  restaurants: { label: 'Restaurants', color: '#f59e0b', icon: '🍽️' }, // Amber
  crime: { label: 'Safety', color: '#10b981', icon: '🛡️' }, // Emerald
  hospitals: { label: 'Hospitals', color: '#ef4444', icon: '🏥' }, // Red
  schools: { label: 'Schools', color: '#3b82f6', icon: '🎓' }, // Blue
  parks: { label: 'Parks', color: '#22c55e', icon: '🌳' }, // Green
  grocery: { label: 'Grocery', color: '#8b5cf6', icon: '🛒' }, // Violet
  policeStations: { label: 'Police', color: '#06b6d4', icon: '👮' }, // Cyan
  martaStops: { label: 'MARTA', color: '#ec4899', icon: '🚇' } // Pink
};

export function StreetDeepDive({
  streetId,
  priorities,
  bookmarkedStreets,
  onToggleBookmark,
  compareStreets,
  onToggleCompare,
  onBack,
  onNavigate
  , backendStreets
}: StreetDeepDiveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<FeatureKey | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [streetId]);

  const allStreets = useMemo(() => {
    if (backendStreets && backendStreets.length > 0) {
      return [...backendStreets].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
    }
    const streets = getAtlantaStreets();
    return streets.map(street => ({
      ...street,
      fitScore: calculateFitScore(street, priorities)
    })).sort((a, b) => b.fitScore - a.fitScore);
  }, [priorities, backendStreets]);

  const street = allStreets.find(s => s.id === streetId);
  const streetRank = street ? allStreets.findIndex(s => s.id === streetId) + 1 : 0;
  const compareList = allStreets.filter(s => compareStreets.includes(s.id));

  useEffect(() => {
    if (!street || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    // Draw background circles
    for (let i = 5; i >= 1; i--) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 === 0 ? '#f1f5f9' : '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axis lines - ONLY for current priorities
    const features = priorities;
    const angleStep = (Math.PI * 2) / features.length;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    features.forEach((_, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Draw data polygon
    ctx.beginPath();
    features.forEach((feature, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = street.scores[feature] / 100; // scores are out of 100
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points and labels
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    features.forEach((feature, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = street.scores[feature] / 100;
      const dataX = centerX + Math.cos(angle) * radius * value;
      const dataY = centerY + Math.sin(angle) * radius * value;
      
      // Draw point
      ctx.beginPath();
      ctx.arc(dataX, dataY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label with priority indicator
      const labelDistance = radius + 25;
      const labelX = centerX + Math.cos(angle) * labelDistance;
      const labelY = centerY + Math.sin(angle) * labelDistance;
      
      const priorityNum = index + 1;
      const isTop3 = index < 3;
      
      ctx.fillStyle = isTop3 ? '#10b981' : '#1e293b';
      ctx.fillText(`${featureConfig[feature].label} (P${priorityNum})`, labelX, labelY);
    });

  }, [street, priorities]);

  if (!street) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Street not found</p>
      </div>
    );
  }

  const isBookmarked = bookmarkedStreets.includes(street.id);
  const isInCompare = compareStreets.includes(street.id);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      {/* Enhanced Corner Lighting Effects with Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top corners - brighter and more visible */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/25 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        
        {/* Bottom corners - creating shadow depth */}
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/25 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.5s' }} />
        
        {/* Additional depth layers */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-teal-400/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-[100px]" />
        
        {/* Vignette effect for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-900/5" />
      </div>

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-lg relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to List
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-slate-900">{street.name}</h2>
              <div className="flex items-center gap-2 text-slate-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{street.neighborhood}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl text-emerald-600 font-bold">
                {(street.fitScore ?? 0).toFixed(1)}
              </div>
              <p className="text-slate-600">Fit Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
        {/* Feature Performance Analysis - Simple & Clean */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-shadow duration-300">
          <h3 className="text-slate-900 mb-4">Feature Performance Analysis</h3>
          <p className="text-slate-600 mb-6 text-sm">Visual representation of how this street scores across your priorities</p>
          
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="drop-shadow-md" />
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-shadow duration-300">
          <h3 className="text-slate-900 mb-2">Detailed Breakdown</h3>
          <p className="text-slate-600 mb-6 text-sm">How each priority contributes to the fit score</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {priorities.map((key, index) => {
              const config = featureConfig[key];
              const score = street.scores[key];
              const priorityNum = index + 1;
              const weight = priorities.length - index; // Priority 1 gets highest weight
              const contribution = (score * weight) / 10;
              const isTop3 = index < 3;

              return (
                <div key={key} className={`p-4 rounded-xl ${isTop3 ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${isTop3 ? 'text-slate-900 font-semibold' : 'text-slate-900'}`}>{config.label}</p>
                      <p className="text-slate-600 text-sm">Score: {score}/100</p>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-white font-semibold"
                      style={{ backgroundColor: config.color }}
                    >
                      {score}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isTop3 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                        Your Priority #{priorityNum}
                      </span>
                      <span className={isTop3 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                        Weight: ×{weight}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-900 font-medium">Impact</span>
                      <span className="text-emerald-600 font-semibold">
                        +{contribution.toFixed(1)} points
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h3 className="text-slate-900 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={isBookmarked ? 'default' : 'outline'}
              onClick={() => onToggleBookmark(street.id)}
              className={isBookmarked ? 'bg-rose-500 hover:bg-rose-600' : ''}
            >
              <Heart className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Saved' : 'Save to Profile'}
            </Button>
            <Button
              variant={isInCompare ? 'default' : 'outline'}
              onClick={() => onToggleCompare(street.id)}
              disabled={!isInCompare && compareStreets.length >= 3}
            >
              {isInCompare ? 'In Compare List' : 'Add to Compare'}
              {!isInCompare && ` (${compareStreets.length}/3)`}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://www.apartments.com/atlanta-ga/?bb=${street.lat},${street.lng}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Rentals
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('map')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View on Map
            </Button>
          </div>
        </div>

        {/* Compare Mode - Enhanced */}
        {compareList.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-300 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-slate-900">Side-by-Side Comparison</h3>
                <p className="text-slate-600 text-sm mt-1">Compare {street.name} with {compareList.length} other {compareList.length === 1 ? 'street' : 'streets'}</p>
              </div>
              <div className="text-emerald-600 font-semibold">
                {compareList.length + 1} streets
              </div>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-flex gap-4 px-4 sm:px-0 min-w-full">
                {/* Current Street */}
                <div className="bg-white rounded-xl p-4 border-2 border-emerald-500 flex-shrink-0 w-[280px] sm:flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {streetRank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-semibold truncate">{street.name}</p>
                      <p className="text-slate-600 text-sm">Current Selection</p>
                    </div>
                  </div>
                  <div className="mb-3 pb-3 border-b border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Fit Score</span>
                      <span className="text-emerald-600 font-bold">{(street.fitScore ?? 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {priorities.slice(0, 8).map((key) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 truncate">{featureConfig[key].label}</span>
                        <span className="text-slate-900 font-medium ml-2">{street.scores[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparison Streets */}
                {compareList.map((compareStreet) => {
                  const compareRank = allStreets.findIndex(s => s.id === compareStreet.id) + 1;
                  const fitDiff = (compareStreet.fitScore ?? 0) - (street.fitScore ?? 0);
                  
                  return (
                    <div key={compareStreet.id} className="bg-white rounded-xl p-4 border-2 border-slate-200 flex-shrink-0 w-[280px] sm:flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {compareRank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-semibold truncate">{compareStreet.name}</p>
                          <p className="text-slate-600 text-sm truncate">{compareStreet.neighborhood}</p>
                        </div>
                      </div>
                      <div className="mb-3 pb-3 border-b border-slate-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Fit Score</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-bold">{(compareStreet.fitScore ?? 0).toFixed(1)}</span>
                            {fitDiff !== 0 && (
                              <span className={`flex items-center text-xs font-semibold ${fitDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {fitDiff > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                {Math.abs(fitDiff).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {priorities.slice(0, 8).map((key) => {
                          const diff = compareStreet.scores[key] - street.scores[key];
                          return (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <span className="text-slate-600 truncate">{featureConfig[key].label}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-slate-900 font-medium">{compareStreet.scores[key]}</span>
                                {diff !== 0 && (
                                  <span className={`text-xs font-semibold min-w-[40px] text-right ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {diff > 0 ? '+' : ''}{diff}
                                  </span>
                                )}
                                {diff === 0 && (
                                  <span className="text-xs text-slate-400 min-w-[40px] text-right flex items-center justify-end">
                                    <Minus className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleCompare(compareStreet.id)}
                        className="w-full mt-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        Remove from Compare
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
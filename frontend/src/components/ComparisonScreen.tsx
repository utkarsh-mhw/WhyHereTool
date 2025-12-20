import { useMemo } from 'react';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Heart, ExternalLink, X } from 'lucide-react';
import { Button } from './ui/button';
import type { FeatureKey } from '../App';
import { getAtlantaStreets, calculateFitScore } from '../utils/streetData';

type ComparisonScreenProps = {
  compareStreets: string[];
  priorities: FeatureKey[];
  onToggleCompare: (streetId: string) => void;
  onBack: () => void;
  bookmarkedStreets: string[];
  onToggleBookmark: (streetId: string) => void;
  backendStreets?: import('../App').Street[] | null;
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

const clusterColors = {
  'excellent': '#10b981', // Emerald
  'very-good': '#14b8a6', // Teal
  'good': '#22c55e', // Green
  'fair': '#84cc16', // Lime
  'poor': '#64748b' // Slate
};

export function ComparisonScreen({
  compareStreets,
  priorities,
  onToggleCompare,
  onBack,
  bookmarkedStreets,
  onToggleBookmark,
  backendStreets
}: ComparisonScreenProps) {
  const allStreets = useMemo(() => {
    if (backendStreets && backendStreets.length > 0) {
      // Use backend streets, ensure fitScore is present
      return backendStreets.map(street => ({
        ...street,
        fitScore: street.fitScore ?? calculateFitScore(street, priorities)
      })).sort((a, b) => b.fitScore - a.fitScore);
    } else {
      // Fallback to mock data
      const streets = getAtlantaStreets();
      return streets.map(street => ({
        ...street,
        fitScore: calculateFitScore(street, priorities)
      })).sort((a, b) => b.fitScore - a.fitScore);
    }
  }, [priorities, backendStreets]);

  const compareList = allStreets.filter(s => compareStreets.includes(s.id));
  const baseStreet = compareList[0]; // Use first street as baseline

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No streets selected for comparison</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-lg relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to List
            </Button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-slate-900">Street Comparison</h2>
                <p className="text-slate-600 text-sm mt-1">
                  Comparing {compareList.length} {compareList.length === 1 ? 'street' : 'streets'} based on your priorities
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-emerald-600 font-semibold">{compareList.length} streets</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Comparison Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200 p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-semibold mb-2">How to Read This Comparison</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Green numbers (+) indicate better performance, red numbers (-) indicate lower performance compared to the baseline street (leftmost).
                </p>
                <div className="flex flex-wrap gap-2">
                  {compareList.map((street, index) => (
                    <div
                      key={street.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        index === 0 
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {index === 0 ? '📍 Baseline: ' : ''}
                      {street.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table - Horizontal Scroll */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-lg overflow-hidden">
            <h3 className="text-slate-900 font-semibold mb-6">Side-by-Side Comparison</h3>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-flex gap-4 px-4 sm:px-0 min-w-full">
                {/* Streets Comparison Cards */}
                {compareList.map((street, streetIndex) => {
                  const streetRank = allStreets.findIndex(s => s.id === street.id) + 1;
                  const isBaseline = streetIndex === 0;
                  const isBookmarked = bookmarkedStreets.includes(street.id);

                  return (
                    <div
                      key={street.id}
                      className={`flex-shrink-0 w-[320px] sm:flex-1 rounded-xl p-5 border-2 ${
                        isBaseline 
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Street Header */}
                      <div className="mb-4 pb-4 border-b border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
                            style={{ backgroundColor: clusterColors[street.cluster] }}
                          >
                            #{streetRank}
                          </div>
                          {isBaseline && (
                            <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                              BASELINE
                            </span>
                          )}
                        </div>
                        <h4 className="text-slate-900 font-bold text-lg mb-1">{street.name}</h4>
                        <p className="text-slate-600 text-sm mb-3">{street.neighborhood}</p>
                        
                        {/* Fit Score */}
                        <div className="bg-slate-100 rounded-lg p-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-slate-600 text-sm">Fit Score</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-emerald-600">
                                {street.fitScore.toFixed(1)}
                              </span>
                              {!isBaseline && baseStreet && (
                                <span className={`text-sm font-semibold ${
                                  street.fitScore > baseStreet.fitScore 
                                    ? 'text-emerald-600' 
                                    : street.fitScore < baseStreet.fitScore 
                                    ? 'text-rose-600' 
                                    : 'text-slate-600'
                                }`}>
                                  {street.fitScore > baseStreet.fitScore && '+'}
                                  {(street.fitScore - baseStreet.fitScore).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Feature Scores */}
                      <div className="space-y-2 mb-4">
                        <p className="text-slate-600 text-sm font-semibold mb-3">Your Priorities:</p>
                        {priorities.map((key, index) => {
                          const score = street.scores[key];
                          const diff = !isBaseline && baseStreet ? score - baseStreet.scores[key] : 0;
                          const config = featureConfig[key];
                          const priorityNum = index + 1;
                          const isTop3 = index < 3;

                          return (
                            <div
                              key={key}
                              className={`rounded-lg p-2 ${isTop3 ? 'bg-emerald-50/50' : 'bg-slate-50'}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium flex items-center gap-1.5 ${
                                  isTop3 ? 'text-emerald-700' : 'text-slate-700'
                                }`}>
                                  <span className="text-base">{config.icon}</span>
                                  {config.label}
                                  {isTop3 && <span className="text-xs">(P{priorityNum})</span>}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">{score}</span>
                                  {!isBaseline && diff !== 0 && (
                                    <span className={`flex items-center text-xs font-semibold min-w-[45px] justify-end ${
                                      diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}>
                                      {diff > 0 ? (
                                        <TrendingUp className="w-3 h-3 mr-0.5" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 mr-0.5" />
                                      )}
                                      {Math.abs(diff)}
                                    </span>
                                  )}
                                  {!isBaseline && diff === 0 && (
                                    <span className="text-xs text-slate-400 min-w-[45px] flex items-center justify-end">
                                      <Minus className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <Button
                          variant={isBookmarked ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onToggleBookmark(street.id)}
                          className={`w-full ${isBookmarked ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                          {isBookmarked ? 'Saved' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://www.apartments.com/atlanta-ga/?bb=${street.lat},${street.lng}`, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Rentals
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleCompare(street.id)}
                          className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Insights */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 shadow-lg">
            <h3 className="text-slate-900 font-semibold mb-4">Comparison Insights</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {compareList.map((street, index) => {
                const streetRank = allStreets.findIndex(s => s.id === street.id) + 1;
                const topPriority = priorities[0];
                const topScore = street.scores[topPriority];
                
                return (
                  <div key={street.id} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: clusterColors[street.cluster] }}
                      >
                        #{streetRank}
                      </div>
                      <span className="text-slate-900 font-semibold text-sm truncate">{street.name}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Overall Rank</span>
                        <span className="text-slate-900 font-semibold">#{streetRank} of {allStreets.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Your Top Priority</span>
                        <span className="text-slate-900 font-semibold">{topScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Cluster</span>
                        <span className="text-slate-900 font-semibold capitalize">
                          {street.cluster.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
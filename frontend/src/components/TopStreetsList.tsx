import { useState, useMemo, useEffect } from 'react';
import { Heart, Eye, Search, ArrowUpDown, MapPin, TrendingUp, Sparkles, X, CheckCircle2, ExternalLink, Map, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { FloatingCompareButton } from './FloatingCompareButton';
import { FloatingScoreLegend } from './FloatingScoreLegend';
import type { FeatureKey, UserProfile, Street } from '../App';
import { getAtlantaStreets, calculateFitScore } from '../utils/streetData';

type TopStreetsListProps = {
  priorities: FeatureKey[];
  topN: number;
  onTopNChange: (n: number) => void;
  onViewStreet: (streetId: string) => void;
  bookmarkedStreets: string[];
  onToggleBookmark: (streetId: string) => void;
  compareStreets: string[];
  onToggleCompare: (streetId: string) => void;
  onNavigate?: (screen: 'priorities' | 'map' | 'streets' | 'deepdive' | 'comparison' | 'export') => void;
  userProfile: UserProfile | null;
  backendStreets?: Street[] | null;
};

// ColorBrewer-inspired gradient colors without red - using blues, greens, and teals for clear distinction
const clusterColors = {
  'excellent': '#0891b2', // Cyan-600 - Most distinct
  'very-good': '#14b8a6', // Teal-500
  'good': '#10b981', // Emerald-500
  'fair': '#84cc16', // Lime-500
  'poor': '#64748b' // Slate-500
};

const clusterLabels = {
  'excellent': 'Excellent Fit',
  'very-good': 'Very Good Fit',
  'good': 'Good Fit',
  'fair': 'Fair Fit',
  'poor': 'Poor Fit'
};

const clusterRanges = {
  'excellent': '8.5-10',
  'very-good': '7.5-8.5',
  'good': '6-7.5',
  'fair': '4.5-6',
  'poor': '<4.5'
};

const featureLabels: Record<FeatureKey, string> = {
  crime: 'Safety',
  schools: 'Schools',
  martaStops: 'MARTA',
  restaurants: 'Restaurants',
  parks: 'Parks',
  grocery: 'Grocery',
  hospitals: 'Hospitals',
  policeStations: 'Police'
};

// Enhanced dynamic ranking explanations - Professional, distinct insights for each rank
const getRankingExplanation = (rank: number, street: any, priorities: FeatureKey[]): string => {
  const top3Priorities = priorities.slice(0, 3);
  const top3Scores = top3Priorities.map(p => ({ 
    feature: featureLabels[p], 
    score: street.scores[p],
    key: p
  }));
  
  // Calculate weights for top 3
  const weights = top3Priorities.map((_, idx) => priorities.length - idx);
  
  // Build detailed explanation
  const priority1 = top3Scores[0];
  const priority2 = top3Scores[1];
  const priority3 = top3Scores[2];
  
  // Calculate average of top 3 priorities
  const avgTop3 = (priority1.score + priority2.score + priority3.score) / 3;
  
  if (rank === 1) {
    if (priority1.score >= 90 && avgTop3 >= 85) {
      return `This street achieves the #1 ranking through exceptional performance across your highest priorities. Your top priority, ${priority1.feature}, scores ${priority1.score}/100 with a ${weights[0]}× multiplier. Combined with strong ${priority2.feature} (${priority2.score}/100, ${weights[1]}× weight) and ${priority3.feature} (${priority3.score}/100, ${weights[2]}× weight), this location delivers the highest weighted fit score in the dataset.`;
    } else if (priority1.score >= 80) {
      return `Ranked #1 due to superior weighted balance across your priority matrix. While ${priority1.feature} scores ${priority1.score}/100 (Priority 1, ${weights[0]}× multiplier), the cumulative advantage comes from consistently high marks in ${priority2.feature} (${priority2.score}/100) and ${priority3.feature} (${priority3.score}/100). This demonstrates well-rounded excellence in your key criteria.`;
    } else {
      return `This location ranks first through optimal weighted distribution rather than single-feature dominance. The algorithm weights ${priority1.feature} (${priority1.score}/100) at ${weights[0]}×, which combines with ${priority2.feature} (${priority2.score}/100, ${weights[1]}×) and ${priority3.feature} (${priority3.score}/100, ${weights[2]}×) to produce the strongest aggregate score. Strategic balance yields the top position.`;
    }
  } else if (rank === 2) {
    const scoreDiff = Math.abs(priority1.score - 85);
    if (scoreDiff < 5) {
      return `Securing the #2 position with competitive scores: ${priority1.feature} at ${priority1.score}/100 (${weights[0]}× priority weight), ${priority2.feature} at ${priority2.score}/100, and ${priority3.feature} at ${priority3.score}/100. The weighted calculation places this marginally below #1, typically by 0.5-1.5 points in the final fit score—a negligible difference worth investigating further.`;
    } else {
      return `Ranked #2 based on strong but slightly asymmetric performance. Your top priority ${priority1.feature} scores ${priority1.score}/100 with maximum ${weights[0]}× weighting. Supporting priorities ${priority2.feature} (${priority2.score}/100) and ${priority3.feature} (${priority3.score}/100) contribute solid weighted points. The gap to #1 suggests minor trade-offs in your highest-weighted features.`;
    }
  } else if (rank === 3) {
    return `Third-ranked through respectable performance in your priority hierarchy. Scores of ${priority1.score}/100 for ${priority1.feature} (${weights[0]}× weight), ${priority2.score}/100 for ${priority2.feature}, and ${priority3.score}/100 for ${priority3.feature} position this as a viable alternative. The ranking reflects either lower absolute scores in top priorities or variance in mid-tier features—both worth evaluating against your flexibility on key criteria.`;
  } else if (rank <= 5) {
    return `Positioned at #${rank} with moderate alignment to your priority structure. ${priority1.feature} registers ${priority1.score}/100 (${weights[0]}× multiplier), while ${priority2.feature} and ${priority3.feature} contribute ${priority2.score}/100 and ${priority3.score}/100 respectively. This tier often represents locations where lower-weighted features excel but top priorities show average performance—valuable if your stated preferences have flexibility.`;
  } else if (rank <= 10) {
    return `Ranked #${rank} in the middle tier. Performance metrics: ${priority1.feature} ${priority1.score}/100, ${priority2.feature} ${priority2.score}/100, ${priority3.feature} ${priority3.score}/100. Streets in positions 6-10 typically show inconsistent scoring patterns—excelling in some lower-priority features while underperforming in your highest-weighted criteria. Consider if trade-offs align with real-world needs.`;
  } else {
    return `Position #${rank} indicates limited alignment with your stated priorities. Scoring ${priority1.score}/100 on ${priority1.feature}, ${priority2.score}/100 on ${priority2.feature}, and ${priority3.score}/100 on ${priority3.feature}. Lower rankings often signal either gaps in your top priorities or strong performance in features you rated less important. Useful for exploring whether priority adjustments might reveal hidden gems.`;
  }
};

const getPerformanceInsight = (street: any, priorities: FeatureKey[]): string => {
  const top3Priorities = priorities.slice(0, 3);
  const top3Scores = top3Priorities.map(p => street.scores[p]);
  const avgTop3 = top3Scores.reduce((a, b) => a + b, 0) / top3Scores.length;
  
  // Calculate variance to detect consistency
  const variance = top3Scores.reduce((sum, score) => sum + Math.pow(score - avgTop3, 2), 0) / top3Scores.length;
  const isConsistent = variance < 50;
  
  if (avgTop3 >= 90) {
    return isConsistent ? 'Outstanding consistency across all top priorities' : 'Exceptional peak performance with some variance';
  } else if (avgTop3 >= 80) {
    return isConsistent ? 'Uniformly strong in your most important areas' : 'Strong overall with strategic trade-offs';
  } else if (avgTop3 >= 70) {
    return isConsistent ? 'Balanced moderate performance across priorities' : 'Mixed results in priority features';
  } else if (avgTop3 >= 60) {
    return 'Average fit with notable gaps in key areas';
  } else {
    return 'Significant shortfalls in your top-ranked priorities';
  }
};

export function TopStreetsList({
  priorities,
  topN,
  onTopNChange,
  onViewStreet,
  bookmarkedStreets,
  onToggleBookmark,
  compareStreets,
  onToggleCompare,
  onNavigate,
  userProfile,
  backendStreets
}: TopStreetsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'fit' | FeatureKey>('fit');

  const streets = useMemo(() => {
    if (backendStreets && backendStreets.length > 0) {
      // Use enriched neighborhood name from backend, fallback to id (hex_id) if missing
      return backendStreets.map(s => {
        let n = '';
        if (s.neighborhood && typeof s.neighborhood === 'string' && s.neighborhood.trim() !== '') {
          n = s.neighborhood.split(',')[0];
        } else if (s.name && typeof s.name === 'string' && s.name.trim() !== '') {
          n = s.name.split(',')[0];
        }
        const displayName = n !== '' ? n : (s.id || 'unknown');
        return {
          ...s,
          name: displayName,
          neighborhood: displayName
        };
      });
    }
    const allStreets = getAtlantaStreets();
    return allStreets.map(street => {
      let n = '';
      if (street.neighborhood && typeof street.neighborhood === 'string' && street.neighborhood.trim() !== '') {
        n = street.neighborhood.split(',')[0];
      } else if (street.name && typeof street.name === 'string' && street.name.trim() !== '') {
        n = street.name.split(',')[0];
      }
      const displayName = n !== '' ? n : (street.id || 'unknown');
      return {
        ...street,
        fitScore: calculateFitScore(street, priorities),
        name: displayName,
        neighborhood: displayName
      };
    });
  }, [priorities, backendStreets]);

  const filteredAndSortedStreets = useMemo(() => {
    let result = streets.filter(street =>
      street.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      street.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'fit') {
      result = result.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
    } else {
      result = result.sort((a, b) => b.scores[sortBy] - a.scores[sortBy]);
    }

    return result.slice(0, topN);
  }, [streets, searchQuery, sortBy, topN]);

  const getTopContributingFeatures = (street: typeof streets[0]) => {
    // Calculate contribution based on priority position (Priority 1 = highest weight)
    return priorities
      .map((key, index) => {
        const priorityNum = index + 1;
        const weight = priorities.length - index; // Priority 1 gets highest weight
        return {
          key,
          priorityNum,
          weight,
          score: street.scores[key],
          contribution: street.scores[key] * weight
        };
      })
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
  };

  const compareStreetsData = compareStreets.map(id => 
    filteredAndSortedStreets.find(s => s.id === id)
  ).filter(Boolean);

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
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
            <div className="mb-4">
              <h1 className="text-slate-900 mb-1">Your Personalized Street Rankings</h1>
              <p className="text-slate-600">
                Streets ranked by fit score based on your priority preferences • Top {topN} matches shown
              </p>
            </div>
            
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search streets or neighborhoods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val as any)}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fit">By Fit Score</SelectItem>
                  <SelectItem value="restaurants">By Restaurants</SelectItem>
                  <SelectItem value="crime">By Safety</SelectItem>
                  <SelectItem value="hospitals">By Hospitals</SelectItem>
                  <SelectItem value="schools">By Schools</SelectItem>
                  <SelectItem value="parks">By Parks</SelectItem>
                  <SelectItem value="grocery">By Grocery</SelectItem>
                  <SelectItem value="policeStations">By Police</SelectItem>
                  <SelectItem value="martaStops">By MARTA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Search Location & Radius Display */}
          {userProfile?.location && userProfile?.radius && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-amber-900 font-semibold mb-1">
                    Search Center & Radius Applied
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-amber-800">
                    <span className="font-mono">
                      📍 {userProfile.location.lat.toFixed(4)}°, {userProfile.location.lng.toFixed(4)}°
                    </span>
                    <span className="text-amber-600 hidden sm:inline">•</span>
                    <span className="font-semibold">
                      ⭕ {userProfile.radius} {userProfile.radius === 1 ? 'mile' : 'miles'} radius
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top N Control */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-shadow duration-300 max-w-md">
            <h3 className="text-slate-900 mb-4 font-semibold">Results Displayed</h3>
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 text-sm">Select any number 1-20</p>
              <div className="text-4xl bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">{topN}</div>
            </div>
            <Slider
              value={[topN]}
              onValueChange={(val: number[]) => onTopNChange(val[0])}
              min={1}
              max={20}
              step={1}
            />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-slate-500">1 street</span>
              <span className="text-slate-500">10 streets</span>
              <span className="text-slate-500">20 streets</span>
            </div>
          </div>

          {/* Compare Mode Panel - Floating */}
          {compareStreets.length > 0 && (
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl p-4 sm:p-6 text-white shadow-xl border-2 border-blue-400">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="font-bold text-lg">
                      {compareStreets.length} Street{compareStreets.length !== 1 ? 's' : ''} Selected for Comparison
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {compareStreetsData.map((street) => (
                      <div
                        key={street?.id}
                        className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2"
                      >
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {street?.name}
                        </span>
                        <button
                          onClick={() => onToggleCompare(street?.id || '')}
                          className="hover:bg-white/20 rounded p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      onClick={() => onNavigate?.('comparison')}
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg flex-1"
                    >
                      <TrendingUp className="w-5 h-5 mr-2" />
                      View Side-by-Side Comparison
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => compareStreets.forEach(id => onToggleCompare(id))}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                💡
              </div>
              <div>
                <p className="text-blue-900 font-semibold mb-1">Compare up to 3 streets side-by-side</p>
                <p className="text-blue-700 text-sm">
                  Click "Add to Compare" on any street below. When ready, click "View Side-by-Side Comparison" to analyze differences.
                </p>
              </div>
            </div>
          </div>

          {/* Street List */}
          <div className="space-y-4">
            {filteredAndSortedStreets.map((street, index) => {
              const topFeatures = getTopContributingFeatures(street);
              const isBookmarked = bookmarkedStreets.includes(street.id);
              const isInCompare = compareStreets.includes(street.id);
              const rank = index + 1;
              const rankExplanation = getRankingExplanation(rank, street, priorities);
              const performanceInsight = getPerformanceInsight(street, priorities);

              return (
                <div
                  key={street.id}
                  className={`bg-white/95 backdrop-blur-sm rounded-2xl border-2 hover:shadow-xl transition-all ${
                    isInCompare ? 'border-purple-500 shadow-lg ring-2 ring-purple-200' :
                    rank === 1 ? 'border-blue-400 shadow-md' : 
                    rank === 2 ? 'border-purple-400 shadow-md' : 
                    rank === 3 ? 'border-cyan-400 shadow-md' : 
                    'border-slate-200'
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    {/* Compare Badge */}
                    {isInCompare && (
                      <div className="mb-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-700 text-sm font-semibold">Added to comparison</span>
                        </div>
                        <button
                          onClick={() => onToggleCompare(street.id)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Header Row */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Rank Badge */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: clusterColors[street.cluster] }}
                      >
                        <span className="text-xl font-bold">#{rank}</span>
                      </div>

                      {/* Street Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            {/* Main title: location name */}
                            <h3 className="text-slate-900 font-bold mb-1">{street.neighborhood}</h3>
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span>{street.neighborhood}</span>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-3xl bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                              {(street.fitScore ?? 0).toFixed(1)}
                            </div>
                            <p className="text-slate-500 text-sm font-medium">fit score</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Why This Ranks */}
                    <div className={`p-3 rounded-xl mb-4 border ${
                      rank === 1 ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' :
                      rank === 2 ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' :
                      rank === 3 ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200' :
                      'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          rank === 1 ? 'text-blue-600' :
                          rank === 2 ? 'text-purple-600' :
                          rank === 3 ? 'text-cyan-600' :
                          'text-slate-600'
                        }`} />
                        <div>
                          <p className="text-slate-900 text-sm font-medium mb-1">{rankExplanation}</p>
                          <p className="text-slate-600 text-xs italic">{performanceInsight}</p>
                        </div>
                      </div>
                    </div>

                    {/* Feature Breakdown */}
                    <div className="mb-4">
                      <p className="text-slate-700 text-sm mb-3 font-semibold">Top Contributing Features:</p>
                      <div className="space-y-2">
                        {topFeatures.map((feature, idx) => (
                          <div key={feature.key} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-slate-800 text-sm font-medium flex items-center gap-2">
                                  <span className="text-base">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                  </span>
                                  {featureLabels[feature.key]}
                                </span>
                                <span className="text-slate-700 text-sm font-semibold">
                                  {feature.score}/100
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className={`h-full rounded-full ${
                                    idx === 0 ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                                    idx === 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                    'bg-gradient-to-r from-cyan-500 to-blue-500'
                                  }`}
                                  style={{ width: `${feature.score}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewStreet(street.id)}
                        className="flex-1 sm:flex-none border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate?.('map')}
                        className="flex-1 sm:flex-none border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Map className="w-4 h-4 mr-2" />
                        View on Map
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.apartments.com/atlanta-ga/${street.lat},${street.lng}`, '_blank')}
                        className="flex-1 sm:flex-none border-teal-200 text-teal-600 hover:bg-teal-50"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Rentals
                      </Button>
                      <Button
                        variant={isBookmarked ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onToggleBookmark(street.id)}
                        className={`flex-1 sm:flex-none ${
                          isBookmarked 
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600' 
                            : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`}
                        />
                        {isBookmarked ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        variant={isInCompare ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onToggleCompare(street.id)}
                        disabled={!isInCompare && compareStreets.length >= 3}
                        className={`flex-1 sm:flex-none ${
                          isInCompare 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' 
                            : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        {isInCompare ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            In Compare
                          </>
                        ) : (
                          <>
                            Add to Compare ({compareStreets.length}/3)
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAndSortedStreets.length === 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-12 text-center shadow-md">
              <p className="text-slate-600">No streets found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Compare Button */}
      <FloatingCompareButton
        compareStreets={compareStreets}
        onNavigateToCompare={() => onNavigate?.('comparison')}
        onRemoveStreet={onToggleCompare}
      />

      {/* Floating Score Legend */}
      <FloatingScoreLegend />
    </div>
  );
}
import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import type { Neighborhood, Priorities } from '../App';

type NeighborhoodRankingsProps = {
  neighborhoods: (Neighborhood & { weightedScore: number })[];
  priorities: Priorities;
  selectedNeighborhood: string | null;
  onSelectNeighborhood: (id: string | null) => void;
  compareList: string[];
  onToggleCompare: (id: string) => void;
};

export function NeighborhoodRankings({
  neighborhoods,
  priorities,
  selectedNeighborhood,
  onSelectNeighborhood,
  compareList,
  onToggleCompare
}: NeighborhoodRankingsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(neighborhoods[0]?.id || null);

  const getFactorBreakdown = (neighborhood: Neighborhood) => {
    const factors = [
      { key: 'safety', label: 'Safety', value: neighborhood.scores.safety, weight: priorities.safety, color: 'emerald' },
      { key: 'schools', label: 'Schools', value: neighborhood.scores.schools, weight: priorities.schools, color: 'blue' },
      { key: 'transit', label: 'Transit', value: neighborhood.scores.transit, weight: priorities.transit, color: 'purple' },
      { key: 'amenities', label: 'Amenities', value: neighborhood.scores.amenities, weight: priorities.amenities, color: 'orange' },
      { key: 'affordability', label: 'Affordability', value: neighborhood.scores.affordability, weight: priorities.affordability, color: 'pink' }
    ];

    return factors.sort((a, b) => (b.value * b.weight) - (a.value * a.weight));
  };

  const getAnalysis = (neighborhood: Neighborhood, factors: ReturnType<typeof getFactorBreakdown>) => {
    const topFactors = factors.slice(0, 2);
    const topFactorNames = topFactors.map(f => f.label.toLowerCase()).join(', ');
    
    return `Strong performance in ${topFactorNames}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-900">Rankings</h3>
        <p className="text-slate-600">{neighborhoods.length} areas</p>
      </div>

      <div className="space-y-3">
        {neighborhoods.map((neighborhood, index) => {
          const isExpanded = expandedId === neighborhood.id;
          const isSelected = selectedNeighborhood === neighborhood.id;
          const isInCompare = compareList.includes(neighborhood.id);
          const factors = getFactorBreakdown(neighborhood);
          const analysis = getAnalysis(neighborhood, factors);

          return (
            <div
              key={neighborhood.id}
              className={`border rounded-xl transition-all ${
                isSelected
                  ? 'border-emerald-500 shadow-sm'
                  : 'border-slate-200'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      index === 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-slate-900">{neighborhood.name}</h4>
                      {index < 3 && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <p className="text-slate-500">{neighborhood.zone}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-slate-900">
                      {neighborhood.weightedScore.toFixed(1)}
                    </div>
                    <p className="text-slate-500">score</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isInCompare ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onToggleCompare(neighborhood.id)}
                      disabled={!isInCompare && compareList.length >= 3}
                    >
                      {isInCompare ? 'Added' : 'Compare'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : neighborhood.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                    <div>
                      <p className="text-slate-900 mb-3">Factor Breakdown</p>
                      <div className="space-y-3">
                        {factors.map(factor => {
                          const contribution = (factor.value * factor.weight) / 100;
                          const maxContribution = Math.max(...factors.map(f => (f.value * f.weight) / 100));
                          const percentage = maxContribution > 0 ? (contribution / maxContribution) * 100 : 0;

                          return (
                            <div key={factor.key}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-900">{factor.label}</span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-500">Score: {factor.value}</span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-500">Weight: {factor.weight}%</span>
                                </div>
                                <span className="text-slate-900">
                                  +{contribution.toFixed(1)}
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-${factor.color}-500 rounded-full transition-all`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-900 mb-1">Analysis</p>
                      <p className="text-slate-600">{analysis}</p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectNeighborhood(
                        isSelected ? null : neighborhood.id
                      )}
                      className="w-full"
                    >
                      {isSelected ? 'Deselect on Map' : 'Locate on Map'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

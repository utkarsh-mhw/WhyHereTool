import { Shield, GraduationCap, Train, UtensilsCrossed, Trees, ShoppingCart, Hospital, ShieldAlert, Lightbulb } from 'lucide-react';
import type { Street, FeatureKey } from '../App';
import { generateRankingExplanation, generateNeighborhoodInsights, getFeatureDisplayName } from '../utils/streetData';

type FeatureSummaryCardProps = {
  street: Street;
  rank: number;
  priorities: FeatureKey[];
  matchScore: number;
};

const featureConfig: Record<FeatureKey, { icon: any; color: string; bgColor: string }> = {
  crime: {
    icon: Shield,
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  schools: {
    icon: GraduationCap,
    color: '#a855f7',
    bgColor: '#f3e8ff'
  },
  restaurants: {
    icon: UtensilsCrossed,
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  parks: {
    icon: Trees,
    color: '#22c55e',
    bgColor: '#dcfce7'
  },
  martaStops: {
    icon: Train,
    color: '#a855f7',
    bgColor: '#f3e8ff'
  },
  grocery: {
    icon: ShoppingCart,
    color: '#ec4899',
    bgColor: '#fce7f3'
  },
  hospitals: {
    icon: Hospital,
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  policeStations: {
    icon: ShieldAlert,
    color: '#06b6d4',
    bgColor: '#cffafe'
  }
};

export function FeatureSummaryCard({ street, rank, priorities, matchScore }: FeatureSummaryCardProps) {
  const reasons = generateRankingExplanation(street, rank, priorities);
  const insights = generateNeighborhoodInsights(street, priorities);
  
  // Get top 6 features to display (prioritize user's top priorities)
  const topPriorities = priorities.slice(-3).reverse();
  const otherFeatures = priorities.filter(p => !topPriorities.includes(p)).slice(-3);
  const displayFeatures = [...topPriorities, ...otherFeatures];

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-t-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <span className="text-xs">Top Pick</span>
            </div>
            <h3 className="mb-1">{street.neighborhood}</h3>
            <p className="text-emerald-100">{street.name}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-1">{matchScore.toFixed(1)}</div>
            <p className="text-xs text-emerald-100">Match Score</p>
          </div>
        </div>
      </div>

      {/* Feature Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {displayFeatures.map(feature => {
            const config = featureConfig[feature];
            const Icon = config.icon;
            const score = street.scores[feature];
            const displayName = getFeatureDisplayName(feature, 'short');
            
            return (
              <div key={feature}>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <span className="text-slate-700">{displayName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${score}%`,
                        backgroundColor: config.color
                      }}
                    />
                  </div>
                  <span className="text-slate-900 w-12 text-right">{score}/100</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-200 mb-4">
          <div>
            <p className="text-slate-600 mb-1">Median Price</p>
            <p className="text-slate-900">$425K</p>
          </div>
          <div>
            <p className="text-slate-600 mb-1">Nearby Stores</p>
            <p className="text-slate-900">{Math.round(street.scores.grocery / 8)}</p>
          </div>
          <div>
            <p className="text-slate-600 mb-1">Health Facilities</p>
            <p className="text-slate-900">{Math.round(street.scores.hospitals / 10)}</p>
          </div>
        </div>

        {/* Why This Ranks */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <h4 className="text-slate-900">Why This Ranks #{rank}</h4>
          </div>
          <ul className="space-y-1.5 ml-7">
            {reasons.map((reason, index) => (
              <li key={index} className="text-slate-700 text-sm">
                • {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">💡</div>
            <div>
              <h4 className="text-slate-900 mb-1">Insights</h4>
              <p className="text-slate-700 text-sm">{insights}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

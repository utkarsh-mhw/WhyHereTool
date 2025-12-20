import { useState } from 'react';
import { Shield, GraduationCap, Train, UtensilsCrossed, Trees, ShoppingCart, Hospital, ShieldAlert, ChevronLeft, Sparkles, GripVertical, MoveUp, MoveDown } from 'lucide-react';
import { Button } from './ui/button';
import type { FeatureKey } from '../App';

type FeaturePrioritiesProps = {
  priorities: FeatureKey[];
  onPrioritiesChange: (priorities: FeatureKey[]) => void;
  onRunAnalysis: () => void;
  onBack: () => void;
};

const featureConfig: Record<FeatureKey, { icon: any; label: string; description: string; color: string; bgColor: string; textColor: string }> = {
  crime: {
    icon: Shield,
    label: 'Safety (Low Crime)',
    description: 'Crime rates and incident reports',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600'
  },
  schools: {
    icon: GraduationCap,
    label: 'Schools',
    description: 'Quality ratings from GA Education',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  martaStops: {
    icon: Train,
    label: 'MARTA Stops',
    description: 'Public transit accessibility',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  restaurants: {
    icon: UtensilsCrossed,
    label: 'Restaurants',
    description: 'Dining options within walking distance',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  },
  parks: {
    icon: Trees,
    label: 'Parks',
    description: 'Green spaces and recreation areas',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  grocery: {
    icon: ShoppingCart,
    label: 'Grocery Stores',
    description: 'Supermarkets and fresh food access',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600'
  },
  hospitals: {
    icon: Hospital,
    label: 'Hospitals',
    description: 'Healthcare facility accessibility',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600'
  },
  policeStations: {
    icon: ShieldAlert,
    label: 'Police Stations',
    description: 'Law enforcement presence',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600'
  }
};

export function FeaturePriorities({
  priorities,
  onPrioritiesChange,
  onRunAnalysis,
  onBack
}: FeaturePrioritiesProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPriorities = [...priorities];
    const draggedItem = newPriorities[draggedIndex];
    newPriorities.splice(draggedIndex, 1);
    newPriorities.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onPrioritiesChange(newPriorities);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const newPriorities = [...priorities];
    [newPriorities[index], newPriorities[index - 1]] = [newPriorities[index - 1], newPriorities[index]];
    onPrioritiesChange(newPriorities);
  };

  const moveDown = (index: number) => {
    if (index >= priorities.length - 1) return;
    const newPriorities = [...priorities];
    [newPriorities[index], newPriorities[index + 1]] = [newPriorities[index + 1], newPriorities[index]];
    onPrioritiesChange(newPriorities);
  };

  const handleReset = () => {
    onPrioritiesChange([
      'crime',
      'martaStops',
      'schools',
      'restaurants',
      'parks',
      'grocery',
      'hospitals',
      'policeStations'
    ]);
  };

  // Top 3 priorities are the first 3 items in the array
  const topPriorities = priorities.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24 relative overflow-hidden">
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
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="text-center">
              <h2 className="text-slate-900">Set Your Priorities</h2>
              <p className="text-slate-600">Top = Highest Priority • Bottom = Lowest Priority</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Priority Explanation */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-slate-900 mb-2">How Priority Ranking Works</h3>
              <p className="text-slate-700 mb-3">
                Drag and drop features to set your priorities. The <span className="text-emerald-600 font-semibold">top item</span> is your <span className="text-emerald-600 font-semibold">highest priority (Priority 1)</span>, 
                and items lower down have <span className="text-slate-600">decreasing priority</span>.
              </p>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-slate-300 rounded" />
                  <span>High Priority (Top) → Low Priority (Bottom)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sortable Feature List - FIRST */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Drag to Reorder Your Priorities</h3>
          <div className="space-y-2">
            {priorities.map((key, index) => {
              const config = featureConfig[key];
              const Icon = config.icon;
              const priorityLevel = index + 1; // Priority 1, 2, 3, etc.
              const isTop3 = index < 3; // Top 3 are highest priority
              
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-move ${
                    draggedIndex === index
                      ? 'border-emerald-500 shadow-lg scale-105 bg-emerald-50'
                      : isTop3
                      ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`${isTop3 ? 'text-slate-900 font-semibold' : 'text-slate-900'}`}>{config.label}</p>
                    <p className="text-slate-600">{config.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full ${isTop3 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <span className={isTop3 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                        Priority {priorityLevel}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index <= 0}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up (higher priority)"
                      >
                        <MoveUp className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index >= priorities.length - 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down (lower priority)"
                      >
                        <MoveDown className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your Top Priorities - AFTER */}
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 shadow-lg">
          <h3 className="text-slate-900 mb-4">Your Top 3 Priorities</h3>
          <div className="space-y-3">
            {topPriorities.map((key, displayIndex) => {
              const config = featureConfig[key];
              const Icon = config.icon;
              const priorityNumber = displayIndex + 1;
              
              return (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 font-bold border-2 border-emerald-500">
                    {priorityNumber}
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900 font-semibold">{config.label}</p>
                    <p className="text-slate-600 text-sm">Highest importance in ranking</p>
                  </div>
                  <div className="text-2xl">🏆</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Visualization - Weight Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-2">Priority Weight Distribution</h3>
          <p className="text-slate-600 mb-4">
            <span className="text-emerald-600 font-semibold">Priority 1</span> (top of list) has the <span className="text-emerald-600 font-semibold">highest weight</span> and most impact on recommendations
          </p>
          <div className="space-y-2">
            {priorities.map((key, index) => {
              const config = featureConfig[key];
              const priorityNumber = index + 1; // Priority 1, 2, 3, etc.
              const weight = priorities.length - index; // Priority 1 gets weight 8, Priority 8 gets weight 1
              const maxWeight = priorities.length;
              const percentage = (weight / maxWeight) * 100;
              const isTop3 = index < 3;
              // Show weight inside bar if it fits (12.5% threshold means all weights show inside for 8 priorities)
              const showInside = percentage >= 12;
              
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`w-32 truncate text-sm ${isTop3 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                    P{priorityNumber}: {config.label}
                  </span>
                  <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full flex items-center justify-end pr-3 transition-all ${
                        isTop3 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-slate-400 to-slate-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    >
                      {showInside && (
                        <span className="text-white font-semibold text-sm">×{weight}</span>
                      )}
                    </div>
                  </div>
                  {!showInside && (
                    <span className={`w-10 text-sm ${isTop3 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                      ×{weight}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <p className="text-slate-700 text-sm">
              <span className="text-lg mr-2">💡</span>
              Your <span className="text-emerald-700 font-semibold">{featureConfig[priorities[0]].label}</span> (Priority 1) has a weight multiplier of <span className="text-emerald-700 font-semibold">×{priorities.length}</span>, 
              making it <span className="text-emerald-700 font-semibold">{priorities.length}x more impactful</span> than your lowest priority when calculating neighborhood fit scores.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={onRunAnalysis}
          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
        >
          Run Analysis with These Priorities
        </Button>
      </div>
    </div>
  );
}
import { Info } from 'lucide-react';

// ColorBrewer-inspired gradient colors without red - using blues, greens, and teals for clear distinction
const clusterColors = {
  'excellent': '#0891b2', // Cyan-600 - Most distinct
  'very-good': '#14b8a6', // Teal-500
  'good': '#10b981', // Emerald-500
  'fair': '#84cc16', // Lime-500
  'poor': '#64748b' // Slate-500
};

const clusterLabels = {
  'excellent': 'Excellent',
  'very-good': 'Very Good',
  'good': 'Good',
  'fair': 'Fair',
  'poor': 'Poor'
};

const clusterRanges = {
  'excellent': '8.5-10',
  'very-good': '7.5-8.5',
  'good': '6-7.5',
  'fair': '4.5-6',
  'poor': '<4.5'
};

export function FloatingScoreLegend() {
  return (
    <div className="fixed bottom-20 left-6 z-40 block animate-in slide-in-from-left-5">
      <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-emerald-200 p-3 w-48">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md flex items-center justify-center">
            <Info className="w-3 h-3 text-white" />
          </div>
          <h3 className="text-slate-900 font-semibold text-sm">Score Guide</h3>
        </div>
        
        <div className="space-y-1.5">
          {(Object.keys(clusterLabels) as Array<keyof typeof clusterLabels>).map((key) => (
            <div 
              key={key}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: clusterColors[key] }}
                />
                <span className="text-xs font-medium text-slate-700">
                  {clusterLabels[key]}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {clusterRanges[key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
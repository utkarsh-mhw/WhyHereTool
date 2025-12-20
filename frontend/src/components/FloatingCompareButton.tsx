import { GitCompare, X } from 'lucide-react';
import { Button } from './ui/button';
import { getAtlantaStreets } from '../utils/streetData';

type FloatingCompareButtonProps = {
  compareStreets: string[];
  onNavigateToCompare: () => void;
  onRemoveStreet: (streetId: string) => void;
};

export function FloatingCompareButton({ 
  compareStreets, 
  onNavigateToCompare,
  onRemoveStreet 
}: FloatingCompareButtonProps) {
  if (compareStreets.length === 0) return null;

  const streets = getAtlantaStreets();
  const compareList = compareStreets.map(id => streets.find(s => s.id === id)).filter(Boolean);

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-purple-300 overflow-hidden max-w-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <GitCompare className="w-4 h-4" />
              <span className="font-semibold text-sm">View Comparisons</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-xs font-bold">
              {compareStreets.length}/3
            </div>
          </div>
        </div>

        {/* Street List */}
        <div className="p-3">
          <div className="space-y-1.5 mb-3">
            {compareList.map((street) => (
              <div
                key={street!.id}
                className="flex items-center justify-between gap-2 bg-purple-50 rounded-lg px-2.5 py-1.5 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">
                    {street!.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {street!.neighborhood}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveStreet(street!.id)}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Compare Button */}
          <Button
            onClick={onNavigateToCompare}
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white shadow-lg"
            size="sm"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Now
          </Button>

          {compareStreets.length < 3 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Add {3 - compareStreets.length} more to compare
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
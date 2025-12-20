import { useState, useMemo } from 'react';
import { Download, Star, RotateCcw, CheckCircle, TrendingUp, MapPin, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import type { FeatureKey, Street } from '../App';
import { getAtlantaStreets, calculateFitScore } from '../utils/streetData';

type ExportWrapUpProps = {
  priorities: FeatureKey[];
  bookmarkedStreets: string[];
  onRestart: () => void;
  onNavigate: (screen: 'priorities' | 'map' | 'streets' | 'deepdive' | 'export') => void;
  onToggleBookmark?: (streetId: string) => void;
  // backendStreets: prefer these (populated by ClusterMap) so export uses real results
  backendStreets?: Street[] | null;
};

const featureLabels: Record<string, string> = {
  crime: 'Safety',
  schools: 'Schools',
  martaStops: 'MARTA Stops',
  restaurants: 'Restaurants',
  parks: 'Parks',
  grocery: 'Grocery Stores',
  hospitals: 'Hospitals',
  policeStations: 'Police Stations',
  coffeeShops: 'Coffee Shops',
  nightlife: 'Nightlife',
  gyms: 'Gyms & Fitness',
  libraries: 'Libraries'
};

export function ExportWrapUp({
  priorities,
  bookmarkedStreets,
  onRestart,
  onNavigate,
  onToggleBookmark,
  backendStreets
}: ExportWrapUpProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [exported, setExported] = useState(false);

  const streets = useMemo(() => {
    // Prefer backend-provided streets (already scored) if available
    if (backendStreets && backendStreets.length > 0) {
      // Copy to avoid mutating parent state
      return [...backendStreets].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
    }

    // Fallback to local dataset and compute fit score
    const allStreets = getAtlantaStreets();
    return allStreets.map(street => ({
      ...street,
      fitScore: calculateFitScore(street, priorities)
    })).sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
  }, [priorities, backendStreets]);

  const topStreets = streets.slice(0, 10);
  const bookmarked = streets.filter(s => bookmarkedStreets.includes(s.id));
  const avgFitScore = topStreets.length ? topStreets.reduce((sum, s) => sum + (s.fitScore ?? 0), 0) / topStreets.length : 0;

  const handleExportCSV = () => {
    // Prepare CSV data
    const headers = [
      'Rank',
      'Street Name',
      'Neighborhood',
      'Fit Score',
      'Safety',
      'Schools',
      'MARTA',
      'Restaurants',
      'Parks',
      'Grocery',
      'Hospitals',
      'Police',
      'Coffee',
      'Nightlife',
      'Gyms',
      'Libraries',
      'Bookmarked'
    ];

    const rows = streets.map((street, index) => [
  index + 1,
  // Use enriched neighborhood name from backend, fallback to hex_id if missing
  (() => {
    let n = '';
    if (street.neighborhood && typeof street.neighborhood === 'string' && street.neighborhood.trim() !== '') {
      n = street.neighborhood.split(',')[0];
    } else if (street.name && typeof street.name === 'string' && street.name.trim() !== '') {
      n = street.name.split(',')[0];
    }
    return n !== '' ? n : (street.id || 'unknown');
  })(),
  (() => {
    let n = '';
    if (street.neighborhood && typeof street.neighborhood === 'string' && street.neighborhood.trim() !== '') {
      n = street.neighborhood.split(',')[0];
    } else if (street.name && typeof street.name === 'string' && street.name.trim() !== '') {
      n = street.name.split(',')[0];
    }
    return n !== '' ? n : (street.id || 'unknown');
  })(),
  (street.fitScore ?? 0).toFixed(2),
  street.scores.crime ?? '',
  street.scores.schools ?? '',
  street.scores.martaStops ?? '',
  street.scores.restaurants ?? '',
  street.scores.parks ?? '',
  street.scores.grocery ?? '',
  street.scores.hospitals ?? '',
  street.scores.policeStations ?? '',
  // optional / extended fields - fill with blank if missing
  ((street.scores as any).coffeeShops ?? ''),
  ((street.scores as any).nightlife ?? ''),
  ((street.scores as any).gyms ?? ''),
  ((street.scores as any).libraries ?? ''),
      bookmarkedStreets.includes(street.id) ? 'Yes' : 'No'
    ]);

    // Add priorities as metadata
    const priorityRows = [
      [''],
      ['Your Priority Rankings (Higher = More Important):'],
      ...priorities.map((key, index) => [
        featureLabels[key],
        `Priority ${index + 1}`
      ])
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      ...priorityRows.map(row => row.join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `whyhere-atlanta-analysis-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExported(true);
  };

  const topPriorities = priorities.slice(-3).reverse(); // Top 3 priorities

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
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-lg relative">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h2 className="text-slate-900">Your Atlanta Shortlist</h2>
          <p className="text-slate-600">Review and export your personalized recommendations</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Summary Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-emerald-600">{avgFitScore.toFixed(1)}</div>
                <p className="text-slate-600">Avg Fit Score</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-blue-600">{topStreets.length}</div>
                <p className="text-slate-600">Top Matches</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <div className="text-rose-600">{bookmarked.length}</div>
                <p className="text-slate-600">Bookmarked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Priorities */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Your Top 3 Priorities</h3>
          <div className="space-y-3">
            {topPriorities.map((key, displayIndex) => {
              const actualRank = displayIndex + 1;
              const priorityLevel = priorities.length - displayIndex;
              
              return (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    {actualRank}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="text-slate-900 font-medium">
                        {featureLabels[key]}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                        style={{ width: `${(priorityLevel / priorities.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Streets Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Your Top Streets</h3>
          <div className="space-y-2">
            {topStreets.slice(0, 5).map((street, index) => (
              <div
                key={street.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900">{street.name}</p>
                  <p className="text-slate-600">{street.neighborhood}</p>
                </div>
                    <div className="text-emerald-600">{((street.fitScore ?? 0)).toFixed(1)}</div>
                {bookmarkedStreets.includes(street.id) && (
                  <Heart className="w-4 h-4 text-rose-500 fill-current" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bookmarked Streets */}
        {bookmarked.length > 0 && (
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-600 fill-current" />
              <h3 className="text-slate-900">Your Saved Streets</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {bookmarked.map(street => (
                <div key={street.id} className="bg-white rounded-lg p-3 relative">
                  <p className="text-slate-900 font-medium">{street.name}</p>
                  <p className="text-slate-600 text-sm">{street.neighborhood}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                      <span className="text-rose-600 text-sm font-medium">Saved</span>
                    </div>
                    <span className="text-emerald-600 font-semibold">{((street.fitScore ?? 0)).toFixed(1)}</span>
                  </div>
                  {onToggleBookmark && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleBookmark(street.id)}
                      className="absolute top-2 right-2 h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-emerald-600" />
            <h3 className="text-slate-900">Export Your Results</h3>
          </div>
          <p className="text-slate-600 mb-4">
            Download a CSV file with all {streets.length} analyzed streets, including your priority rankings and fit scores for offline review.
          </p>
          <Button
            onClick={handleExportCSV}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {exported ? 'Download Again' : 'Download CSV'}
          </Button>
          {exported && (
            <div className="mt-4 flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span>CSV exported successfully!</span>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Quick Feedback</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-slate-700 mb-3">How well did this match your move?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setRating(num)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      rating === num
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Star
                      className={`w-6 h-6 mx-auto ${
                        rating && num <= rating
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-700 mb-2 block">
                What was most helpful?
              </label>
              <Textarea
                placeholder="Share your thoughts..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            {(rating || feedback) && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span>Thanks for your feedback!</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
          <h3 className="text-slate-900 mb-4">What's Next?</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => onNavigate('map')}
              className="h-auto py-4 flex flex-col items-start gap-2"
            >
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div className="text-left">
                <p className="text-slate-900">Explore Map</p>
                <p className="text-slate-600">Review color-coded clusters</p>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigate('priorities')}
              className="h-auto py-4 flex flex-col items-start gap-2"
            >
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="text-slate-900">Adjust Priorities</p>
                <p className="text-slate-600">Try different rankings</p>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={onRestart}
              className="h-auto py-4 flex flex-col items-start gap-2"
            >
              <RotateCcw className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <p className="text-slate-900">Start Fresh</p>
                <p className="text-slate-600">New analysis from scratch</p>
              </div>
            </Button>

            <Button
              onClick={handleExportCSV}
              className="h-auto py-4 flex flex-col items-start gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Download className="w-5 h-5" />
              <div className="text-left">
                <p>Save Results</p>
                <p className="opacity-90">CSV for offline access</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Closing Note */}
        <div className="text-center p-6">
          <p className="text-slate-600">
            Happy house hunting! Your WhyHere? session data is ready for your next steps.
          </p>
        </div>
      </div>
    </div>
  );
}
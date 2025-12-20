import { useEffect, useRef, useMemo, useState } from 'react';
import { Heart, Sliders, MapPin, ChevronDown, ArrowRight, List, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import CityMap from './CityMap';
import type { FeatureKey, UserProfile, Street } from '../App';
import { getAtlantaStreets, calculateFitScore, getClusterForScore } from '../utils/streetData';

type ClusterMapProps = {
  priorities: FeatureKey[];
  topN: number;
  onTopNChange: (n: number) => void;
  onViewStreet: (streetId: string) => void;
  onNavigate: (screen: 'priorities' | 'map' | 'streets' | 'deepdive' | 'export') => void;
  bookmarkedStreets: string[];
  onToggleBookmark: (streetId: string) => void;
  userProfile: UserProfile | null;
  backendStreets?: Street[] | null;
  setBackendStreets?: (s: Street[] | null) => void;
};

// Green theme cluster colors
const clusterColors = {
  'excellent': '#10b981', // Emerald
  'very-good': '#14b8a6', // Teal
  'good': '#22c55e', // Green
  'fair': '#84cc16', // Lime
  'poor': '#64748b' // Slate
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

export function ClusterMap({
  priorities,
  topN,
  onTopNChange,
  onViewStreet,
  onNavigate,
  bookmarkedStreets,
  onToggleBookmark,
  userProfile,
  backendStreets,
  setBackendStreets
}: ClusterMapProps) {
  const streetsListRef = useRef<HTMLDivElement>(null);
  const [hoveredStreet, setHoveredStreet] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  // Backend-provided streets (if available) will be preferred; otherwise fall back to local mock.
  const [localBackendStreets, setLocalBackendStreets] = useState<Street[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streets = useMemo(() => {
    const provided = (typeof (arguments as any) === 'undefined') ? null : null; // noop to help sourcemap align
    const sourceBackend = (backendStreets ?? localBackendStreets) as Street[] | null;
    if (sourceBackend && sourceBackend.length > 0) {
      return [...sourceBackend].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
    }
    const allStreets = getAtlantaStreets();
    return allStreets
      .map(street => ({
        ...street,
        fitScore: calculateFitScore(street, priorities)
      }))
      .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
  }, [backendStreets, localBackendStreets, priorities]);

  const topStreets = streets.slice(0, topN);

  // Fetch backend results when priorities or userProfile change
  useEffect(() => {
    const run = async () => {
      // Build payload
      const featureKeyMap: Record<string, string> = {
        restaurants: 'restaurant',
        parks: 'park',
        grocery: 'grocery_store',
        hospitals: 'hospital',
        policeStations: 'police_station',
        martaStops: 'marta_stop',
        schools: 'school',
        crime: 'crime_incident'
      };

      const raw_weights: Record<string, number> = {};
      priorities.forEach((feature, index) => {
        const backendKey = featureKeyMap[feature];
        raw_weights[backendKey] = priorities.length - index; // higher priority -> larger number
      });

      const payload = {
        radius_km: userProfile?.radius ? userProfile.radius * 1.60934 : 12,
        center: userProfile?.location ? [userProfile.location.lat, userProfile.location.lng] : [33.749, -84.388],
        user_weights: raw_weights,
        budget: userProfile?.budget ?? 1000,
        has_car: userProfile?.transportation ?? true
      };

      setLoading(true);
      setError(null);

      try {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:5050';
        const resp = await fetch(`${API_BASE}/data/pois`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Backend error ${resp.status}: ${txt}`);
        }

        const json = await resp.json();
        if (!json.success || !Array.isArray(json.data)) {
          throw new Error('Unexpected backend response format');
        }

        const records: any[] = json.data;

        // Map backend column names to frontend feature keys
  const backendToFeatureCol: Record<string, string> = {
          restaurants: 'restaurant_accessibility',
          parks: 'park_accessibility',
          grocery: 'grocery_store_accessibility',
          hospitals: 'hospital_accessibility',
          policeStations: 'police_station_accessibility',
          martaStops: 'marta_stop_accessibility',
          schools: 'school_accessibility',
          crime: 'crime_incident_accessibility'
        };

        // Compute min/max per accessibility column
        const colStats: Record<string, { min: number; max: number }> = {};
        Object.values(backendToFeatureCol).forEach(col => {
          const vals = records.map(r => (typeof r[col] === 'number' ? r[col] : NaN)).filter(v => !isNaN(v));
          colStats[col] = { min: Math.min(...(vals.length ? vals : [0])), max: Math.max(...(vals.length ? vals : [1])) };
        });

        const mapped: Street[] = records.map((r, idx) => {
          const scores: any = {};
          // Fill frontend score keys with normalized 0-100 values
          scores.restaurants = Math.round(((typeof r['restaurant_accessibility'] === 'number' ? r['restaurant_accessibility'] : 0) - colStats['restaurant_accessibility'].min) / (colStats['restaurant_accessibility'].max - colStats['restaurant_accessibility'].min || 1) * 100 || 0);
          scores.parks = Math.round(((typeof r['park_accessibility'] === 'number' ? r['park_accessibility'] : 0) - colStats['park_accessibility'].min) / (colStats['park_accessibility'].max - colStats['park_accessibility'].min || 1) * 100 || 0);
          scores.grocery = Math.round(((typeof r['grocery_store_accessibility'] === 'number' ? r['grocery_store_accessibility'] : 0) - colStats['grocery_store_accessibility'].min) / (colStats['grocery_store_accessibility'].max - colStats['grocery_store_accessibility'].min || 1) * 100 || 0);
          scores.hospitals = Math.round(((typeof r['hospital_accessibility'] === 'number' ? r['hospital_accessibility'] : 0) - colStats['hospital_accessibility'].min) / (colStats['hospital_accessibility'].max - colStats['hospital_accessibility'].min || 1) * 100 || 0);
          scores.policeStations = Math.round(((typeof r['police_station_accessibility'] === 'number' ? r['police_station_accessibility'] : 0) - colStats['police_station_accessibility'].min) / (colStats['police_station_accessibility'].max - colStats['police_station_accessibility'].min || 1) * 100 || 0);
          scores.martaStops = Math.round(((typeof r['marta_stop_accessibility'] === 'number' ? r['marta_stop_accessibility'] : 0) - colStats['marta_stop_accessibility'].min) / (colStats['marta_stop_accessibility'].max - colStats['marta_stop_accessibility'].min || 1) * 100 || 0);
          scores.schools = Math.round(((typeof r['school_accessibility'] === 'number' ? r['school_accessibility'] : 0) - colStats['school_accessibility'].min) / (colStats['school_accessibility'].max - colStats['school_accessibility'].min || 1) * 100 || 0);
          scores.crime = Math.round(((typeof r['crime_incident_accessibility'] === 'number' ? r['crime_incident_accessibility'] : 0) - colStats['crime_incident_accessibility'].min) / (colStats['crime_incident_accessibility'].max - colStats['crime_incident_accessibility'].min || 1) * 100 || 0);

          // Use enriched neighborhood name, truncate at comma if present; fallback to hex_id
          let neighborhoodName = '';
          if (r.neighborhood && typeof r.neighborhood === 'string' && r.neighborhood.trim() !== '') {
            neighborhoodName = r.neighborhood.split(',')[0];
          } else if (r.location_name && typeof r.location_name === 'string' && r.location_name.trim() !== '') {
            neighborhoodName = r.location_name.split(',')[0];
          }
          const displayName = neighborhoodName !== '' ? neighborhoodName : (r.hex_id || `hex-${idx}`);
          const streetObj: Street = {
            id: r.hex_id || `hex-${idx}`,
            name: displayName,
            neighborhood: r.suitability_label || displayName,
            lat: typeof r.lat === 'number' ? r.lat : 0,
            lng: typeof r.lon === 'number' ? r.lon : 0,
            scores,
            fitScore: typeof r.user_match_score === 'number' ? Math.max(0, Math.min(10, r.user_match_score * 10)) : undefined,
            rawMatchScore: typeof r.user_match_score === 'number' ? r.user_match_score : undefined,
            cluster: 'good'
          } as Street;

          // If backend didn't provide fitScore, compute using calculateFitScore and priorities
          if (streetObj.fitScore === undefined) {
            streetObj.fitScore = calculateFitScore(streetObj as any, priorities);
          }

          streetObj.cluster = getClusterForScore(streetObj.fitScore ?? 0);

          return streetObj;
        });

  setLocalBackendStreets(mapped);
  if (typeof setBackendStreets === 'function') setBackendStreets(mapped);
      } catch (err: any) {
        console.error('Failed to fetch backend results', err);
        setError(err?.message || String(err));
  setLocalBackendStreets(null);
  if (typeof setBackendStreets === 'function') setBackendStreets(null);
      } finally {
        setLoading(false);
      }
    };

    // Trigger fetch
    run();
  }, [priorities, userProfile]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Canvas-based visualization removed in favor of Leaflet `CityMap`.

  

  const scrollToStreets = () => {
    streetsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowScrollIndicator(false);
  };

  const hoveredStreetData = hoveredStreet ? streets.find(s => s.id === hoveredStreet) : null;
  const topFeatures = useMemo(() => priorities.slice(0, 3), [priorities]);

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Loading / Backend status area */}
      <div className="relative z-20">
        <div className="max-w-7xl mx-auto px-6 mt-4">
          {loading && (
            <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 animate-pulse">
              <div className="w-5 h-5 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold">Clustering in progress...</div>
              <div className="text-xs text-amber-700 ml-2">Please wait while we analyze and cluster the neighborhoods.</div>
            </div>
          )}

          {/* Only show backend results count after loading is false */}
          {!loading && (backendStreets ?? localBackendStreets) && (backendStreets ?? localBackendStreets)!.length > 0 && (
            <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2">
              <div className="text-sm font-semibold">Backend results:</div>
              <div className="text-lg font-bold">{(backendStreets ?? localBackendStreets)!.length.toLocaleString()}</div>
              <div className="text-sm text-emerald-700">records</div>
            </div>
          )}

          {error && (
            <div className="mt-2 inline-block bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-2 text-sm">
              Error: {error}
            </div>
          )}
        </div>
      </div>
      {/* Animated Background Gradient - More Visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" />
      
      {/* Enhanced Corner Lighting Effects with Depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top corners - brighter and more visible */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/25 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        
        {/* Bottom corners - creating shadow depth */}
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/25 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.5s' }} />
        
        {/* Additional depth layers */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-teal-400/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-[100px]" />
        
        {/* Animated gradient blobs */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-300/30 via-transparent to-transparent rounded-full blur-3xl animate-blob" />
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-teal-300/30 via-transparent to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-1/2 left-1/4 w-full h-full bg-gradient-to-tr from-cyan-300/30 via-transparent to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Vignette effect for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-900/5" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-slate-900 mb-1">Interactive Atlanta Neighborhood Map</h1>
                <p className="text-slate-600">
                  Geographic overview of {streets.length} streets • For detailed rankings and comparisons, visit the Streets tab
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('priorities')}
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Sliders className="w-4 h-4 mr-2" />
                Adjust Priorities
              </Button>
            </div>
          </div>
        </div>

        {/* Streets Tab Discovery Banner */}
        <div className="max-w-7xl mx-auto px-6 pt-6">
          {/* Search Location & Radius Display */}
          {userProfile?.location && userProfile?.radius && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-md mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-amber-900 font-semibold mb-1">
                    Search Center & Radius Applied
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-amber-800">
                    <span className="font-mono">
                      📍 {userProfile.location.lat.toFixed(4)}°, {userProfile.location.lng.toFixed(4)}°
                    </span>
                    <span className="text-amber-600">•</span>
                    <span className="font-semibold">
                      ⭕ {userProfile.radius} {userProfile.radius === 1 ? 'mile' : 'miles'} radius
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 shadow-xl text-white border-2 border-emerald-400">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <List className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">📊 This is the Map View</h3>
                  <p className="text-emerald-50 text-sm">
                    You're seeing a geographic overview. For detailed rankings, feature breakdowns, comparisons, and rental search → visit the <span className="font-bold underline">Streets tab</span>
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => onNavigate('streets')}
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold shadow-lg flex-shrink-0"
              >
                <List className="w-5 h-5 mr-2" />
                Go to Streets Tab
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-6 space-y-6">
          {/* Map */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border-2 border-emerald-100 p-6 shadow-2xl relative">
            <div className="mb-4">
              <h2 className="text-emerald-900 mb-2">Geographic Distribution</h2>
              <p className="text-emerald-700 text-sm">
                <MapPin className="w-4 h-4 inline mr-1" />
                Hover over markers to see details • Click to explore street breakdown
              </p>
            </div>

            <div className="relative w-full h-[600px] rounded-xl overflow-hidden border-2 border-emerald-100 bg-emerald-50">
              <div className="relative w-full h-full">
                {/* Full-map loading overlay to make progress obvious and always on top */}
                {loading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <div className="text-emerald-800 font-semibold text-lg">Clustering in progress — please wait...</div>
                      <div className="text-sm text-emerald-700">This may take a few seconds depending on data size.</div>
                    </div>
                  </div>
                )}
                {!loading && (
                  <CityMap
                    markers={topStreets.map((s, idx) => ({
                      id: s.id,
                      lat: s.lat,
                      lng: s.lng,
                      popup: `${s.name} — ${s.neighborhood}`,
                      rank: idx + 1,
                      color: clusterColors[(s.cluster as any) as keyof typeof clusterColors]
                    }))}
                    fitToMarkers={true}
                    height="600px"
                    onMarkerClick={(id) => { if (id) onViewStreet(id); }}
                    className="w-full h-full rounded-xl"
                  />
                )}
              </div>
              
              {/* Floating Legend - Top Right (always visible) */}
              <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border-2 border-emerald-400 min-w-[200px]" style={{ pointerEvents: 'auto', opacity: 1 }}>
                <h4 className="text-white font-semibold mb-3 text-sm">Fit Score Legend</h4>
                <div className="space-y-2">
                  {Object.entries(clusterColors).map(([cluster, color]) => (
                    <div key={cluster} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium">
                          {clusterLabels[cluster as keyof typeof clusterLabels]}
                        </p>
                        <p className="text-slate-200 text-xs">
                          {clusterRanges[cluster as keyof typeof clusterRanges]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Hover Tooltip */}
              {hoveredStreetData && (
                <div
                  className="fixed pointer-events-none z-50"
                  style={{
                    left: tooltipPos.x + 20,
                    top: tooltipPos.y - 100
                  }}
                >
                  <div className="bg-slate-900 border-2 border-emerald-400 rounded-xl p-4 shadow-2xl min-w-[300px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white shadow-lg"
                        style={{ backgroundColor: clusterColors[((hoveredStreetData as any).cluster as any) as keyof typeof clusterColors] }}
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{hoveredStreetData.name}</h4>
                        <p className="text-slate-200 text-sm">{hoveredStreetData.neighborhood}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-200 text-sm">Fit Score</span>
                        <span className="text-white font-bold">{((hoveredStreetData as any).fitScore ?? 0).toFixed(1)}/10</span>
                      </div>
                      {(hoveredStreetData as any).rawMatchScore !== undefined && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-slate-200">Model score (raw)</span>
                          <span className="text-emerald-200 font-medium">{((hoveredStreetData as any).rawMatchScore ?? 0).toFixed(3)}</span>
                        </div>
                      )}
                      {topFeatures.slice(0, 3).map(feature => (
                        <div key={feature} className="flex justify-between text-sm mb-1">
                          <span className="text-slate-200 capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-white font-medium">{(hoveredStreetData.scores as any)[feature] ?? 0}/100</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-emerald-400 mt-3 text-center text-sm font-medium">
                      👆 Click to view full details
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-emerald-700 text-sm">
              💡 Each colored marker represents a neighborhood street • Larger markers indicate better fits
            </div>

            {/* Scroll Indicator - Bottom Right */}
            {showScrollIndicator && (
              <div className="absolute bottom-12 right-6 z-50 animate-bounce">
                <button
                  onClick={scrollToStreets}
                  className="flex flex-col items-center gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all"
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="text-sm font-semibold">View Quick Preview</span>
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Top N Control */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-200 p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-900 font-semibold">Number of Top Streets to Display</h3>
                <p className="text-slate-600 text-sm">Slide to select any number from 1 to 20 streets</p>
              </div>
              <div className="text-4xl bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">{topN}</div>
            </div>
            <Slider
              value={[topN]}
              onValueChange={(val: number[]) => onTopNChange(val[0])}
              min={1}
              max={20}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-500">1 street</span>
              <span className="text-slate-500">10 streets</span>
              <span className="text-slate-500">20 streets</span>
            </div>
          </div>

          {/* Quick Preview - Streets List */}
          <div ref={streetsListRef} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-200 p-6 shadow-md scroll-mt-20">
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-slate-900 font-semibold mb-1">Top {topN} Streets - Quick Preview</h2>
                  <p className="text-slate-600 text-sm">This is a summary. For full details, feature breakdowns, comparisons & rental search:</p>
                </div>
                <Button
                  size="lg"
                  onClick={() => onNavigate('streets')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md"
                >
                  <List className="w-5 h-5 mr-2" />
                  View Full Streets Tab
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              {/* Indicator for more content below */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ChevronDown className="w-5 h-5 animate-bounce" />
                  <span className="text-sm font-medium">
                    Scroll down to see all {topN} streets • Click "View Full Streets Tab" above for detailed analysis
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {topStreets.map((street, index) => (
                <div
                  key={street.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-emerald-50/30 hover:from-emerald-50 hover:to-teal-50 transition-all cursor-pointer border-2 border-transparent hover:border-emerald-300 hover:shadow-md"
                  onClick={() => onViewStreet(street.id)}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                        style={{ backgroundColor: clusterColors[(street.cluster as any) as keyof typeof clusterColors] }}
                  >
                    <span className="font-bold text-lg">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-semibold truncate">{street.name}</p>
                    <p className="text-slate-600 text-sm">{street.neighborhood}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                      {((street as any).fitScore ?? 0).toFixed(1)}
                    </div>
                    <p className="text-slate-500 text-xs font-medium">fit score</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onToggleBookmark(street.id);
                    }}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        bookmarkedStreets.includes(street.id)
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-slate-400'
                      }`}
                    />
                  </Button>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-6 text-center">
              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 rounded-xl p-4 mb-4">
                <p className="text-emerald-900 font-semibold mb-2">
                  🎯 Want detailed rankings, feature explanations, and side-by-side comparisons?
                </p>
                <p className="text-emerald-700 text-sm">
                  Click below or use the bottom navigation to access the comprehensive Streets tab
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => onNavigate('streets')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg"
              >
                <List className="w-6 h-6 mr-2" />
                Go to Full Streets Rankings
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(30px, 10px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 20s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
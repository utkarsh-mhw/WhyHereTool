import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FeaturePriorities } from './components/FeaturePriorities';
import { ClusterMap } from './components/ClusterMap';
import { TopStreetsList } from './components/TopStreetsList';
import { StreetDeepDive } from './components/StreetDeepDive';
import { ComparisonScreen } from './components/ComparisonScreen';
import { ExportWrapUp } from './components/ExportWrapUp';
import { BottomNav } from './components/BottomNav';

export type FeatureKey = 
  | 'crime'
  | 'schools'
  | 'martaStops'
  | 'restaurants'
  | 'parks'
  | 'grocery'
  | 'hospitals'
  | 'policeStations';

export type FeatureScores = Record<FeatureKey, number>;

export type Street = {
  id: string;
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
  scores: FeatureScores;
  cluster: 'excellent' | 'very-good' | 'good' | 'fair' | 'poor';
  // Computed fit score (0-10). Optional because mock data may not include it until calculated.
  fitScore?: number;
  // Raw model match score returned by backend (0-1). Kept for debugging/verification.
  rawMatchScore?: number;
};

export type UserProfile = {
  budget: number;
  unitType: string;
  transportation: boolean; // true = car, false = walking
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  radius?: number; // in miles
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<
    'welcome' | 'priorities' | 'map' | 'streets' | 'deepdive' | 'comparison' | 'export'
  >('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Priority order (higher index = higher priority)
  const [featurePriorities, setFeaturePriorities] = useState<FeatureKey[]>([
    'policeStations',
    'hospitals',
    'grocery',
    'parks',
    'restaurants',
    'schools',
    'martaStops',
    'crime'
  ]);
  
  const [topN, setTopN] = useState(10);
  const [selectedStreetId, setSelectedStreetId] = useState<string | null>(null);
  const [bookmarkedStreets, setBookmarkedStreets] = useState<string[]>([]);
  const [compareStreets, setCompareStreets] = useState<string[]>([]);
  // Backend-provided streets (lifted state) so deep-dive and lists can use them
  const [backendStreets, setBackendStreets] = useState<import('./App').Street[] | null>(null);

  const handleStartExploring = (profile?: UserProfile) => {
    if (profile) {
      setUserProfile(profile);
    }
    setCurrentScreen('priorities');
  };

  const handleRunAnalysis = () => {
    setCurrentScreen('map');
  };

  const handleViewStreet = (streetId: string) => {
    setSelectedStreetId(streetId);
    setCurrentScreen('deepdive');
  };

  const handleToggleBookmark = (streetId: string) => {
    setBookmarkedStreets(prev =>
      prev.includes(streetId)
        ? prev.filter(id => id !== streetId)
        : [...prev, streetId]
    );
  };

  const handleToggleCompare = (streetId: string) => {
    setCompareStreets(prev =>
      prev.includes(streetId)
        ? prev.filter(id => id !== streetId)
        : prev.length < 3
        ? [...prev, streetId]
        : prev
    );
  };

  const handleRestart = () => {
    setCurrentScreen('welcome');
    setUserProfile(null);
    setFeaturePriorities([
      'policeStations',
      'hospitals',
      'grocery',
      'parks',
      'restaurants',
      'schools',
      'martaStops',
      'crime'
    ]);
    setSelectedStreetId(null);
    setBookmarkedStreets([]);
    setCompareStreets([]);
  };

  const showBottomNav = currentScreen !== 'welcome';

  return (
    <div className="min-h-screen bg-slate-50">
      {currentScreen === 'welcome' && (
        <WelcomeScreen onStartExploring={handleStartExploring} />
      )}

      {currentScreen === 'priorities' && (
        <FeaturePriorities
          priorities={featurePriorities}
          onPrioritiesChange={setFeaturePriorities}
          onRunAnalysis={handleRunAnalysis}
          onBack={() => setCurrentScreen('welcome')}
        />
      )}

      {currentScreen === 'map' && (
        <ClusterMap
          priorities={featurePriorities}
          topN={topN}
          onTopNChange={setTopN}
          onViewStreet={handleViewStreet}
          onNavigate={setCurrentScreen}
          bookmarkedStreets={bookmarkedStreets}
          onToggleBookmark={handleToggleBookmark}
          userProfile={userProfile}
          backendStreets={backendStreets}
          setBackendStreets={setBackendStreets}
        />
      )}

      {currentScreen === 'streets' && (
        <TopStreetsList
          priorities={featurePriorities}
          topN={topN}
          onTopNChange={setTopN}
          onViewStreet={handleViewStreet}
          bookmarkedStreets={bookmarkedStreets}
          onToggleBookmark={handleToggleBookmark}
          compareStreets={compareStreets}
          onToggleCompare={handleToggleCompare}
          onNavigate={setCurrentScreen}
          userProfile={userProfile}
          backendStreets={backendStreets}
        />
      )}

      {currentScreen === 'deepdive' && selectedStreetId && (
        <StreetDeepDive
          streetId={selectedStreetId}
          priorities={featurePriorities}
          bookmarkedStreets={bookmarkedStreets}
          onToggleBookmark={handleToggleBookmark}
          compareStreets={compareStreets}
          onToggleCompare={handleToggleCompare}
          onBack={() => setCurrentScreen('streets')}
          onNavigate={setCurrentScreen}
          backendStreets={backendStreets}
        />
      )}

      {currentScreen === 'comparison' && (
        <ComparisonScreen
          compareStreets={compareStreets}
          priorities={featurePriorities}
          onToggleCompare={handleToggleCompare}
          onBack={() => setCurrentScreen('streets')}
          bookmarkedStreets={bookmarkedStreets}
          onToggleBookmark={handleToggleBookmark}
          backendStreets={backendStreets}
        />
      )}

      {currentScreen === 'export' && (
        <ExportWrapUp
          priorities={featurePriorities}
          bookmarkedStreets={bookmarkedStreets}
          onRestart={handleRestart}
          onNavigate={setCurrentScreen}
          onToggleBookmark={handleToggleBookmark}
          backendStreets={backendStreets}
        />
      )}

      {showBottomNav && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
        />
      )}
    </div>
  );
}

export default App;
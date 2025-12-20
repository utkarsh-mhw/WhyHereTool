import { useState } from 'react';
import { UtensilsCrossed, Shield, Hospital, GraduationCap, Trees, ShoppingCart, ShieldAlert, Train, ChevronLeft, Sparkles, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import type { FeatureWeights } from '../App';
import { RunClustering } from './RunClustering';

type FeatureWeightingProps = {
  weights: FeatureWeights;
  onWeightsChange: (weights: FeatureWeights) => void;
  onRunAnalysis: () => void;
  onBack: () => void;
};

const featureConfig = {
  restaurants: {
    icon: UtensilsCrossed,
    label: 'Restaurants',
    description: 'Dining options within walking distance',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  },
  crime: {
    icon: Shield,
    label: 'Safety (Low Crime)',
    description: 'Crime rates and incident reports',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600'
  },
  hospitals: {
    icon: Hospital,
    label: 'Hospitals',
    description: 'Healthcare facility accessibility',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600'
  },
  schools: {
    icon: GraduationCap,
    label: 'Schools',
    description: 'Quality ratings from GA Education',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
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
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  policeStations: {
    icon: ShieldAlert,
    label: 'Police Stations',
    description: 'Law enforcement presence',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600'
  },
  martaStops: {
    icon: Train,
    label: 'MARTA Stops',
    description: 'Public transit accessibility',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600'
  }
};

export function FeatureWeighting({
  weights,
  onWeightsChange,
  onRunAnalysis,
  onBack,
  location,
  radius,
  budget,
  has_car,
  onClusteringResult
}: FeatureWeightingProps & {
  location: { lat: number; lng: number };
  radius: number;
  budget: number;
  has_car: boolean;
  onClusteringResult: (result: any[]) => void;
}) {
  const [expandedFeature, setExpandedFeature] = useState<keyof FeatureWeights | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
  const maxPossible = 80; // 8 features × 10 max each

  const handleWeightChange = (feature: keyof FeatureWeights, value: number[]) => {
    onWeightsChange({
      ...weights,
      [feature]: value[0]
    });
  };

  const handleReset = () => {
    onWeightsChange({
      restaurants: 5,
      crime: 5,
      hospitals: 5,
      schools: 5,
      parks: 5,
      grocery: 5,
      policeStations: 5,
      martaStops: 5
    });
  };

  const canRunAnalysis = totalWeight >= 20;
  const [runRequested, setRunRequested] = useState(false);

  const getTopFeatures = () => {
    return Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => featureConfig[key as keyof FeatureWeights].label);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      {/* ...existing UI code... */}
      <RunClustering
        input={{
          radius_km: radius,
          center: [location.lat, location.lng],
          user_weights: weights,
          budget,
          has_car
        }}
        onResult={onClusteringResult}
      >
        <Button
          onClick={() => setRunRequested(true)}
          disabled={!canRunAnalysis}
          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canRunAnalysis ? 'Run Analysis' : 'Add More Weight to Continue'}
        </Button>
      </RunClustering>
    </div>
  );
}

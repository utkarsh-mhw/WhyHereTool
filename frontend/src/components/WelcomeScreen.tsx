import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, MapPin, ChevronLeft, ChevronRight, TrendingUp, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { InteractiveThreeScene } from './InteractiveThreeScene';
import { LocationPicker } from './LocationPicker';
import { motion, AnimatePresence } from 'motion/react';
import type { UserProfile } from '../App';
import atlantaMapBg from 'figma:asset/6d248705eafbd4523975182b7a2de937607b2e36.png';

type WelcomeScreenProps = {
  onStartExploring: (profile?: UserProfile) => void;
};

export function WelcomeScreen({ onStartExploring }: WelcomeScreenProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [budget, setBudget] = useState(2000);
  const [unitType, setUnitType] = useState('1-bed');
  const [transportation, setTransportation] = useState<boolean>(true); // true = car, false = walking
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const [currentTooltip, setCurrentTooltip] = useState(0);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Location

  // Check if all required fields are filled
  const isBasicInfoComplete = budget && unitType && (transportation === true || transportation === false);
  const isLocationComplete = location !== null;
  const canProceed = isBasicInfoComplete && isLocationComplete;

  const tooltips = [
    {
      icon: Sparkles,
      text: 'Drag & Drop Priority Ranking',
      description: 'Rank 8 features by importance - Priority 1 gets highest weight (×8)'
    },
    {
      icon: ArrowRight,
      text: 'Interactive Cluster Map',
      description: 'Explore streets on an Atlanta map with hover tooltips & click to dive deep'
    },
    {
      icon: ArrowRight,
      text: 'Compare Up to 3 Streets',
      description: 'Side-by-side comparison with difference indicators & insights'
    },
    {
      icon: ArrowRight,
      text: 'Direct Rental Search',
      description: 'Click "View Rentals" to search apartments.com with exact location'
    },
    {
      icon: ArrowRight,
      text: 'Export Top Streets to CSV',
      description: 'Download your personalized rankings and take them offline'
    }
  ];

  // Auto-play carousel - cycles every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTooltip((prev) => (prev + 1) % tooltips.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [tooltips.length]);

  const handleManualNavigation = (index: number) => {
    setCurrentTooltip(index);
  };

  const currentTip = tooltips[currentTooltip];
  const TipIcon = currentTip.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 relative overflow-hidden">
      {/* Atlanta Map Background - Lowest Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src={atlantaMapBg} 
          alt="" 
          className="w-full h-full object-cover opacity-[0.075]"
          style={{ filter: 'grayscale(100%)' }}
        />
      </div>

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden z-[1]">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Three.js 3D Scene - Interactive Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none z-[2]">
        <InteractiveThreeScene className="w-full h-full" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-lg mb-4">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-slate-900">
                WhyHere?
              </h1>
              <p className="text-slate-600 max-w-xl mx-auto">
                Discover Atlanta streets that match your priorities—weight features, see clustered maps, export top picks
              </p>
            </div>

            {/* Atlanta Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-slate-700">Analyzing Atlanta Metro</span>
            </div>
          </div>

          {/* Tooltip Carousel */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100 overflow-hidden">
            <div className="flex items-center justify-between mb-4 min-h-[80px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentTooltip((currentTooltip - 1 + tooltips.length) % tooltips.length)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-4 flex-1 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTooltip}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    className="flex items-center gap-4 absolute inset-0"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TipIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-slate-900">{currentTip.text}</p>
                      <p className="text-slate-600">{currentTip.description}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentTooltip((currentTooltip + 1) % tooltips.length)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              {tooltips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTooltip(index)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    index === currentTooltip
                      ? 'w-8 bg-emerald-500'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Profile Setup */}
          {!showProfile ? (
            <div className="flex justify-center">
              <Button
                onClick={() => setShowProfile(true)}
                className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-emerald-200">
              {/* Step Indicator */}
              <div className="border-b border-emerald-100 p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-900">Profile Setup</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Step {currentStep} of 2</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className={`flex-1 h-1.5 rounded-full transition-all ${currentStep >= 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`flex-1 h-1.5 rounded-full transition-all ${currentStep >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                </div>
              </div>

              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="p-6 space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-2">
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">All fields are required</span> to provide personalized recommendations
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-700 mb-3 block flex items-center gap-2">
                      Monthly Budget <span className="text-red-500">*</span>
                      <span className="text-emerald-600 font-semibold">${budget.toLocaleString()}</span>
                    </label>
                    <Slider
                      value={[budget]}
                      onValueChange={(val) => setBudget(val[0])}
                      min={1200}
                      max={3500}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-slate-500">$1,200</span>
                      <span className="text-slate-500">$3,500</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 mb-3 block flex items-center gap-2">
                      Unit Type <span className="text-red-500">*</span>
                    </label>
                    <Select value={unitType} onValueChange={setUnitType}>
                      <SelectTrigger className="border-2 border-slate-200 focus:border-emerald-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="1-bed">1 Bedroom</SelectItem>
                        <SelectItem value="2-bed">2 Bedrooms</SelectItem>
                        <SelectItem value="3-bed">3+ Bedrooms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-slate-700 mb-3 block flex items-center gap-2">
                      Transportation Preference <span className="text-red-500">*</span>
                    </label>
                    <Select value={transportation ? 'car' : 'walking'} onValueChange={(val: 'car' | 'walking') => setTransportation(val === 'car')}>
                      <SelectTrigger className="border-2 border-slate-200 focus:border-emerald-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="car">I Have a Car</SelectItem>
                        <SelectItem value="walking">I Prefer Walking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Location & Radius */}
              {currentStep === 2 && (
                <div className="p-6 space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-2">
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">Click on the map</span> to select your preferred search location
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <label className="text-slate-700 font-semibold flex items-center gap-2">
                      Search Location <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {/* Location Picker Map */}
                  <LocationPicker
                    location={location}
                    radius={radius}
                    onLocationChange={(lat, lng) => setLocation({ lat, lng })}
                  />

                  {/* Display selected coordinates */}
                  {location && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Selected Location:</span>
                      </p>
                      <p className="text-xs text-slate-600 font-mono mt-1">
                        Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {/* Radius Slider */}
                  <div>
                    <label className="text-slate-700 mb-3 block flex items-center gap-2">
                      Search Radius <span className="text-red-500">*</span>
                      <span className="text-amber-600 font-semibold">{radius} {radius === 1 ? 'mile' : 'miles'}</span>
                    </label>
                    <Slider
                      value={[radius]}
                      onValueChange={(val) => setRadius(val[0])}
                      min={1}
                      max={40}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-slate-500">1 mile</span>
                      <span className="text-slate-500">40 miles</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="border-t border-emerald-100 p-6 bg-slate-50/50">
                <div className="flex gap-3">
                  {currentStep === 1 ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowProfile(false);
                          setCurrentStep(1);
                          setLocation(null);
                        }}
                        className="flex-1 border-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(2)}
                        disabled={!isBasicInfoComplete}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next: Location
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 border-slate-300"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          onStartExploring({ 
                            budget, 
                            unitType, 
                            transportation,
                            location,
                            radius
                          });
                        }}
                        disabled={!isLocationComplete}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        Start Exploring
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                </div>
                {!canProceed && currentStep === 2 && !location && (
                  <p className="text-sm text-amber-600 mt-3 text-center">
                    Please select a location on the map to continue
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-emerald-100">
              <div className="text-emerald-600">200+</div>
              <p className="text-slate-600">Streets Analyzed</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-emerald-100">
              <div className="text-teal-600">8</div>
              <p className="text-slate-600">Key Features</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-emerald-100">
              <div className="text-cyan-600">{'<3'} min</div>
              <p className="text-slate-600">To Results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Shield, GraduationCap, Train, Store, DollarSign } from 'lucide-react';
import { Slider } from './ui/slider';
import type { Priorities } from '../App';

type PrioritySlidersProps = {
  priorities: Priorities;
  onChange: (priorities: Priorities) => void;
  userType: 'renter' | 'investor';
};

const priorityConfig = {
  safety: {
    icon: Shield,
    label: 'Safety',
    renterDescription: 'Low crime rates, well-lit areas',
    investorDescription: 'Security impacts property values',
    color: 'emerald'
  },
  schools: {
    icon: GraduationCap,
    label: 'Schools',
    renterDescription: 'Quality ratings from GA Education',
    investorDescription: 'School quality drives demand',
    color: 'blue'
  },
  transit: {
    icon: Train,
    label: 'Transit',
    renterDescription: 'MARTA accessibility score',
    investorDescription: 'Transit access boosts value',
    color: 'purple'
  },
  amenities: {
    icon: Store,
    label: 'Amenities',
    renterDescription: 'POI density from Google Places',
    investorDescription: 'Lifestyle appeal for renters',
    color: 'orange'
  },
  affordability: {
    icon: DollarSign,
    label: 'Affordability',
    renterDescription: 'Rent trends from Zillow',
    investorDescription: 'Entry price vs appreciation',
    color: 'pink'
  }
};

export function PrioritySliders({ priorities, onChange, userType }: PrioritySlidersProps) {
  const handleChange = (key: keyof Priorities, value: number[]) => {
    onChange({
      ...priorities,
      [key]: value[0]
    });
  };

  return (
    <div className="space-y-6">
      {Object.entries(priorityConfig).map(([key, config]) => {
        const Icon = config.icon;
        const value = priorities[key as keyof Priorities];
        const description = userType === 'renter' ? config.renterDescription : config.investorDescription;

        return (
          <div key={key} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-${config.color}-50 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${config.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900">{config.label}</p>
                  <p className="text-slate-500">{description}</p>
                </div>
              </div>
              <span className="text-slate-900">{value}%</span>
            </div>
            <Slider
              value={[value]}
              onValueChange={(val) => handleChange(key as keyof Priorities, val)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        );
      })}
      
      <div className="pt-4 border-t border-slate-200">
        <p className="text-slate-500">
          Total weight: {Object.values(priorities).reduce((a, b) => a + b, 0)}%
        </p>
      </div>
    </div>
  );
}

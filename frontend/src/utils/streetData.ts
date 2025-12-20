import type { Street, FeatureKey, FeatureScores } from '../App';

// Mock Atlanta street data
export function getAtlantaStreets(): Street[] {
  return [
    {
      id: '1',
      name: 'Peachtree Street NW',
      neighborhood: 'Midtown',
      lat: 33.7847,
      lng: -84.3830,
      scores: {
        restaurants: 95,
        crime: 75,
        hospitals: 85,
        schools: 72,
        parks: 80,
        grocery: 92,
        policeStations: 88,
        martaStops: 100
      },
      cluster: 'excellent'
    },
    {
      id: '2',
      name: 'Ponce de Leon Avenue',
      neighborhood: 'Poncey-Highland',
      lat: 33.7734,
      lng: -84.3495,
      scores: {
        restaurants: 85,
        crime: 70,
        hospitals: 75,
        schools: 68,
        parks: 74,
        grocery: 82,
        policeStations: 72,
        martaStops: 95
      },
      cluster: 'very-good'
    },
    {
      id: '3',
      name: 'Virginia Avenue',
      neighborhood: 'Virginia-Highland',
      lat: 33.7881,
      lng: -84.3515,
      scores: {
        restaurants: 88,
        crime: 82,
        hospitals: 68,
        schools: 85,
        parks: 92,
        grocery: 85,
        policeStations: 75,
        martaStops: 65
      },
      cluster: 'very-good'
    },
    {
      id: '4',
      name: 'Piedmont Avenue NE',
      neighborhood: 'Midtown',
      lat: 33.7826,
      lng: -84.3765,
      scores: {
        restaurants: 92,
        crime: 78,
        hospitals: 95,
        schools: 75,
        parks: 98,
        grocery: 88,
        policeStations: 85,
        martaStops: 92
      },
      cluster: 'excellent'
    },
    {
      id: '5',
      name: 'Edgewood Avenue SE',
      neighborhood: 'Old Fourth Ward',
      lat: 33.7626,
      lng: -84.3663,
      scores: {
        restaurants: 75,
        crime: 62,
        hospitals: 72,
        schools: 65,
        parks: 70,
        grocery: 72,
        policeStations: 65,
        martaStops: 82
      },
      cluster: 'good'
    },
    {
      id: '6',
      name: 'North Highland Avenue',
      neighborhood: 'Virginia-Highland',
      lat: 33.7845,
      lng: -84.3485,
      scores: {
        restaurants: 85,
        crime: 80,
        hospitals: 70,
        schools: 78,
        parks: 85,
        grocery: 90,
        policeStations: 75,
        martaStops: 72
      },
      cluster: 'very-good'
    },
    {
      id: '7',
      name: 'Memorial Drive',
      neighborhood: 'Grant Park',
      lat: 33.7403,
      lng: -84.3661,
      scores: {
        restaurants: 65,
        crime: 60,
        hospitals: 65,
        schools: 72,
        parks: 88,
        grocery: 68,
        policeStations: 62,
        martaStops: 70
      },
      cluster: 'good'
    },
    {
      id: '8',
      name: 'Roswell Road',
      neighborhood: 'Buckhead',
      lat: 33.8490,
      lng: -84.3671,
      scores: {
        restaurants: 92,
        crime: 92,
        hospitals: 88,
        schools: 95,
        parks: 75,
        grocery: 95,
        policeStations: 95,
        martaStops: 55
      },
      cluster: 'very-good'
    },
    {
      id: '9',
      name: 'Decatur Street',
      neighborhood: 'Decatur',
      lat: 33.7748,
      lng: -84.2963,
      scores: {
        restaurants: 82,
        crime: 85,
        hospitals: 78,
        schools: 92,
        parks: 82,
        grocery: 85,
        policeStations: 82,
        martaStops: 75
      },
      cluster: 'very-good'
    },
    {
      id: '10',
      name: 'West Peachtree Street',
      neighborhood: 'Midtown',
      lat: 33.7810,
      lng: -84.3860,
      scores: {
        restaurants: 95,
        crime: 75,
        hospitals: 85,
        schools: 72,
        parks: 75,
        grocery: 85,
        policeStations: 82,
        martaStops: 100
      },
      cluster: 'excellent'
    },
    {
      id: '11',
      name: 'Flat Shoals Avenue',
      neighborhood: 'East Atlanta',
      lat: 33.7283,
      lng: -84.3416,
      scores: {
        restaurants: 60,
        crime: 52,
        hospitals: 55,
        schools: 62,
        parks: 65,
        grocery: 62,
        policeStations: 55,
        martaStops: 62
      },
      cluster: 'fair'
    },
    {
      id: '12',
      name: 'Lee Street SW',
      neighborhood: 'West End',
      lat: 33.7358,
      lng: -84.4149,
      scores: {
        restaurants: 55,
        crime: 50,
        hospitals: 60,
        schools: 62,
        parks: 72,
        grocery: 62,
        policeStations: 52,
        martaStops: 72
      },
      cluster: 'fair'
    },
    {
      id: '13',
      name: 'Buford Highway',
      neighborhood: 'Brookhaven',
      lat: 33.8593,
      lng: -84.3370,
      scores: {
        restaurants: 98,
        crime: 75,
        hospitals: 75,
        schools: 82,
        parks: 65,
        grocery: 92,
        policeStations: 75,
        martaStops: 62
      },
      cluster: 'very-good'
    },
    {
      id: '14',
      name: 'Candler Road',
      neighborhood: 'Candler Park',
      lat: 33.7643,
      lng: -84.3397,
      scores: {
        restaurants: 65,
        crime: 65,
        hospitals: 62,
        schools: 75,
        parks: 82,
        grocery: 72,
        policeStations: 65,
        martaStops: 72
      },
      cluster: 'good'
    },
    {
      id: '15',
      name: 'Peachtree Road NE',
      neighborhood: 'Buckhead',
      lat: 33.8455,
      lng: -84.3625,
      scores: {
        restaurants: 92,
        crime: 95,
        hospitals: 88,
        schools: 95,
        parks: 72,
        grocery: 95,
        policeStations: 95,
        martaStops: 62
      },
      cluster: 'excellent'
    },
    {
      id: '16',
      name: 'Moreland Avenue',
      neighborhood: 'Little Five Points',
      lat: 33.7621,
      lng: -84.3476,
      scores: {
        restaurants: 75,
        crime: 62,
        hospitals: 62,
        schools: 65,
        parks: 72,
        grocery: 72,
        policeStations: 62,
        martaStops: 82
      },
      cluster: 'good'
    },
    {
      id: '17',
      name: 'North Avenue NE',
      neighborhood: 'Midtown',
      lat: 33.7719,
      lng: -84.3839,
      scores: {
        restaurants: 85,
        crime: 72,
        hospitals: 92,
        schools: 72,
        parks: 75,
        grocery: 82,
        policeStations: 82,
        martaStops: 92
      },
      cluster: 'very-good'
    },
    {
      id: '18',
      name: 'DeKalb Avenue',
      neighborhood: 'Inman Park',
      lat: 33.7578,
      lng: -84.3524,
      scores: {
        restaurants: 72,
        crime: 72,
        hospitals: 72,
        schools: 75,
        parks: 82,
        grocery: 75,
        policeStations: 72,
        martaStops: 82
      },
      cluster: 'good'
    },
    {
      id: '19',
      name: 'Juniper Street',
      neighborhood: 'Midtown',
      lat: 33.7798,
      lng: -84.3845,
      scores: {
        restaurants: 95,
        crime: 75,
        hospitals: 85,
        schools: 72,
        parks: 82,
        grocery: 85,
        policeStations: 82,
        martaStops: 95
      },
      cluster: 'excellent'
    },
    {
      id: '20',
      name: 'Boulevard NE',
      neighborhood: 'Old Fourth Ward',
      lat: 33.7595,
      lng: -84.3698,
      scores: {
        restaurants: 65,
        crime: 62,
        hospitals: 72,
        schools: 65,
        parks: 82,
        grocery: 72,
        policeStations: 62,
        martaStops: 82
      },
      cluster: 'good'
    }
  ];
}

// Calculate fit score based on priority order (Priority 1 at index 0 = highest weight)
export function calculateFitScore(street: Street, priorities: FeatureKey[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  // Assign weights based on priority position
  // Priority 1 (index 0) gets highest weight, Priority 8 (index 7) gets lowest weight
  priorities.forEach((feature, index) => {
    const weight = priorities.length - index; // Priority 1 gets weight 8, Priority 8 gets weight 1
    weightedSum += street.scores[feature] * weight;
    totalWeight += weight * 100; // Max score is 100
  });
  
  return totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0;
}

export function getClusterForScore(score: number): Street['cluster'] {
  if (score >= 8.5) return 'excellent';
  if (score >= 7.5) return 'very-good';
  if (score >= 6) return 'good';
  if (score >= 4.5) return 'fair';
  return 'poor';
}

// Generate interesting contextual labels for features
export function getFeatureDisplayName(feature: FeatureKey, context: 'short' | 'narrative' | 'lifestyle' = 'short'): string {
  const labels = {
    restaurants: {
      short: 'Dining',
      narrative: 'Culinary Scene',
      lifestyle: 'Nightlife & Entertainment'
    },
    crime: {
      short: 'Safety',
      narrative: 'Community Security',
      lifestyle: 'Peace of Mind'
    },
    hospitals: {
      short: 'Healthcare',
      narrative: 'Medical Access',
      lifestyle: 'Wellness & Care'
    },
    schools: {
      short: 'Education',
      narrative: 'School Quality',
      lifestyle: 'Family-Friendly Learning'
    },
    parks: {
      short: 'Green Space',
      narrative: 'Recreation Areas',
      lifestyle: 'Active Lifestyle'
    },
    grocery: {
      short: 'Shopping',
      narrative: 'Fresh Food Access',
      lifestyle: 'Convenience & Supplies'
    },
    policeStations: {
      short: 'Security',
      narrative: 'Law Enforcement',
      lifestyle: 'Neighborhood Watch'
    },
    martaStops: {
      short: 'Transit',
      narrative: 'Public Transportation',
      lifestyle: 'Urban Mobility'
    }
  };
  
  return labels[feature][context];
}

// Generate dynamic "Why This Ranks" explanations
export function generateRankingExplanation(
  street: Street,
  rank: number,
  priorities: FeatureKey[]
): string[] {
  const reasons: string[] = [];
  const topPriorities = priorities.slice(0, 3); // Top 3 (indices 0, 1, 2)
  
  topPriorities.forEach((feature, index) => {
    const score = street.scores[feature];
    const displayName = getFeatureDisplayName(feature, 'narrative');
    
    if (score >= 85) {
      reasons.push(`Strong ${displayName.toLowerCase()} score (${score}/100) aligns with your ${index === 0 ? 'top' : `#${index + 1}`} priority`);
    } else if (score >= 70) {
      reasons.push(`Good ${displayName.toLowerCase()} performance (${score}/100) matches your ${index === 0 ? 'highest' : 'key'} preference`);
    } else if (score >= 60) {
      reasons.push(`Solid ${displayName.toLowerCase()} access (${score}/100) supports your lifestyle goals`);
    }
  });
  
  return reasons.length > 0 ? reasons : [`Balanced performance across your priority areas`];
}

// Generate insights for a neighborhood
export function generateNeighborhoodInsights(street: Street, priorities: FeatureKey[]): string {
  const topFeature = priorities[0]; // First item is highest priority
  const topScore = street.scores[topFeature];
  const displayName = getFeatureDisplayName(topFeature, 'lifestyle');
  
  const insights = {
    excellent: [
      `${street.neighborhood} excels in ${displayName.toLowerCase()} with a remarkable ${topScore}/100 score.`,
      `This area performs exceptionally well across your selected criteria, making it a premier choice.`,
      `Outstanding ${displayName.toLowerCase()} combined with strong overall metrics makes this a standout location.`
    ],
    'very-good': [
      `${street.neighborhood} offers strong ${displayName.toLowerCase()} options scoring ${topScore}/100.`,
      `This neighborhood balances your priorities effectively with above-average performance.`,
      `Excellent ${displayName.toLowerCase()} access makes this a compelling option for your lifestyle.`
    ],
    good: [
      `${street.neighborhood} provides solid ${displayName.toLowerCase()} with a ${topScore}/100 rating.`,
      `This area meets your key requirements with consistent performance across categories.`,
      `Good ${displayName.toLowerCase()} and balanced amenities make this worth considering.`
    ],
    fair: [
      `${street.neighborhood} offers moderate ${displayName.toLowerCase()} scoring ${topScore}/100.`,
      `This location shows potential with room for growth in some areas.`,
      `Decent ${displayName.toLowerCase()} with opportunities to explore nearby alternatives.`
    ],
    poor: [
      `${street.neighborhood} has limited ${displayName.toLowerCase()} with a ${topScore}/100 score.`,
      `This area may require compromise on some of your priority features.`,
      `Consider whether trade-offs in ${displayName.toLowerCase()} fit your needs.`
    ]
  };
  
  const clusterInsights = insights[street.cluster];
  return clusterInsights[Math.floor(Math.random() * clusterInsights.length)];
}
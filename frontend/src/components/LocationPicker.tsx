import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from './ui/button';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// Ensure default Leaflet icon URLs are set
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} catch (e) {
  // ignore in non-browser environments
}

type LocationPickerProps = {
  location: { lat: number; lng: number } | null;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
};

const atlantaCenter = { lat: 33.7490, lng: -84.3880 };

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onLocationChange]);

  return null;
}

export function LocationPicker({ location, radius, onLocationChange }: LocationPickerProps) {
  const [initialZoom, setInitialZoom] = useState(12);

  // Convert miles to meters for Leaflet Circle
  const milesToMeters = (miles: number) => {
    return miles * 1609.34;
  };

  const setAtlantaCenter = () => {
    onLocationChange(atlantaCenter.lat, atlantaCenter.lng);
  };

  return (
    <div className="relative">
      <style>{`
        .leaflet-container {
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 2px solid #bbf7d0;
        }
        
        .leaflet-container.leaflet-touch .leaflet-bar a:first-child {
          border-top-left-radius: 0.5rem;
        }
        
        .leaflet-container.leaflet-touch .leaflet-bar a:last-child {
          border-bottom-left-radius: 0.5rem;
        }

        .location-picker-info-overlay {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(0.5rem);
          border-radius: 0.5rem;
          padding: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #bbf7d0;
          z-index: 1000;
          pointer-events: auto;
        }

        .location-picker-instruction {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 999;
        }
      `}</style>

      <div className="w-full h-[400px] relative">
        <MapContainer
          center={location ? [location.lat, location.lng] : [atlantaCenter.lat, atlantaCenter.lng]}
          zoom={initialZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationChange={onLocationChange} />

          {location && (
            <>
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900">Search Location</p>
                    <p className="text-xs text-slate-600 font-mono">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Radius: {radius} mile{radius !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Popup>
              </Marker>

              <Circle
                center={[location.lat, location.lng]}
                radius={milesToMeters(radius)}
                pathOptions={{
                  color: '#f59e0b',
                  weight: 2,
                  opacity: 0.7,
                  fillColor: '#f59e0b',
                  fillOpacity: 0.1,
                }}
              />
            </>
          )}
        </MapContainer>

        {!location && (
          <div className="location-picker-instruction">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl border-2 border-emerald-200 flex flex-col items-center gap-3 max-w-sm">
              <MapPin className="w-8 h-8 text-emerald-600" />
              <div className="text-center">
                <p className="text-slate-900 font-semibold mb-1">Select Your Location</p>
                <p className="text-slate-600 text-sm">
                  Click anywhere on the map to set your search center
                </p>
              </div>
              <Button
                onClick={setAtlantaCenter}
                size="sm"
                variant="outline"
                className="pointer-events-auto border-emerald-200 hover:bg-emerald-50"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Use Atlanta Center
              </Button>
            </div>
          </div>
        )}

        {location && (
          <div className="location-picker-info-overlay">
            <p className="text-xs text-slate-600 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span className="font-semibold">Search Radius: {radius} mi</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
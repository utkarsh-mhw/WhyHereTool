"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Ensure default Leaflet icon URLs are set (some bundlers don't load them automatically)
try {
  // only run if leaflet is available
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
} catch (e) {
  // ignore in non-browser environments
}

type MarkerDef = { lat: number; lng: number; popup?: string; id?: string; rank?: number; price?: string; color?: string };

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  markers?: MarkerDef[];
  fitToMarkers?: boolean;
  onMarkerClick?: (id: string) => void;
}

function FitBounds({ markers }: { markers: MarkerDef[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !markers || markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng]);
      return;
    }

    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, markers]);

  return null;
}

function EnsureTopPane() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const paneName = 'markerPane';
    // create a dedicated pane for markers with high z-index so markers render on top
    if (!map.getPane(paneName)) {
      const pane = map.createPane(paneName);
      // set a high z-index so markers render above any UI overlays/canvases
      pane.style.zIndex = '2000';
      // ensure pointer events work on the pane
      pane.style.pointerEvents = 'auto';
    }
  }, [map]);

  return null;
}

export default function MapView(props: MapViewProps) {
  const {
    center = [33.75, -84.39],
    zoom = 13,
    height = "100%",
    className = "",
    markers = [],
    fitToMarkers = true,
    onMarkerClick,
  } = props;
  // If markers provided and fitToMarkers is true, we will fit bounds in FitBounds
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl shadow-md ${className}`}
      style={{ height }}
    >
      {/* marker styles scoped to this component */}
      <style>{`
        .ci-div-icon { background: transparent; }
        .ci-marker-root { display: flex; flex-direction: column; align-items: center; transform: translateY(-8px); }
        /* lighter marker label to match theme */
        .ci-marker-label {
          margin-bottom: 2px;
          background: #bbf7d0; /* emerald-200 */
          color: #064e3b; /* dark emerald text for contrast */
          font-size: 15px;
          font-weight: 700;
          font-family: Inter, system-ui, sans-serif;
          border-radius: 6px;
          padding: 4px 12px;
          box-shadow: 0 2px 12px rgba(16,185,129,0.12);
          white-space: nowrap;
          pointer-events: none;
        }
        .ci-marker-badge { width: 36px; height: 36px; border-radius: 999px; display:flex; align-items:center; justify-content:center; color: #064e3b; font-weight: 700; font-family: Inter, system-ui, sans-serif; }
        .ci-marker-rank { font-size: 14px; line-height: 1; }
        /* ensure the icon container doesn't block map pointer events (markers themselves still interact) */
        .leaflet-marker-icon.ci-div-icon { pointer-events: auto; }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Free, unlimited OSM tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <EnsureTopPane />
        {markers && markers.length > 0 && markers.map((m) => {
          const showLabel = m.rank && m.rank <= 3 && m.popup;
          const html = `
            <div class="ci-marker-root" style="pointer-events: none;">
              ${showLabel ? `<div class=\"ci-marker-label\">${m.popup}</div>` : ''}
                <div class="ci-marker-badge" style="background: ${m.color || '#bbf7d0'}; box-shadow: 0 0 10px ${m.color ? m.color + '66' : '#bbf7d066'};">
                <span class="ci-marker-rank">${m.rank ?? ''}</span>
              </div>
            </div>
          `;

          const icon = L.divIcon({
            html,
            className: 'ci-div-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          return (
            <Marker
              key={m.id ?? `${m.lat}-${m.lng}`}
              position={[m.lat, m.lng]}
              pane="markerPane"
              icon={icon}
              zIndexOffset={1000}
              eventHandlers={onMarkerClick && m.id ? {
                click: () => onMarkerClick(m.id!)
              } : undefined}
            >
              {m.popup ? <Popup>{m.popup}</Popup> : null}
            </Marker>
          );
        })}

        {fitToMarkers && markers && markers.length > 0 && (
          <FitBounds markers={markers} />
        )}
      </MapContainer>
    </div>
  );
}

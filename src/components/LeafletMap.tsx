/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Place, CATEGORIES } from '../types';
import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Star, MapPin, Calendar, Edit2, Trash2, Beer, Utensils, Compass, Umbrella, Bed } from 'lucide-react';

const iconMap: Record<string, any> = {
  Beer,
  Utensils,
  Compass,
  Umbrella,
  Bed,
};

interface LeafletMapProps {
  places: Place[];
  onMapClick: (lat: number, lng: number) => void;
  onEdit: (place: Place) => void;
  onDelete: (id: string | undefined) => void;
  onFocus: (place: Place) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  focusedPlace: Place | null;
}

function MapEvents({ onClick, onBoundsChange }: { 
  onClick: (lat: number, lng: number) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    click(e) {
      if ((e.originalEvent.target as HTMLElement).classList.contains('leaflet-container')) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
    moveend() {
      if (onBoundsChange) {
        onBoundsChange(map.getBounds());
      }
    },
  });

  useEffect(() => {
    if (onBoundsChange) {
      onBoundsChange(map.getBounds());
    }
  }, []);

  return null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
}

export function LeafletMap({ places, onMapClick, onEdit, onDelete, onFocus, focusedPlace, onBoundsChange }: LeafletMapProps) {
  const getIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.name === category);
    const IconComp = cat ? iconMap[cat.icon] : Compass;
    const color = cat?.hex || '#A855F7';
    
    // Use renderToStaticMarkup for perfect icon consistency
    const iconSvg = renderToStaticMarkup(
      <IconComp size={14} strokeWidth={3} />
    );
                  
    return L.divIcon({
      className: 'custom-emoji-pin',
      html: `
        <div style="background-color: white; padding: 4px; border-radius: 99px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid ${color};">
          <div style="background-color: ${color}; padding: 6px; border-radius: 99px; color: white; display: flex; align-items: center; justify-content: center;">
            ${iconSvg}
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[38.7223, -9.1393]} 
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {focusedPlace && (
          <ChangeView center={[focusedPlace.latitude, focusedPlace.longitude]} />
        )}
 
        <MapEvents onClick={onMapClick} onBoundsChange={onBoundsChange} />
 
        {(places || []).map((place) => {
          if (!place || !place.id) return null;
          const categoryObj = CATEGORIES.find(c => c.name === place.category);
          const IconComp = categoryObj ? iconMap[categoryObj.icon] || Compass : Compass;

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={getIcon(place.category)}
            >
              <Popup>
                <div className="p-4 min-w-[220px] max-w-[260px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${categoryObj?.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">
                      {place.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-tight mb-2">{place.name}</h3>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < place.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tight">
                      {place.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#D4A373] flex-shrink-0" />
                      <span className="text-xs font-medium leading-relaxed text-gray-600 line-clamp-2">
                        {place.address || 'Endereço não disponível'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onFocus(place)}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

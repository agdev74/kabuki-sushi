"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 🎨 Icônes personnalisées avec des Emojis (Simple et efficace)
const driverIcon = L.divIcon({
  className: 'custom-icon',
  html: '<div style="font-size: 32px; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.5)); transform: scaleX(-1);">🛵</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const restaurantIcon = L.divIcon({
  className: 'custom-icon',
  html: '<div style="font-size: 32px; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.5));">🍣</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Composant utilitaire pour recentrer la carte sur le livreur
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

interface DeliveryMapProps {
  driverLat: number | null;
  driverLng: number | null;
}

export default function DeliveryMap({ driverLat, driverLng }: DeliveryMapProps) {
  // Coordonnées du restaurant Kabuki (Ex: 1 Bd de la Tour, Genève)
  const restaurantLocation = { lat: 46.1978, lng: 6.1432 }; 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // ✅ On ignore l'avertissement ESLint car ce rendu différé est obligatoire avec Next.js/Leaflet
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 bg-neutral-900 animate-pulse rounded-2xl"></div>;

  const currentLat = driverLat || restaurantLocation.lat;
  const currentLng = driverLng || restaurantLocation.lng;

  return (
    <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden border border-neutral-800 shadow-xl relative z-0">
      <MapContainer 
        center={[currentLat, currentLng]} 
        zoom={14} 
        style={{ height: '100%', width: '100%', backgroundColor: '#171717' }}
        zoomControl={false}
      >
        {/* Tuile de carte sombre pour coller au design Kabuki */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        
        <RecenterAutomatically lat={currentLat} lng={currentLng} />

        {/* Marqueur du Restaurant */}
        <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantIcon}>
          <Popup className="kabuki-popup">Kabuki Sushi</Popup>
        </Marker>

        {/* Marqueur du Livreur (s'il est en route) */}
        {driverLat && driverLng && (
          <Marker position={[driverLat, driverLng]} icon={driverIcon}>
            <Popup className="kabuki-popup">Votre livreur est en approche !</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Petit badge par-dessus la carte */}
      <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        GPS en direct
      </div>
    </div>
  );
}
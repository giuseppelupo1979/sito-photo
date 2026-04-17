import React, { useEffect, useRef, useState } from 'react';

interface Props {
  lat: number;
  lng: number;
}

export const LocationMap: React.FC<Props> = ({ lat, lng }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || loaded) return;

    // Dynamically load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!mapRef.current) return;

      const map = L.map(mapRef.current).setView([lat, lng], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map);

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      L.marker([lat, lng], { icon }).addTo(map);
      setLoaded(true);
    });
  }, [lat, lng, loaded]);

  return (
    <div
      ref={mapRef}
      style={{
        height: 200,
        width: '100%',
        border: '1px solid rgba(255,255,255,0.06)',
        marginTop: 24,
        background: '#1a1714',
      }}
    />
  );
};

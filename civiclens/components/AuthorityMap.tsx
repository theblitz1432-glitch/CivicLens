'use client'
import { useEffect, useRef } from 'react';

type Complaint = {
  _id: string;
  category: string;
  description: string;
  status: string;
  location: { lat: number; lng: number; address: string; block: string };
  userId: { name: string };
};

const statusColor: Record<string, string> = {
  pending: '#ef4444',
  verified: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  rejected: '#6b7280',
};

export default function AuthorityMap({ complaints }: { complaints: Complaint[] }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Dynamically import Leaflet
    import('leaflet').then(L => {
      // Fix default icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Destroy existing map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Default center: Hisar, Haryana
      const defaultCenter: [number, number] = [29.1492, 75.7217];

      const validComplaints = complaints.filter(
        c => c.location?.lat && c.location?.lng &&
          Math.abs(c.location.lat) > 0.001 && Math.abs(c.location.lng) > 0.001
      );

      const center: [number, number] = validComplaints.length > 0
        ? [validComplaints[0].location.lat, validComplaints[0].location.lng]
        : defaultCenter;

      const map = L.map(containerRef.current!, { zoomControl: true }).setView(center, 12);
      mapRef.current = map;

      // OpenStreetMap tiles (free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add complaint markers
      validComplaints.forEach(c => {
        const color = statusColor[c.status] || '#6b7280';

        const icon = L.divIcon({
          html: `<div style="
            width:14px;height:14px;
            background:${color};
            border:2px solid white;
            border-radius:50%;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          "></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([c.location.lat, c.location.lng], { icon });

        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:180px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;text-transform:capitalize">${c.category}</div>
            <div style="font-size:11px;color:#666;margin-bottom:6px">${c.description.slice(0, 80)}...</div>
            <div style="font-size:11px;color:#444">${c.location.address || c.location.block}</div>
            <div style="margin-top:6px">
              <span style="
                background:${color}20;
                color:${color};
                padding:2px 8px;
                border-radius:20px;
                font-size:10px;
                font-weight:700;
                text-transform:capitalize;
              ">${c.status.replace('_', ' ')}</span>
            </div>
          </div>
        `);

        marker.addTo(map);
      });

      // If no valid complaints, show Hisar district view
      if (validComplaints.length === 0) {
        L.popup()
          .setLatLng(defaultCenter)
          .setContent('<div style="font-family:sans-serif;font-size:13px;font-weight:700">Hisar District — No complaint locations yet</div>')
          .openOn(map);
      } else {
        // Fit bounds to all markers
        const group = L.featureGroup(
          validComplaints.map(c => L.marker([c.location.lat, c.location.lng]))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [complaints]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
    </>
  );
}
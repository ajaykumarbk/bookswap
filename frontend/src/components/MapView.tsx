import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { MapPin, Shield } from 'lucide-react';

// Fix Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  books: Book[];
  userLat: number;
  userLng: number;
  radiusKm: number;
  height?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  books,
  userLat,
  userLng,
  radiusKm,
  height = '450px'
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-md">
      
      {/* Privacy Notice Banner */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/85 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
        <Shield className="w-3.5 h-3.5 text-amber-400" />
        <span>Approximate privacy-blurred locations displayed</span>
      </div>

      <MapContainer
        center={[userLat, userLng]}
        zoom={12}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location circle */}
        <Circle
          center={[userLat, userLng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#0284c7', fillColor: '#0284c7', fillOpacity: 0.1 }}
        />

        {/* Book Markers */}
        {books.map((book) => (
          <Marker key={book.id} position={[book.latitude, book.longitude]}>
            <Popup className="rounded-xl overflow-hidden">
              <div className="w-48 text-xs">
                <img
                  src={book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300'}
                  alt={book.title}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h4 className="font-bold text-slate-900 line-clamp-1">{book.title}</h4>
                <p className="text-slate-500 text-[11px] mb-1">by {book.author}</p>
                <div className="flex items-center justify-between text-[10px] text-amber-700 font-semibold mb-2">
                  <span>📍 ~{book.distanceKm || '2.0'} km away</span>
                  <span className="bg-amber-50 px-1.5 py-0.5 rounded">{book.condition}</span>
                </div>
                <Link
                  to={`/book/${book.id}`}
                  className="block w-full text-center py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] transition-colors"
                >
                  View Details & Swap
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

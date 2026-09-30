import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface LocationState {
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  radiusKm: number;
  isGPS: boolean;
}

interface LocationContextType {
  location: LocationState;
  setRadius: (radius: number) => void;
  updateLocation: (newLoc: Partial<LocationState>) => void;
  detectGPSLocation: () => Promise<void>;
  isModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

const DEFAULT_LOCATION: LocationState = {
  lat: 12.9716,
  lng: 77.5946,
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  radiusKm: 25,
  isGPS: false
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationState>(() => {
    const saved = localStorage.getItem('bookswap_location');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_LOCATION;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user && user.latitude && user.longitude) {
      setLocation(prev => ({
        ...prev,
        lat: user.latitude,
        lng: user.longitude,
        city: user.city || prev.city,
        state: user.state || prev.state,
        country: user.country || prev.country
      }));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bookswap_location', JSON.stringify(location));
  }, [location]);

  const setRadius = (radiusKm: number) => {
    setLocation(prev => ({ ...prev, radiusKm }));
  };

  const updateLocation = (newLoc: Partial<LocationState>) => {
    setLocation(prev => ({ ...prev, ...newLoc }));
  };

  const detectGPSLocation = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return reject(new Error('Geolocation not supported'));
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Attempt reverse geocoding via OpenStreetMap Nominatim
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.suburb || 'My Location';
            const state = data.address?.state || 'Local State';
            const country = data.address?.country || 'India';

            updateLocation({ lat, lng, city, state, country, isGPS: true });
          } catch (e) {
            updateLocation({ lat, lng, city: 'Nearby Area', state: 'Local State', country: 'India', isGPS: true });
          }
          resolve();
        },
        (error) => {
          console.warn('GPS detection failed or denied:', error.message);
          alert('Could not access GPS location. You can select your city manually!');
          reject(error);
        }
      );
    });
  };

  return (
    <LocationContext.Provider value={{
      location,
      setRadius,
      updateLocation,
      detectGPSLocation,
      isModalOpen,
      openLocationModal: () => setIsModalOpen(true),
      closeLocationModal: () => setIsModalOpen(false)
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
}

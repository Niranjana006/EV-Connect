import { useState, useEffect } from 'react';
import { Location } from '../types/location';

export const useLocation = () => {
  const [position, setPosition] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      console.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Location fetched:', pos.coords);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        console.error('Geolocation error:', err.message);
        setError(err.message);
      }
    );
  }, []);

  return { position, error };
};
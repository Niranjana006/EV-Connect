import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../../services/firebase';
import { collection, query, getDocs, GeoPoint } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';

// Haversine formula for distance (km)
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface Location {
  lat: number;
  lng: number;
}

interface UserData {
  id: string;
  email?: string;
  location?: GeoPoint; // Optional GeoPoint
  lastUpdated?: Date;
  distance?: number; // Add distance property
}

const MapView: React.FC = () => {
  const { user } = useAuth();
  const { position } = useLocation();
  const [nearbyUsers, setNearbyUsers] = useState<UserData[]>([]);

  useEffect(() => {
    const fetchNearbyUsers = async () => {
      if (position && user && 'lat' in position && 'lng' in position) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as UserData)) // Cast to UserData
          .filter((u) => u.id !== user.uid && u.location) // Exclude self, require location
          .map((u) => ({
            ...u,
            distance: u.location ? haversineDistance(position.lat, position.lng, u.location.latitude, u.location.longitude) : undefined,
          } as UserData)) // Only calculate if location exists
          .filter((u) => u.distance !== undefined && u.distance <= 10) // Within 10km, ensure distance exists
          .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance
        setNearbyUsers(users);
      }
    };

    fetchNearbyUsers();
  }, [position, user]);

  // Ensure center is a valid LatLngTuple
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : [51.505, -0.09]; // Fallback to London

  // Fix Leaflet icon
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  return (
    <MapContainer center={center} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {position && (
        <Marker position={[position.lat, position.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
      {nearbyUsers.map((user) => (
        <Marker key={user.id} position={[user.location!.latitude, user.location!.longitude]}>
          <Popup>
            <strong>{user.email}</strong><br />
            Distance: {user.distance!.toFixed(2)} km
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Station {
  id: string;
  name: string;
  position: [number, number];
  available: boolean;
  distance: number;
}

interface ChargingMapProps {
  stations: Station[];
  userPosition: [number, number] | null;
}

const ChargingMap: React.FC<ChargingMapProps> = ({ stations, userPosition }) => {
  const defaultPosition: L.LatLngExpression = [51.505, -0.09]; // London fallback
  const center = userPosition || defaultPosition;

  // Fix Leaflet marker icon issue
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
      {stations.map((station) => (
        <Marker key={station.id} position={station.position}>
          <Popup>
            <strong>{station.name}</strong><br />
            {station.available ? 'Available' : 'Occupied'}<br />
            Distance: {station.distance.toFixed(2)} km
          </Popup>
        </Marker>
      ))}
      {userPosition && (
        <Marker position={userPosition}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default ChargingMap;
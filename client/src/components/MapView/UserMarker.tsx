import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface UserMarkerProps {
  position: L.LatLngExpression;
  name: string;
}

const UserMarker: React.FC<UserMarkerProps> = ({ position, name }) => {
  return (
    <Marker position={position}>
      <Popup>{name}</Popup>
    </Marker>
  );
};

export default UserMarker;
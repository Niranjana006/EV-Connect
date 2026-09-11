import React from 'react';

interface ChargingCardProps {
  name: string;
  location: string;
  available: boolean;
  connectors: string[];
  distance: number;
}

const ChargingCard: React.FC<ChargingCardProps> = ({ name, location, available, connectors, distance }) => {
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold">{name}</h3>
      <p>{location}</p>
      <p className={available ? 'text-green-500' : 'text-red-500'}>
        {available ? 'Available' : 'Occupied'}
      </p>
      <p className="text-sm text-gray-600">Distance: {distance.toFixed(2)} km</p>
      {connectors.length > 0 && (
        <p className="text-sm text-gray-600">Connectors: {connectors.join(', ')}</p>
      )}
    </div>
  );
};

export default ChargingCard;
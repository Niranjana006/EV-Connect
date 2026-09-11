import React from 'react';
import ChargingCard from './ChargingCard';

interface Station {
  id: string;
  name: string;
  location: string;
  available: boolean;
  connectors: string[];
  distance: number;
}

interface ChargingListProps {
  stations: Station[];
}

const ChargingList: React.FC<ChargingListProps> = ({ stations }) => {
  return (
    <div className="mt-4">
      <h2 className="text-2xl font-bold mb-2">Nearby Stations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stations.map((station) => (
          <ChargingCard
            key={station.id}
            name={station.name}
            location={station.location}
            available={station.available}
            connectors={station.connectors}
            distance={station.distance}
          />
        ))}
      </div>
    </div>
  );
};

export default ChargingList;
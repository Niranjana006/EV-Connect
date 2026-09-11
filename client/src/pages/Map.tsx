import React from 'react';
import MapView from '../components/MapView/MapView';

const Map: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">User Map</h1>
      <MapView />
    </div>
  );
};

export default Map;
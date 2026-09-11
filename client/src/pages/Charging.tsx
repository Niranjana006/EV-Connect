import React from 'react';
import { useLocation } from '../hooks/useLocation';
import { getNearbyChargingStations } from '../services/chargingService';
import ChargingMap from '../components/ChargingAssistance/ChargingMap';
import ChargingList from '../components/ChargingAssistance/ChargingList';

const Charging: React.FC = () => {
  const { position, error } = useLocation();
  const [stations, setStations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log('User position:', position, 'Error:', error);
    if (position) {
      setLoading(true);
      getNearbyChargingStations(position)
        .then((data) => {
          console.log('Stations fetched:', data);
          setStations(data);
        })
        .finally(() => setLoading(false));
    } else if (error) {
      setLoading(false);
    }
  }, [position, error]);

  const userPosition: [number, number] | null = position ? [position.lat, position.lng] : null;

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Nearby Charging Stations</h1>
        <p>Loading your location...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Nearby Charging Stations</h1>
      {error && <p className="text-red-500">Location Error: {error}</p>}
      {!position && !error && <p>Fetching location...</p>}
      {position && (
        <p>
          Your Location: Lat {position.lat.toFixed(4)}, Lng {position.lng.toFixed(4)}
        </p>
      )}
      <ChargingMap stations={stations} userPosition={userPosition} />
      <ChargingList stations={stations} />
    </div>
  );
};

export default Charging;
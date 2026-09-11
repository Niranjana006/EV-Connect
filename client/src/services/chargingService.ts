import { Location } from '../types/location';

// Haversine formula to calculate distance (km) between two lat/lng points
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getNearbyChargingStations = async (location: Location, distanceKm = 50) => {
  try {
    const { lat, lng } = location;
    const url = `https://api.openchargemap.io/v3/poi/?output=json&maxresults=20&key=632427e5-a4de-492e-963a-02ef45862f37&latitude=${lat}&longitude=${lng}&distance=${distanceKm}&distanceunit=KM`;
    console.log('Fetching stations from:', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch stations: ${res.statusText}`);
    const data = await res.json();
    console.log('API Response:', data);
    return data
      .map((station: any) => ({
        id: station.ID,
        name: station.AddressInfo.Title,
        location: `${station.AddressInfo.AddressLine1}, ${station.AddressInfo.Town}`,
        available: station.StatusType ? station.StatusType.IsOperational : false,
        position: [station.AddressInfo.Latitude, station.AddressInfo.Longitude],
        connectors: station.Connections?.map((c: any) => c.ConnectionType?.Title || 'Unknown') || [],
        distance: haversineDistance(lat, lng, station.AddressInfo.Latitude, station.AddressInfo.Longitude)
      }))
      .filter((station: any) => station.distance <= distanceKm);
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};
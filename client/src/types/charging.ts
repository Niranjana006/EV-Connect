export interface ChargingStation {
    id: string;
    name: string;
    location: string;
    available: boolean;
    position: [number, number];
  }
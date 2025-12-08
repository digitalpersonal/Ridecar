export enum AppState {
  START,
  IN_RIDE,
  ADMIN_PANEL,
}

export interface Passenger {
  name: string;
  cpf?: string;
  whatsapp: string;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface Ride {
  passenger: Passenger;
  destination: {
    address: string;
    city: string;
  };
  startTime: number;
  endTime?: number;
  distance: number; // em quilômetros
  fare: number; // em BRL
  driverId: string;
  startLocation: GeolocationCoordinates | null;
}

export interface AddressSuggestion {
  description: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  password?: string; // Should be hashed in a real app
  carModel: string;
  licensePlate: string;
  city: string;
}

export interface FareRule {
  id: string;
  destinationCity: string;
  fare: number;
}
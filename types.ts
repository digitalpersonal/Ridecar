
export enum AppState {
  START,
  IN_RIDE,
  ADMIN_PANEL
}

export interface Passenger {
  id?: number | string;
  name: string;
  cpf?: string;
  whatsapp: string;
  driverId?: string;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressSuggestion {
  description: string;
}

export interface Ride {
  id?: string;
  passenger: Passenger;
  originAddress?: string; // Endereço de texto capturado pelo GPS
  destination: {
    address: string;
    city: string;
  };
  startTime: number;
  endTime?: number;
  distance: number;
  fare: number;
  driverId: string;
  startLocation: GeolocationCoordinates | null;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  password?: string;
  carModel: string;
  licensePlate: string;
  city: string;
  role?: 'admin' | 'driver';
  pixKey?: string;
  photoUrl?: string;
  brandName?: string;     
  primaryColor?: string;  
  backgroundColor?: string;
  customLogoUrl?: string; 
  slug?: string;          
}

export interface FareRule {
  id: string;
  originCity: string; 
  destinationCity: string;
  fare: number;
}

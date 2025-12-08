import { useState, useEffect } from 'react';
import type { GeolocationCoordinates } from '../types';

interface GeolocationState {
  location: GeolocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        isLoading: false,
        error: 'Geolocalização não é suportada pelo seu navegador.',
      });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        isLoading: false,
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Não foi possível obter a localização.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'A permissão para acessar a localização foi negada.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'A informação de localização não está disponível.';
          break;
        case error.TIMEOUT:
          errorMessage = 'A requisição para obter a localização expirou.';
          break;
      }
      setState({
        location: null,
        isLoading: false,
        error: errorMessage,
      });
    };

    setState(prev => ({ ...prev, isLoading: true }));
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };

  }, []);

  return state;
}

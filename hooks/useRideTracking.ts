import { useState, useEffect, useRef } from 'react';
import type { GeolocationCoordinates } from '../types';

// Função para calcular a distância entre duas coordenadas usando a fórmula de Haversine
const haversineDistance = (coords1: GeolocationCoordinates, coords2: GeolocationCoordinates): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371; // Raio da Terra em km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d;
};


export function useRideTracking(isActive: boolean) {
  const [distance, setDistance] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<GeolocationCoordinates | null>(null);
  const [path, setPath] = useState<GeolocationCoordinates[]>([]);
  const lastPositionRef = useRef<GeolocationCoordinates | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      // Inicia o rastreamento
      const onSuccess = (position: GeolocationPosition) => {
        const newPosition: GeolocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCurrentPosition(newPosition);
        setPath(prevPath => [...prevPath, newPosition]);

        if (lastPositionRef.current) {
          const newDistance = haversineDistance(lastPositionRef.current, newPosition);
          setDistance(prev => prev + newDistance);
        }
        lastPositionRef.current = newPosition;
      };

      const onError = (error: GeolocationPositionError) => {
        console.error("Erro no rastreamento GPS:", error);
      };

      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

    } else {
      // Para o rastreamento
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Reseta os estados quando a corrida não está ativa, exceto se for para mostrar o resultado final.
      // O reset completo é gerenciado pelo App.tsx.
      lastPositionRef.current = null;
    }

    return () => {
      // Limpeza ao desmontar o componente
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isActive]);

  return { distance, currentPosition, path };
}
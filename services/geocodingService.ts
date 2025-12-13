
import type { AddressSuggestion, GeolocationCoordinates } from '../types';

/**
 * Busca sugestões de endereço usando a API Nominatim (OpenStreetMap).
 * Retorna apenas o NOME DA RUA ou LOCAL para facilitar o preenchimento do número pelo motorista.
 */
export const geocodeAddress = async (query: string, city: string): Promise<AddressSuggestion[]> => {
  if (!query || query.length < 3) return [];

  try {
    // Adiciona o contexto da cidade e país para melhorar a precisão
    const fullQuery = `${query}, ${city}, Brazil`;
    
    // Removendo headers customizados para evitar problemas de CORS
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fullQuery)}&addressdetails=1&limit=5&countrycodes=br`
    );
    
    if (!response.ok) return [];

    const data = await response.json();
    
    // Mapeia os resultados para mostrar SOMENTE o nome da rua/local
    return data.map((item: any) => {
        const addr = item.address || {};
        
        // Prioridade: Nome da Rua > Pedestre > Rodovia > Praça > Nome do Lugar
        let streetName = addr.road || addr.pedestrian || addr.highway || addr.square || item.name;

        // Fallback: Se não achou campo específico, pega a primeira parte do display_name
        if (!streetName) {
             streetName = item.display_name.split(',')[0];
        }

        return {
            description: streetName
        };
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
};

/**
 * Obtém as coordenadas exatas (Latitude/Longitude) de um endereço.
 */
export const getCoordinatesForAddress = async (
  address: string,
  city: string
): Promise<GeolocationCoordinates | null> => {
  try {
    const fullQuery = `${address}, ${city}, Brazil`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fullQuery)}&limit=1&countrycodes=br`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Coordinate fetch error:", error);
    return null;
  }
};

/**
 * Obtém o endereço legível e a cidade a partir de coordenadas GPS (Reverse Geocoding).
 */
export const getAddressFromCoordinates = async (
  latitude: number, 
  longitude: number
): Promise<{ address: string; city: string } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.address) {
        const addr = data.address;
        
        // Prioriza mostrar apenas a rua onde o motorista está
        const street = addr.road || addr.pedestrian || addr.highway || addr.square || addr.suburb || data.display_name.split(',')[0];
        
        // Tenta encontrar a cidade em vários campos possíveis do Nominatim
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.administrative || '';

        return {
            address: street,
            city: city
        };
    }
    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

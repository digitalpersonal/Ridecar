
import type { AddressSuggestion, GeolocationCoordinates } from '../types';

/**
 * Busca sugestões de endereço usando a API Nominatim (OpenStreetMap).
 * Retorna dados reais de ruas e locais na cidade especificada.
 */
export const geocodeAddress = async (query: string, city: string): Promise<AddressSuggestion[]> => {
  if (!query || query.length < 3) return [];

  try {
    // Adiciona o contexto da cidade e país para melhorar a precisão
    const fullQuery = `${query}, ${city}, Brazil`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fullQuery)}&addressdetails=1&limit=5&countrycodes=br`,
      {
         headers: {
             'Accept-Language': 'pt-BR'
         }
      }
    );
    
    if (!response.ok) return [];

    const data = await response.json();
    
    // Mapeia os resultados do Nominatim para o formato do App
    return data.map((item: any) => {
        // Formata o endereço para ficar mais limpo
        // O display_name do Nominatim é bem completo.
        const cleanName = item.display_name.split(', Brazil')[0];
        return {
            description: cleanName
        };
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
};

/**
 * Obtém as coordenadas exatas (Latitude/Longitude) de um endereço.
 * Usa Nominatim para converter "Rua X, Guaxupé" em coordenadas GPS reais.
 */
export const getCoordinatesForAddress = async (
  address: string,
  city: string
): Promise<GeolocationCoordinates | null> => {
  try {
    const fullQuery = `${address}, ${city}, Brazil`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fullQuery)}&limit=1&countrycodes=br`,
       {
         headers: {
             'Accept-Language': 'pt-BR'
         }
      }
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

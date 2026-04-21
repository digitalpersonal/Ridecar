
import type { AddressSuggestion, GeolocationCoordinates } from '../types';

// Cache simples para evitar requisições repetidas
const cache: { [key: string]: any } = {};

/**
 * Busca sugestões de endereço usando a API Nominatim (OpenStreetMap).
 * Retorna apenas o NOME DA RUA ou LOCAL para facilitar o preenchimento do número pelo motorista.
 */
export const geocodeAddress = async (query: string, city: string): Promise<AddressSuggestion[]> => {
  if (!query || query.length < 3) return [];

  const cacheKey = `geocode_${query}_${city}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    // Photon (Komoot) é mais rápido e tem CORS menos restritivo para busca
    const fullQuery = `${query}, ${city}`;
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(fullQuery)}&limit=5&lang=pt`
    );
    
    if (!response.ok) return [];

    const data = await response.json();
    
    if (!data || !data.features) return [];
    
    const results = data.features.map((feature: any) => {
        const props = feature.properties;
        let streetName = props.name || props.street;
        
        if (props.street && props.name !== props.street) {
             streetName = `${props.name} (${props.street})`;
        }

        if (!streetName) streetName = props.district || props.city;

        return { description: streetName || "Local desconhecido" };
    });

    // Remove duplicatas
    const uniqueResults = results.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.description === v.description) === i);

    cache[cacheKey] = uniqueResults;
    return uniqueResults;
  } catch (error) {
    // Silencia o erro de fetch para não poluir o console do usuário
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
  const cacheKey = `coords_${address}_${city}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const fullQuery = `${address}, ${city}, Brazil`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fullQuery)}&limit=1&countrycodes=br`,
      {
          headers: {
              'Accept': 'application/json',
          }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.length > 0) {
      const res = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
      cache[cacheKey] = res;
      return res;
    }
    return null;
  } catch (error) {
    return null;
  }
};

let lastReverseCoords = { lat: 0, lon: 0, time: 0 };

/**
 * Obtém o endereço legível e a cidade a partir de coordenadas GPS (Reverse Geocoding).
 */
export const getAddressFromCoordinates = async (
  latitude: number, 
  longitude: number
): Promise<{ address: string; city: string } | null> => {
  const now = Date.now();
  // Calcula a distância quadrada. 0.00000001 (10^-8) é aprox 10 metros, o que exige alta precisão.
  const distSq = Math.pow(latitude - lastReverseCoords.lat, 2) + Math.pow(longitude - lastReverseCoords.lon, 2);
  
  // Apenas usa cache se foi há menos de 10 segundos E a distância for menor que ~10 metros
  if (now - lastReverseCoords.time < 10000 && distSq < 0.00000001) {
      const cached = cache[`reverse_${latitude.toFixed(5)}_${longitude.toFixed(5)}`];
      if (cached) return cached;
  }

    try {
    // Adicionamos parâmetros recomendados pela Nominatim para identificar o app e evitar bloqueios.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&extratags=1&email=digitalpersonal@gmail.com`,
      {
          headers: {
              'Accept': 'application/json',
              'Accept-Language': 'pt-BR,pt;q=0.9',
          }
      }
    );

    if (!response.ok) {
        // Fallback para uma API secundária se o Nominatim falhar (ex: BigDataCloud)
        const bdcResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`);
        if (bdcResponse.ok) {
            const bdcData = await bdcResponse.json();
            const res = { 
                address: bdcData.locality || bdcData.city || "Localização Capturada", 
                city: bdcData.city || bdcData.principalSubdivision || '' 
            };
            return res;
        }
        return null;
    }

    const data = await response.json();
    if (data && data.address) {
        const addr = data.address;
        
        const road = addr.road || addr.pedestrian || addr.highway || addr.square || addr.stairway;
        const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
        const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district || addr.hamlet;
        
        let street = road ? `${road}${houseNumber}` : (addr.suburb || neighborhood || "Endereço não identificado");
        if (neighborhood && road && neighborhood !== road) street += ` - ${neighborhood}`;
        
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || '';

        const res = { address: street, city: city };
        cache[`reverse_${latitude.toFixed(5)}_${longitude.toFixed(5)}`] = res;
        lastReverseCoords = { lat: latitude, lon: longitude, time: now };
        return res;
    }
    return null;
  } catch (error) {
    // Se falhar o fetch, retornamos null silenciosamente
    return null;
  }
};

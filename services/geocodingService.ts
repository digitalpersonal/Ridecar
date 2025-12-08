import type { AddressSuggestion, GeolocationCoordinates } from '../types';

const MOCK_PLACES = [
  "Avenida Principal, 123",
  "Rua das Flores, 456",
  "Praça Central, S/N",
  "Shopping da Cidade, Loja 789",
  "Aeroporto Internacional",
  "Estação de Metrô Centro",
  "Parque Municipal",
  "Hospital Boa Saúde"
];

/**
 * Simula uma chamada de API de geocodificação, agora contextualizada pela cidade.
 * @param query O texto de busca do usuário.
 * @param city A cidade onde a busca deve ser realizada.
 * @returns Uma promessa que resolve para um array de sugestões de endereço.
 */
export const geocodeAddress = async (query: string, city: string): Promise<AddressSuggestion[]> => {
  console.log(`Buscando endereço para: "${query}" em "${city}"`);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim() || !city.trim()) {
        resolve([]);
        return;
      }
      
      const lowerCaseQuery = query.toLowerCase();
      const filteredPlaces = MOCK_PLACES
        .filter(place => place.toLowerCase().includes(lowerCaseQuery))
        .map(place => ({ description: `${place}, ${city}` }));

      resolve(filteredPlaces);
    }, 500); // Simula a latência da rede
  });
};

/**
 * Simula a obtenção de coordenadas para um endereço de destino.
 * @param address O endereço de destino.
 * @param baseLocation A localização inicial para gerar um destino relativo.
 * @returns Uma promessa que resolve para as coordenadas do destino.
 */
export const getCoordinatesForAddress = async (
  address: string,
  baseLocation: GeolocationCoordinates
): Promise<GeolocationCoordinates | null> => {
  console.log(`Geocodificando endereço: "${address}" relativo a`, baseLocation);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!baseLocation) {
        resolve(null);
        return;
      }
      // Lógica de mock: cria um deslocamento pseudo-aleatório com base no comprimento do endereço
      // para simular um local diferente para endereços diferentes, dentro de um intervalo razoável.
      const latOffset = (address.length % 40 - 20) / 150; // aprox +/- 7km
      const lngOffset = (address.length % 30 - 15) / 150; // aprox +/- 7km

      resolve({
        latitude: baseLocation.latitude + latOffset,
        longitude: baseLocation.longitude + lngOffset,
      });
    }, 800); // Simula a latência da rede para geocodificação
  });
};
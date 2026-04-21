import type { FareRule } from '../types';

export const calculateFare = (
  originCity: string,
  destinationCity: string,
  fareRules: FareRule[]
): number | null => {
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  
  const rule = fareRules.find(r => 
    normalize(r.originCity) === normalize(originCity) && 
    normalize(r.destinationCity) === normalize(destinationCity)
  );

  return rule ? rule.fare : null;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
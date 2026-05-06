import { Category } from '../types';

export function normalizeCategory(name: string): Category {
  const n = name.toLowerCase().trim();
  
  if (n.includes('restaurante') || n.includes('food') || n.includes('comida') || n.includes('gastronomia') || n.includes('cafe')) {
    return 'Restaurantes';
  }
  
  if (n.includes('bar') || n.includes('pub') || n.includes('cerveja') || n.includes('beer') || n.includes('vinho') || n.includes('wine')) {
    return 'Bares';
  }
  
  if (n.includes('praia') || n.includes('beach') || n.includes('mar') || n.includes('ocean')) {
    return 'Praias';
  }
  
  if (n.includes('passeio') || n.includes('tour') || n.includes('visita') || n.includes('jardim') || n.includes('garden') || n.includes('park') || n.includes('museum') || n.includes('museu')) {
    return 'Passeios';
  }
  
  if (n.includes('alojamento') || n.includes('hotel') || n.includes('hostel') || n.includes('bed') || n.includes('estadia') || n.includes('stay') || n.includes('accommodation') || n.includes('apartamento')) {
    return 'Alojamento';
  }
  
  return 'Restaurantes'; // Default
}

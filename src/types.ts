/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Bares' | 'Restaurantes' | 'Passeios' | 'Praias' | 'Alojamento';

export type Status = 'Já fomos' | 'Queremos ir' | 'Favorito';

export interface Place {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  category: Category;
  latitude: number;
  longitude: number;
  rating: number; // 1-5
  date: string;
  notes: string;
  status: Status;
  favorite: boolean;
  createdAt: number;
}

export interface CategoryDef {
  name: Category;
  icon: string;
  color: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const CATEGORIES: CategoryDef[] = [
  { 
    name: 'Bares', 
    icon: 'Beer', 
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    hex: '#F97316',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-100'
  },
  { 
    name: 'Restaurantes', 
    icon: 'Utensils', 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    hex: '#10B981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-100'
  },
  { 
    name: 'Passeios', 
    icon: 'Compass', 
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    hex: '#3B82F6',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-100'
  },
  { 
    name: 'Praias', 
    icon: 'Umbrella', 
    color: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    hex: '#EAB308',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-600',
    borderClass: 'border-yellow-100'
  },
  { 
    name: 'Alojamento', 
    icon: 'Bed', 
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    hex: '#A855F7',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-600',
    borderClass: 'border-purple-100'
  }
];

export const STATUSES: { name: Status; color: string }[] = [
  { name: 'Já fomos', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { name: 'Queremos ir', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { name: 'Favorito', color: 'bg-rose-50 text-rose-700 border-rose-100' },
];

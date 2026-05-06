/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Place } from '../types';

const STORAGE_KEY = 'nossa_jornada_places';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlaces(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to parse places', e);
        setPlaces([]);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    }
  }, [places, isLoaded]);

  const addPlace = (place: Omit<Place, 'id' | 'createdAt'>) => {
    const newPlace: Place = {
      ...place,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setPlaces((prev) => [newPlace, ...prev]);
    return newPlace;
  };

  const updatePlace = (id: string, updates: Partial<Place>) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deletePlace = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    places,
    addPlace,
    updatePlace,
    deletePlace,
    isLoaded,
  };
}

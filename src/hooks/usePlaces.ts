/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Place } from '../types';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'nossa_jornada_places';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformed: Place[] = data.map(item => ({
          id: item.id,
          name: item.name,
          address: item.address,
          city: item.city,
          country: item.country,
          category: item.category,
          status: item.status,
          rating: item.rating,
          date: item.date,
          notes: item.notes,
          latitude: Number(item.lat),
          longitude: Number(item.lng),
          favorite: item.favorite || false,
          createdAt: new Date(item.created_at).getTime(),
        }));
        setPlaces(transformed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transformed));
      }
    } catch (e) {
      console.error('Error fetching places from Supabase:', e);
      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPlaces(JSON.parse(saved));
      }
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchPlaces();

    // Subscribe to changes for real-time collaboration
    const channel = supabase
      .channel('places-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'places'
        },
        () => {
          fetchPlaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addPlace = async (place: Omit<Place, 'id' | 'createdAt'>) => {
    // Generate temporary ID for immediate feedback
    const tempId = crypto.randomUUID();
    const newPlace: Place = {
      ...place,
      id: tempId,
      createdAt: Date.now(),
    };

    // Optimistic update
    setPlaces((prev) => [newPlace, ...prev]);

    try {
      const { data, error } = await supabase
        .from('places')
        .insert([{
          name: place.name,
          address: place.address,
          city: place.city,
          country: place.country,
          category: place.category,
          status: place.status,
          rating: place.rating,
          date: place.date,
          notes: place.notes,
          lat: place.latitude,
          lng: place.longitude,
          favorite: place.favorite || false,
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const saved = data[0];
        const finalPlace: Place = {
          ...newPlace,
          id: saved.id,
          createdAt: new Date(saved.created_at).getTime(),
        };
        // Replace temp place with real one
        setPlaces(prev => prev.map(p => p.id === tempId ? finalPlace : p));
      }
    } catch (e) {
      console.error('Error adding place to Supabase:', e);
      // If error, we might want to keep the local one but mark it as "unsynced" 
      // or just refresh to be sure
      fetchPlaces();
    }
  };

  const updatePlace = async (id: string, updates: Partial<Place>) => {
    // Optimistic update
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      const supabaseUpdates: any = { ...updates };
      if (updates.latitude !== undefined) {
        supabaseUpdates.lat = updates.latitude;
        delete supabaseUpdates.latitude;
      }
      if (updates.longitude !== undefined) {
        supabaseUpdates.lng = updates.longitude;
        delete supabaseUpdates.longitude;
      }
      if (updates.createdAt !== undefined) {
        delete supabaseUpdates.createdAt; // Don't update created_at
      }

      const { error } = await supabase
        .from('places')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.error('Error updating place in Supabase:', e);
      fetchPlaces(); // Revert on failure
    }
  };

  const deletePlace = async (id: string) => {
    // Optimistic update
    setPlaces((prev) => prev.filter((p) => p.id !== id));

    try {
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting place from Supabase:', e);
      fetchPlaces(); // Revert on failure
    }
  };

  return {
    places,
    addPlace,
    updatePlace,
    deletePlace,
    isLoaded,
    refresh: fetchPlaces
  };
}

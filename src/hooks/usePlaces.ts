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
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = async () => {
    try {
      setError(null);
      const { data, error: sbError } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) {
        console.error('Supabase fetch error:', sbError);
        throw sbError;
      }

      if (data) {
        const transformed: Place[] = data.map(item => ({
          id: item.id,
          name: item.name,
          address: item.address || '',
          city: item.city || '',
          country: item.country || '',
          category: item.category,
          status: item.status,
          rating: item.rating,
          date: item.date,
          notes: item.notes || '',
          latitude: Number(item.lat),
          longitude: Number(item.lng),
          favorite: item.favorite || false,
          createdAt: new Date(item.created_at).getTime(),
        }));
        setPlaces(transformed);
        // We still keep a small cache in localStorage for better UX on slow networks, 
        // but Supabase is the truth.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transformed));
      }
    } catch (e) {
      console.error('Final error fetching places:', e);
      setError('Erro ao carregar lugares. Verifique a conexão.');
      
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setPlaces(JSON.parse(saved));
        } catch (err) {
          console.error('Failed to parse cached places', err);
        }
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
    setError(null);
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
      console.log('Sending insert request to Supabase for:', place.name);
      
      const { data, error: sbError } = await supabase
        .from('places')
        .insert([{
          id: tempId, // Explicitly send the ID we generated
          name: place.name,
          address: place.address || '',
          city: place.city || '',
          country: place.country || '',
          category: place.category,
          status: place.status,
          rating: place.rating,
          date: place.date,
          notes: place.notes || '',
          lat: place.latitude,
          lng: place.longitude,
          favorite: place.favorite || false,
        }])
        .select()
        .single();

      if (sbError) {
        console.error('Supabase detailed insert error:', sbError);
        throw sbError;
      }

      console.log('Successfully inserted into Supabase:', data);

      if (data) {
        const finalPlace: Place = {
          id: data.id,
          name: data.name,
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          category: data.category,
          status: data.status,
          rating: data.rating,
          date: data.date,
          notes: data.notes || '',
          latitude: Number(data.lat),
          longitude: Number(data.lng),
          favorite: data.favorite || false,
          createdAt: new Date(data.created_at).getTime(),
        };
        // Replace temp place with real one
        setPlaces(prev => prev.map(p => p.id === tempId ? finalPlace : p));
      }
    } catch (e: any) {
      console.error('Caught error in addPlace:', e);
      setError(`Erro ao salvar local: ${e.message || 'Erro desconhecido'}`);
      fetchPlaces(); // Refresh to ensure sync and revert optimistic UI if needed
    }
  };

  const updatePlace = async (id: string, updates: Partial<Place>) => {
    setError(null);
    // Optimistic update
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      const supabaseUpdates: any = { ...updates };
      
      // Map frontend names to database names
      if ('latitude' in updates) {
        supabaseUpdates.lat = updates.latitude;
        delete supabaseUpdates.latitude;
      }
      if ('longitude' in updates) {
        supabaseUpdates.lng = updates.longitude;
        delete supabaseUpdates.longitude;
      }
      if ('createdAt' in updates) {
        delete supabaseUpdates.createdAt;
      }
      // Remove id from updates if present
      delete supabaseUpdates.id;

      // Ensure updated_at is touched
      supabaseUpdates.updated_at = new Date().toISOString();

      const { error: sbError } = await supabase
        .from('places')
        .update(supabaseUpdates)
        .eq('id', id);

      if (sbError) {
        console.error('Supabase update error:', sbError);
        throw sbError;
      }
    } catch (e: any) {
      console.error('Error updating place in Supabase:', e);
      setError(`Erro ao atualizar local: ${e.message || 'Erro desconhecido'}`);
      fetchPlaces(); // Revert on failure
    }
  };

  const deletePlace = async (id: string) => {
    setError(null);
    // Optimistic update
    setPlaces((prev) => prev.filter((p) => p.id !== id));

    try {
      const { error: sbError } = await supabase
        .from('places')
        .delete()
        .eq('id', id);

      if (sbError) {
        console.error('Supabase delete error:', sbError);
        throw sbError;
      }
    } catch (e: any) {
      console.error('Error deleting place from Supabase:', e);
      setError(`Erro ao excluir local: ${e.message || 'Erro desconhecido'}`);
      fetchPlaces(); // Revert on failure
    }
  };

  return {
    places,
    addPlace,
    updatePlace,
    deletePlace,
    isLoaded,
    error,
    refresh: fetchPlaces
  };
}

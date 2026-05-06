/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Place, CATEGORIES } from '../types';
import { Star, MapPin, ChevronRight, Search, Beer, Utensils, Compass, Umbrella, Bed, Navigation, Copy, Edit2, Trash2, Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

const iconMap: Record<string, any> = {
  Beer,
  Utensils,
  Compass,
  Umbrella,
  Bed,
};

interface PlaceListProps {
  places: Place[];
  onFocus: (place: Place) => void;
  onEdit: (place: Place) => void;
  onDelete: (id: string) => void;
  selectedCategory: string;
  focusedPlaceId: string | null;
}

export function PlaceList({ places, onFocus, onEdit, onDelete, selectedCategory, focusedPlaceId }: PlaceListProps) {
  const [search, setSearch] = useState('');
  const [showCopyTooltip, setShowCopyTooltip] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const filtered = places.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedCategory === 'Tudo' || p.category === selectedCategory)
  );

  const openRoute = (place: Place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, '_blank');
  };

  const copyAddress = (place: Place) => {
    const addr = place.address || `${place.latitude}, ${place.longitude}`;
    navigator.clipboard.writeText(addr);
    setShowCopyTooltip(place.id);
    setTimeout(() => setShowCopyTooltip(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="p-6 pb-4 space-y-4 shadow-sm z-10">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Lugares</h2>
        
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Procurar na jornada..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-gray-100 border focus:border-[#D4A373] focus:bg-white focus:ring-0 transition-all text-sm text-gray-700 font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3 no-scrollbar mt-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-50">
              <Search className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest opacity-60">
              Vazio aqui
            </p>
          </div>
        ) : (
          filtered.map((place) => {
            const isExpanded = focusedPlaceId === place.id;
            const categoryObj = CATEGORIES.find(c => c.name === place.category);
            const Icon = iconMap[categoryObj?.icon || 'Compass'];

            return (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'bg-white border-[#D4A373]/30 shadow-xl ring-1 ring-[#D4A373]/10' 
                    : 'bg-white border-gray-50 hover:border-gray-200 shadow-sm'
                }`}
              >
                <button
                  onClick={() => onFocus(place)}
                  className="w-full text-left p-4 flex items-start gap-4 transition-colors group"
                >
                  <div className={`p-3 rounded-2xl flex-shrink-0 transition-all duration-500 ${
                    isExpanded ? 'bg-gray-900 text-white shadow-lg' : `${categoryObj?.color} group-hover:scale-105`
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold transition-all duration-300 truncate text-[16px] ${
                      isExpanded ? 'text-[#D4A373]' : 'text-gray-800'
                    }`}>
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < place.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        {place.category}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronDown className={`w-5 h-5 transition-transform duration-500 text-gray-300 ${isExpanded ? 'rotate-180 text-[#D4A373]' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-50 overflow-hidden"
                    >
                      <div className="p-3 pt-2 space-y-3 bg-gray-50/30">
                        {/* More Info */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-1.5">
                            {place.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 text-[#D4A373] mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0">Endereço</p>
                                  <p className="text-[11px] text-gray-700 font-medium leading-tight">{place.address}</p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-start gap-2">
                                <Calendar className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0">Data</p>
                                  <p className="text-[11px] text-gray-700 font-bold">
                                    {place.date ? new Date(place.date).toLocaleDateString('pt-BR') : 'Sem data'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-3 h-3 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                  <div className={`w-1 h-1 rounded-full ${place.status === 'Favorito' ? 'bg-rose-500' : place.status === 'Já fomos' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                </div>
                                <div>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0">Status</p>
                                  <p className="text-[11px] text-gray-700 font-bold">{place.status}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {place.notes && (
                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-0.5 h-full bg-[#D4A373]/30" />
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 px-0.5">Notas</p>
                              <p className="text-[11px] text-gray-600 italic leading-snug font-medium">"{place.notes}"</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openRoute(place)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-black transition-all active:scale-95"
                          >
                            <Navigation className="w-2.5 h-2.5" />
                            Direções
                          </button>
                          <button
                            onClick={() => copyAddress(place)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-100 text-gray-700 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:border-[#D4A373] transition-all relative"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            {showCopyTooltip === place.id ? 'Copiado!' : 'Morada'}
                          </button>
                        </div>
                        <div className="flex gap-1.5 pt-0.5">
                          <button
                            onClick={() => onEdit(place)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white border border-gray-50 text-gray-400 rounded-lg text-[8px] font-bold uppercase tracking-widest hover:text-[#D4A373] transition-all"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(place.id)}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${
                              confirmDeleteId === place.id 
                                ? 'bg-rose-600 text-white' 
                                : 'bg-rose-50/50 text-rose-400 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            {confirmDeleteId === place.id ? 'Confirmar' : 'Remover'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

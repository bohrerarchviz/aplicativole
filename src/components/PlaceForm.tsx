/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Place, CATEGORIES, STATUSES, Category, Status } from '../types';
import { normalizeCategory } from '../utils/categories';
import { X, Star, Search, Loader2, MapPin, Trash2, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  initialData?: Partial<Place>;
  mapBounds?: L.LatLngBounds | null;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    historic?: string;
    artwork?: string;
    building?: string;
    railway?: string;
    house_number?: string;
    municipality?: string;
  };
  type: string;
  isOutside?: boolean;
}

export function PlaceForm({ isOpen, onClose, onSubmit, onDelete, initialData, mapBounds }: PlaceFormProps) {
  const [formData, setFormData] = useState<Partial<Place>>({
    name: '',
    address: '',
    city: '',
    country: '',
    category: 'Restaurantes',
    status: 'Queremos ir',
    rating: 5,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    favorite: false,
    latitude: 0,
    longitude: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'no-results' | 'global-ask'>('idle');
  const [addressWarning, setAddressWarning] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        searchAddress();
      } else {
        setSuggestions([]);
        setSearchStatus('idle');
      }
    }, 600); 

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
    if (isOpen) {
      setSuggestions([]);
      setSearchQuery('');
      setShowDeleteConfirm(false);
      setSearchStatus('idle');
      setAddressWarning(null);
      setSubmitError(null);
    }
  }, [initialData, isOpen]);

  const searchAddress = async (forceGlobal = false) => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;
    setIsSearching(true);
    setSearchStatus('searching');
    try {
      // Prioritize Portugal by default unless global is requested
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=10`;
      
      if (!forceGlobal) {
        url += '&countrycodes=pt';
      }
      
      // If we have bounds and not forcing global, prioritize the area
      if (mapBounds && !forceGlobal) {
        const viewbox = `${mapBounds.getWest()},${mapBounds.getNorth()},${mapBounds.getEast()},${mapBounds.getSouth()}`;
        url += `&viewbox=${viewbox}&bounded=1`;
      }

      const response = await fetch(url);
      let data: Suggestion[] = await response.json();
      
      // If no results and we were bounded, try without boundary but still in Portugal
      if (data.length === 0 && mapBounds && !forceGlobal) {
          const globalRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5&countrycodes=pt`);
          data = await globalRes.json();
      }

      if (data.length === 0) {
        setSearchStatus(forceGlobal ? 'no-results' : 'global-ask');
        setSuggestions([]);
      } else {
        setSuggestions(data);
        setSearchStatus('idle');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchStatus('no-results');
    } finally {
      setIsSearching(false);
    }
  };

  const getTypeLabel = (suggestion: Suggestion) => {
    const addr = suggestion.address;
    if (addr.amenity) return addr.amenity.replace(/_/g, ' ');
    if (addr.tourism) return addr.tourism.replace(/_/g, ' ');
    if (addr.shop) return addr.shop.replace(/_/g, ' ');
    if (addr.leisure) return addr.leisure.replace(/_/g, ' ');
    if (addr.historic) return 'Histórico';
    if (addr.railway) return 'Transporte';
    if (suggestion.type === 'house' || suggestion.type === 'residential') return 'Morada';
    return suggestion.type.replace(/_/g, ' ');
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    const addr = suggestion.address;
    
    // Better logic for name extraction
    // If user pasted "Name, Street, Number...", try to take the first part as name
    const queryParts = searchQuery.split(',').map(p => p.trim());
    let name = '';
    
    if (queryParts.length > 1 && isNaN(parseInt(queryParts[0]))) {
       // First part is likely a name if it's not a number (like door number)
       name = queryParts[0];
    } else {
       const poiName = addr.amenity || addr.tourism || addr.shop || addr.leisure || addr.historic || addr.artwork || addr.building;
       name = poiName || suggestion.display_name.split(',')[0];
    }
    
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || '';
    const country = addr.country || '';
    const address = suggestion.display_name;

    if (!addr.house_number && suggestion.type === 'postcode') {
      setAddressWarning('Código postal encontrado. Verifique o número da porta.');
    } else if (!addr.house_number && (suggestion.type === 'road' || suggestion.type === 'street')) {
      setAddressWarning('Rua encontrada. Adicione o número da porta manualmente.');
    } else {
      setAddressWarning(null);
    }

    const poiType = addr.amenity || addr.tourism || addr.shop || addr.leisure || addr.historic || addr.artwork || addr.building || suggestion.type;

    setFormData((prev) => ({
      ...prev,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      address,
      city,
      country,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      category: normalizeCategory(poiType || name),
    }));
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.name) {
      setSubmitError('Por favor, dê um nome ao local.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setSubmitError('Selecione uma localização no mapa ou escolha uma morada válida.');
      return;
    }

    onSubmit(formData as Omit<Place, 'id' | 'createdAt'>);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] pointer-events-auto"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {initialData?.id ? 'Editar Detalhes' : 'Novo Lugar'}
              </h2>
              <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                {initialData?.id ? 'Atualize as informações' : 'Adicione uma nova memória'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-all group"
            >
              <X className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
            {/* Search Input Section */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1">
                {initialData?.id ? 'Mudar Localização (Busca)' : 'Pesquisar por nome ou endereço'}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
                  placeholder={initialData?.id ? "Procurar novo mapa..." : "Ex: Restaurante, Praça, Bar..."}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-gray-50 border-gray-100 border focus:bg-white focus:border-[#D4A373] focus:ring-0 transition-all text-sm text-gray-800 placeholder:text-gray-300 font-medium"
                />
                <button
                  type="button"
                  onClick={() => searchAddress()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-white rounded shadow-sm border border-gray-100 text-[#D4A373] hover:bg-[#D4A373] hover:text-white transition-all disabled:opacity-50"
                  disabled={isSearching}
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Tips for full address */}
              {!searchQuery && !suggestions.length && !formData.address && (
                <p className="text-[9px] text-gray-400 italic px-1">
                  Cole endereços completos (Rua, Número, Cidade) para melhor precisão.
                </p>
              )}
              
              {/* Suggestions List */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 border border-gray-100 rounded-xl bg-white shadow-xl overflow-hidden z-20 divide-y divide-gray-50"
                  >
                    {mapBounds && (
                      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Área atual do mapa</span>
                      </div>
                    )}
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left p-3 text-xs text-gray-600 hover:bg-gray-50 flex gap-2.5 transition-colors group"
                      >
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-300 group-hover:text-[#D4A373]" />
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800 line-clamp-1 truncate">{s.display_name.split(',')[0]}</p>
                            <span className="text-[8px] font-bold uppercase tracking-widest bg-[#D4A373]/10 text-[#D4A373] px-1.5 py-0.5 rounded flex-shrink-0">
                              {getTypeLabel(s)}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-1 italic mt-0.5">
                            {s.address.city || s.address.town || s.address.village || s.address.municipality || 'Local desconhecido'} • {s.address.country}
                          </p>
                        </div>
                      </button>
                    ))}
                    <div className="p-2 bg-gray-50/50 flex justify-between items-center px-3">
                      <button onClick={() => setSuggestions([])} className="text-[9px] uppercase font-bold text-gray-400 hover:text-gray-600">Fechar</button>
                      <button 
                        onClick={() => searchAddress(true)} 
                        className="text-[9px] uppercase font-bold text-[#D4A373] hover:underline"
                      >
                        Global
                      </button>
                    </div>
                  </motion.div>
                )}
                {searchStatus === 'global-ask' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 p-3 text-center bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Sem resultados nesta área.</p>
                    <button 
                      type="button"
                      onClick={() => searchAddress(true)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Procurar no mundo todo
                    </button>
                  </motion.div>
                )}
                {searchStatus === 'no-results' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 p-3 text-center bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Não encontramos esse local.</p>
                    <p className="text-[9px] text-gray-400 mb-2">Tente ajustar a morada ou escolher o ponto manualmente no mapa.</p>
                    <button 
                      type="button"
                      onClick={() => searchAddress(true)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Procurar Globalmente
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1">
                    Nome exibido
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border-gray-100 border focus:bg-white focus:border-[#D4A373] focus:ring-0 transition-all text-xs text-gray-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1 flex justify-between">
                    <span>Morada Completa</span>
                    {addressWarning && (
                      <span className="text-orange-500 flex items-center gap-1 normal-case font-medium">
                        <AlertCircle className="w-3 h-3" /> {addressWarning}
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={1}
                    value={formData.address || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (addressWarning) setAddressWarning(null);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border-gray-100 border focus:bg-white focus:border-[#D4A373] focus:ring-0 transition-all text-[11px] text-gray-800 font-medium resize-none leading-relaxed"
                    placeholder="Rua, número, código postal..."
                  />
                  {formData.latitude !== 0 && (
                    <div className="flex flex-col gap-0.5 px-1 mt-0.5">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Localização Confirmada</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1">
                      Categoria
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border-gray-100 border focus:bg-white focus:border-[#D4A373] focus:ring-0 transition-all text-xs text-gray-800 font-bold appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border-gray-100 border focus:bg-white focus:border-[#D4A373] focus:ring-0 transition-all text-xs text-gray-800 font-bold appearance-none cursor-pointer"
                    >
                      {STATUSES.map((stat) => (
                        <option key={stat.name} value={stat.name}>
                          {stat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border-gray-100 border focus:bg-white focus:border-[#D4A373] focus:ring-0 transition-all text-xs text-gray-800 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1">
                      Nota ({formData.rating || 0}/5)
                    </label>
                    <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-0.5 transition-all hover:scale-110"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              (formData.rating || 0) >= star
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 ml-1">
                    Anotações
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Descrevam as vossas memórias..."
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border-gray-100 border focus:bg-white focus:border-[#D4A373] focus:ring-0 transition-all text-xs text-gray-800 min-h-[60px] resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {submitError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 mb-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-600 font-bold leading-tight uppercase tracking-tight">{submitError}</p>
                  </motion.div>
                )}
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all shadow-lg active:scale-[0.98] text-sm"
                >
                  {initialData?.id ? 'Atualizar Lugar' : 'Adicionar'}
                </button>

                {initialData?.id && (
                  <div className="relative">
                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 text-rose-500 font-bold text-[11px] uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                      >
                        Remover Lugar permanentemente
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col gap-2 p-4 bg-rose-50 rounded-xl border border-rose-100"
                      >
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest text-center">Tem certeza?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onDelete?.(initialData.id as string);
                              onClose();
                            }}
                            className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-rose-700 transition-all"
                          >
                            Sim, apagar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 bg-white text-gray-500 py-2 rounded-lg font-bold text-xs border border-rose-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

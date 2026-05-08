/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LeafletMap } from './components/LeafletMap';
import { PlaceList } from './components/PlaceList';
import { PlaceForm } from './components/PlaceForm';
import { usePlaces } from './hooks/usePlaces';
import { Category, CATEGORIES, Place } from './types';
import { normalizeCategory } from './utils/categories';
import { Plus, Map as MapIcon, List as ListIcon, Filter, ChevronDown, ArrowLeft, Beer, Utensils, Compass, Umbrella, Bed, LayoutGrid, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const iconMap: Record<string, any> = {
  Beer,
  Utensils,
  Compass,
  Umbrella,
  Bed,
  LayoutGrid
};

export default function App() {
  const { places, addPlace, updatePlace, deletePlace, error: dbError } = usePlaces();
  const [welcomeSelected, setWelcomeSelected] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tudo');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Partial<Place> | null>(null);
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);
  const [currentBounds, setCurrentBounds] = useState<any>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredPlaces = useMemo(() => {
    const validPlaces = (places || []).filter(p => p && p.id && typeof p.latitude === 'number' && typeof p.longitude === 'number');
    if (selectedCategory === 'Tudo') return validPlaces;
    return validPlaces.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  const handleSelectCategory = (cat: string) => {
    setWelcomeSelected(cat);
    setSelectedCategory(cat);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    // Attempt to reverse geocode to get POI name/address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      const addr = data.address;
      const poiType = addr.amenity || addr.tourism || addr.shop || addr.leisure || addr.historic || addr.building || '';
      const poiName = addr.amenity || addr.tourism || addr.shop || addr.leisure || addr.historic || addr.building;
      const name = poiName || data.display_name.split(',')[0] || '';
      
      setEditingPlace({
        latitude: lat,
        longitude: lng,
        name: name,
        address: data.display_name,
        city: addr.city || addr.town || addr.village || addr.municipality || '',
        country: addr.country || '',
        category: normalizeCategory(poiType || name),
      });
    } catch (error) {
      setEditingPlace({ latitude: lat, longitude: lng });
    }
    setIsFormOpen(true);
  };

  const handleEdit = (place: Place) => {
    setEditingPlace(place);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: Omit<Place, 'id' | 'createdAt'>) => {
    if (editingPlace && (editingPlace as Place).id) {
      updatePlace((editingPlace as Place).id, data);
    } else {
      addPlace(data);
    }
    setEditingPlace(null);
    setIsFormOpen(false);
  };

  const currentCategoryObj = CATEGORIES.find(p => p.name === selectedCategory);
  const CurrentIcon = currentCategoryObj ? iconMap[currentCategoryObj.icon] : LayoutGrid;

  const stats = useMemo(() => {
    const validPlaces = (places || []).filter(p => p && p.id);
    return {
      total: validPlaces.length,
      visited: validPlaces.filter(p => p.status === 'Já fomos' || p.status === 'Favorito').length,
      toVisit: validPlaces.filter(p => p.status === 'Queremos ir').length,
      favorites: validPlaces.filter(p => p.status === 'Favorito').length,
      byCategory: CATEGORIES.reduce((acc, cat) => {
        acc[cat.name] = validPlaces.filter(p => p.category === cat.name).length;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [places]);

  const mapPlaces = useMemo(() => {
    const base = [...filteredPlaces];
    if (editingPlace && editingPlace.latitude && !editingPlace.id) {
      base.push({
        ...editingPlace,
        id: 'temp',
        name: editingPlace.name || 'Marcador Temporal',
        createdAt: Date.now(), // Fixed: Use number as per types
        category: editingPlace.category || 'Restaurantes',
        status: editingPlace.status || 'Queremos ir',
        rating: editingPlace.rating || 5,
        favorite: false,
        date: editingPlace.date || new Date().toISOString().split('T')[0],
        notes: editingPlace.notes || '',
      } as Place);
    }
    return base;
  }, [filteredPlaces, editingPlace]);

  if (!welcomeSelected) {
    return <WelcomeScreen onSelectCategory={handleSelectCategory} stats={stats} />;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-[#F8F9FA]">
      {/* Error Message Toast */}
      <AnimatePresence>
        {dbError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-rose-600 text-white rounded-full shadow-lg text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider"
          >
            <AlertCircle className="w-4 h-4" />
            {dbError}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-[350px] lg:w-[380px] bg-white border-r border-gray-100 z-30 shadow-sm relative">
        <div className="p-4 px-6 border-b border-gray-50 bg-gray-50/10">
           <div className="flex items-center justify-between gap-2">
               <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Estatísticas</span>
                  <div className="flex items-center gap-3 mt-1.5">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-900 leading-none">{stats.total}</span>
                        <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">Locais</span>
                     </div>
                     <div className="w-px h-5 bg-gray-100" />
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-500 leading-none">{stats.visited}</span>
                        <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">Fomos</span>
                     </div>
                     <div className="w-px h-5 bg-gray-100" />
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-500 leading-none">{stats.toVisit}</span>
                        <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">Ir</span>
                     </div>
                     <div className="w-px h-5 bg-gray-100" />
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-rose-500 leading-none">{stats.favorites}</span>
                        <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">Amamos</span>
                     </div>
                  </div>
               </div>
           </div>
        </div>
        <PlaceList 
          places={filteredPlaces} 
          onFocus={(p) => {
            if (focusedPlace?.id === p.id) {
              setFocusedPlace(null);
            } else {
              setFocusedPlace(p);
            }
          }} 
          onEdit={handleEdit}
          onDelete={deletePlace}
          focusedPlaceId={focusedPlace?.id || null}
          selectedCategory={selectedCategory} 
        />
      </div>

      {/* Main Map Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Responsive Header Controls */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center gap-2 pointer-events-none">
          {/* Back Button */}
          <div className="md:ml-0 pointer-events-auto">
            <button
              onClick={() => setWelcomeSelected(null)}
              className="p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 transition-all flex items-center gap-2 group"
              title="Voltar ao início"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline font-bold text-sm tracking-tight">Início</span>
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative pointer-events-auto flex-1 flex justify-center max-w-[200px] sm:max-w-xs">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-white text-gray-800 rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 hover:border-[#D4A373]/50 transition-all group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`p-1.5 rounded-lg ${currentCategoryObj?.color || 'bg-gray-100 text-gray-500'}`}>
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm truncate tracking-tight">{selectedCategory}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-[#D4A373] transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-2 w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden py-2 divide-y divide-gray-50"
                >
                  <button
                    onClick={() => {
                      setSelectedCategory('Tudo');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 hover:bg-gray-50 flex items-center gap-3 transition-colors ${selectedCategory === 'Tudo' ? 'text-[#D4A373]' : 'text-gray-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="font-bold text-sm">Tudo</span>
                  </button>
                  {CATEGORIES.map((cat) => {
                    const CatIcon = iconMap[cat.icon];
                    return (
                      <button
                        key={cat.name}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3.5 hover:bg-gray-50 flex items-center gap-3 transition-colors ${selectedCategory === cat.name ? 'text-[#D4A373]' : 'text-gray-600'}`}
                      >
                        <div className={`p-1.5 rounded-lg ${cat.color}`}>
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{cat.name}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Button */}
          <div className="pointer-events-auto">
            <button
              onClick={() => {
                setEditingPlace(null);
                setIsFormOpen(true);
              }}
              className="p-3.5 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-300 hover:bg-black hover:scale-105 transition-all active:scale-95 group"
              title="Novo Lugar"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className={`flex-1 transition-all duration-500 ${mobileView === 'list' && 'scale-95 opacity-0 md:opacity-100 md:scale-100 pointer-events-none md:pointer-events-auto'}`}>
          <LeafletMap
            places={mapPlaces}
            onMapClick={handleMapClick}
            onEdit={handleEdit}
            onDelete={deletePlace}
            onFocus={setFocusedPlace}
            onBoundsChange={setCurrentBounds}
            focusedPlace={focusedPlace || (editingPlace?.latitude && !editingPlace.id ? ({ ...editingPlace, id: 'temp' } as Place) : null)}
          />
        </div>

        {/* Mobile List View (Swipe panel could be better but sticking to current simple toggle) */}
        <AnimatePresence>
          {mobileView === 'list' && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-0 z-[1001] bg-white pt-24"
            >
              <PlaceList 
                places={filteredPlaces} 
                onFocus={(p) => {
                  if (focusedPlace?.id === p.id) {
                    setFocusedPlace(null);
                  } else {
                    setFocusedPlace(p);
                    setMobileView('map');
                  }
                }} 
                onEdit={handleEdit}
                onDelete={deletePlace}
                focusedPlaceId={focusedPlace?.id || null}
                selectedCategory={selectedCategory} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Mobile Layout Toggles */}
        <div className="md:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-[1002] flex p-1.5 bg-white/95 backdrop-blur-md rounded-[2rem] border border-gray-100 shadow-2xl ring-4 ring-black/5">
          <button
            onClick={() => setMobileView('map')}
            className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-sm font-bold tracking-tight transition-all ${
              mobileView === 'map' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Mapa
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-sm font-bold tracking-tight transition-all ${
              mobileView === 'list' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            Lista
          </button>
        </div>
      </main>

      <PlaceForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPlace(null);
        }}
        onSubmit={handleSubmit}
        onDelete={(id) => {
          deletePlace(id);
          setIsFormOpen(false);
        }}
        initialData={editingPlace || {}}
        mapBounds={currentBounds}
      />
    </div>
  );
}


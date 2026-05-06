/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { CATEGORIES } from '../types';
import { Heart, Beer, Utensils, Compass, Umbrella, Bed, ChevronRight } from 'lucide-react';

const iconMap: Record<string, any> = {
  Beer,
  Utensils,
  Compass,
  Umbrella,
  Bed,
};

interface WelcomeScreenProps {
  onSelectCategory: (category: string) => void;
  stats: {
    total: number;
    visited: number;
    toVisit: number;
    favorites: number;
    byCategory: Record<string, number>;
  };
}

export function WelcomeScreen({ onSelectCategory, stats }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFCFD]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Heart className="text-rose-400 w-12 h-12 fill-rose-100" />
          </motion.div>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-3 tracking-tight">
          Nossa Jornada
        </h1>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.3em]">
          Mapeando nossas memórias juntas
        </p>
      </motion.div>

      <div className="w-full max-w-6xl">
        <div className="flex items-center gap-4 mb-10">
           <div className="h-px bg-gray-100 flex-1" />
           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.4em] whitespace-nowrap">Explore as Categorias</p>
           <div className="h-px bg-gray-100 flex-1" />
        </div>

        {/* Desktop Grid Layout */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((cat, index) => {
            const Icon = iconMap[cat.icon];
            const count = stats.byCategory[cat.name] || 0;
            return (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(cat.name)}
                className="flex flex-col items-center p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#D4A373]/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-4 right-6 text-[9px] font-black text-gray-200 group-hover:text-[#D4A373]/20 transition-colors uppercase">
                   {count}
                </div>
                <div className={`p-4 rounded-3xl mb-6 transition-all duration-500 ${cat.color} group-hover:bg-[#D4A373] group-hover:text-white shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-gray-700 tracking-wider uppercase text-xs">
                  {cat.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Compact Layout */}
      <div className="flex sm:hidden flex-col gap-3 w-full max-w-sm">
        {CATEGORIES.map((cat, index) => {
          const Icon = iconMap[cat.icon];
          return (
            <motion.button
              key={cat.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(cat.name)}
              className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all"
            >
              <span className="font-bold text-gray-800 text-lg">
                {cat.name}
              </span>
              <div className={`p-2 rounded-xl ${cat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 text-gray-400 text-sm font-medium tracking-wide uppercase opacity-60"
      >
        Mapeando nossas memórias • BiruFind
      </motion.div>
    </div>
  );
}

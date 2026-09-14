import React, { useState } from 'react';
import { Camera, X, ZoomIn } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/initialData';

export const GallerySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLightboxItem, setActiveLightboxItem] = useState<typeof GALLERY_ITEMS[0] | null>(null);

  const categories = [
    { id: 'all', label: 'All Photos' },
    { id: 'cakes', label: 'Celebration Cakes' },
    { id: 'bakery', label: 'Fresh Bakery' },
    { id: 'food', label: 'Café Meals & Pizza' },
    { id: 'ambiance', label: 'Bistro & Seating' },
  ];

  const filteredItems = GALLERY_ITEMS.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  return (
    <section id="gallery-section" className="py-16 bg-emerald-50/20 border-t border-emerald-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Visual Glimpse</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Life at Punjabi Bistro & Bakery
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Freshly prepared daily in Dharamkot. Take a look at our artisan cakes, savory fast foods, and dining ambiance.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-emerald-50 border border-emerald-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveLightboxItem(item)}
              className="group relative rounded-2xl overflow-hidden aspect-square bg-stone-100 border border-emerald-100 cursor-pointer shadow-2xs hover:shadow-md transition-all"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3.5 text-white">
                <div className="font-bold text-xs line-clamp-1">{item.title}</div>
                <div className="text-[10px] text-emerald-200 uppercase tracking-wider">
                  {item.category}
                </div>
                <ZoomIn className="w-4 h-4 text-white/80 absolute top-3 right-3" />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeLightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveLightboxItem(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full bg-black">
              <img
                src={activeLightboxItem.image}
                alt={activeLightboxItem.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setActiveLightboxItem(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-emerald-950">
                  {activeLightboxItem.title}
                </h3>
                <span className="text-xs text-emerald-700 uppercase tracking-wider font-semibold">
                  {activeLightboxItem.category} • Punjabi Bistro Dharamkot
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveLightboxItem(null);
                  const el = document.getElementById('menu-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Order this item
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Cake,
  MessageCircle,
  Phone,
  Flame,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { MOODS } from './MoodCravingSelector';

interface MenuSectionProps {
  selectedMood: string | null;
  onClearMood: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ selectedMood, onClearMood }) => {
  const { products, categories, businessSettings, selectedCategory, setSelectedCategory } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Filters
  const [egglessOnly, setEgglessOnly] = useState<boolean>(false);
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [bestsellerOnly, setBestsellerOnly] = useState<boolean>(false);
  const [under200Only, setUnder200Only] = useState<boolean>(false);
  const [spicyOnly, setSpicyOnly] = useState<boolean>(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Mood filter
      if (selectedMood) {
        const moodObj = MOODS.find((m) => m.id === selectedMood);
        if (moodObj) {
          const matchMood = moodObj.filterKeywords.some(
            (kw) =>
              item.name.toLowerCase().includes(kw) ||
              item.description.toLowerCase().includes(kw) ||
              item.categoryName.toLowerCase().includes(kw)
          );
          if (!matchMood) return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = item.categoryName.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // Dietary & Attribute filters
      if (egglessOnly && !item.isEggless) return false;
      if (vegOnly && !item.isVegetarian) return false;
      if (bestsellerOnly && !item.isBestseller) return false;
      if (under200Only && item.price >= 200) return false;
      if (spicyOnly && !item.isSpicy) return false;

      return true;
    });
  }, [
    products,
    selectedCategory,
    searchQuery,
    selectedMood,
    egglessOnly,
    vegOnly,
    bestsellerOnly,
    under200Only,
    spicyOnly,
  ]);

  const activeFiltersCount = [
    egglessOnly,
    vegOnly,
    bestsellerOnly,
    under200Only,
    spicyOnly,
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setEgglessOnly(false);
    setVegOnly(false);
    setBestsellerOnly(false);
    setUnder200Only(false);
    setSpicyOnly(false);
    onClearMood();
  };

  return (
    <section id="menu-section" className="py-12 bg-white border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Handcrafted In Dharamkot</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0F2916] tracking-tight mt-1">
              Explore Our Digital Menu
            </h2>
            <p className="text-sm text-emerald-800/80 mt-1 max-w-xl">
              All bakery items & cakes are 100% eggless. Freshly prepared savoury pasta, pizzas, burgers, wraps, and sides for dine-in, takeaway, or direct delivery.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-80 relative">
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="menu-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you craving? (e.g. pizza, pasta)..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm text-[#0F2916] focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50/60 text-emerald-950 hover:bg-emerald-100/70 border border-emerald-100'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dietary and Value Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-emerald-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-emerald-700" />
            Filters:
          </span>

          <button
            onClick={() => setEgglessOnly(!egglessOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              egglessOnly
                ? 'bg-emerald-700 text-white border border-emerald-700'
                : 'bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Eggless Only</span>
          </button>

          <button
            onClick={() => setBestsellerOnly(!bestsellerOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              bestsellerOnly
                ? 'bg-amber-600 text-white border border-amber-600'
                : 'bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Bestsellers</span>
          </button>

          <button
            onClick={() => setUnder200Only(!under200Only)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              under200Only
                ? 'bg-emerald-900 text-white'
                : 'bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span>Under ₹200</span>
          </button>

          <button
            onClick={() => setSpicyOnly(!spicyOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              spicyOnly
                ? 'bg-rose-700 text-white'
                : 'bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>Spicy</span>
          </button>

          {/* Reset Filters */}
          {(activeFiltersCount > 0 || selectedCategory !== 'all' || searchQuery || selectedMood) && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-emerald-700 font-semibold underline hover:text-emerald-900 ml-auto cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div className="mt-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={(p) => setSelectedProductForModal(p)}
                />
              ))}
            </div>
          ) : (
            /* Friendly Empty State */
            <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-6 space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl border border-emerald-200">
                🔍
              </div>
              <h3 className="font-serif text-xl font-bold text-emerald-950">
                Couldn't find that exact item?
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/80 leading-relaxed">
                We might still have it fresh in the kitchen! You can check all categories or contact us directly on WhatsApp for custom preparation.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetAllFilters}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Browse Full Menu
                </button>

                <a
                  href={`https://wa.me/${businessSettings.whatsapp}?text=Hi%20Punjabi%20Bistro%2C%20I%20am%20looking%20for%20an%20item%20not%20found%20in%20search%3A%20${encodeURIComponent(
                    searchQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Ask on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Product Customization & Detail Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}
    </section>
  );
};

import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles } from 'lucide-react';

interface CategoryVisual {
  id: string;
  name: string;
  count: number;
  image: string;
  badge?: string;
}

const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    id: 'all',
    name: 'All Items',
    count: 24,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    badge: 'Full Menu',
  },
  {
    id: 'cakes',
    name: 'Eggless Cakes',
    count: 6,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
    badge: '100% Eggless',
  },
  {
    id: 'pizza',
    name: 'Pizzas',
    count: 4,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    badge: 'Pan Crust',
  },
  {
    id: 'burgers',
    name: 'Burgers & Wraps',
    count: 4,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    badge: 'Crispy Veg',
  },
  {
    id: 'pasta',
    name: 'Pastas & Italian',
    count: 4,
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=400&q=80',
    badge: 'White Sauce',
  },
  {
    id: 'sandwiches',
    name: 'Sandwiches',
    count: 3,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
    badge: 'Grilled',
  },
  {
    id: 'fries',
    name: 'Fries & Bites',
    count: 3,
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
    badge: 'Peri Peri',
  },
  {
    id: 'beverages',
    name: 'Drinks & Beer',
    count: 4,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    badge: 'Chilled',
  },
];

export const CategoryCircleNav: React.FC = () => {
  const { selectedCategory, setSelectedCategory } = useStore();

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    const menuEl = document.getElementById('menu-section');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section aria-label="Explore Menu Categories" className="py-8 sm:py-10 bg-white border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Discovery</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950 mt-0.5">
              Explore Menu by Category
            </h2>
          </div>
          <span className="text-xs text-emerald-800/80 font-medium hidden sm:inline">
            Tap any dish to view freshly prepared items
          </span>
        </div>

        {/* Circular Category Slider (Horizontal on mobile, flex-wrap on desktop) */}
        <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar">
          {CATEGORY_VISUALS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`circle-cat-${cat.id}`}
                onClick={() => handleCategoryClick(cat.id)}
                className="group flex flex-col items-center flex-shrink-0 focus:outline-none cursor-pointer transition-all duration-300"
                style={{ width: '82px' }}
              >
                {/* Circular Thumbnail Container */}
                <div
                  className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 transition-all duration-300 ${
                    isSelected
                      ? 'ring-3 ring-emerald-600 ring-offset-2 scale-105 shadow-md bg-emerald-100'
                      : 'hover:ring-2 hover:ring-emerald-300 group-hover:scale-105 bg-stone-100'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full shadow-inner"
                    loading="lazy"
                  />
                  {cat.badge && (
                    <span
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap uppercase tracking-tighter ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-950/90 text-white group-hover:bg-emerald-700'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </div>

                {/* Category Label & Item Count */}
                <span
                  className={`mt-2 text-xs font-bold text-center leading-tight line-clamp-1 transition-colors ${
                    isSelected ? 'text-emerald-700 font-extrabold' : 'text-emerald-950 group-hover:text-emerald-700'
                  }`}
                >
                  {cat.name}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  {cat.count} items
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};

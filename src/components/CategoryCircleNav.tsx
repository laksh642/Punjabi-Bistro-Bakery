import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles } from 'lucide-react';

interface CategoryVisual {
  id: string;
  name: string;
  image: string;
  badge?: string;
}

const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    id: 'all',
    name: 'All Items',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    badge: 'Full Menu',
  },
  {
    id: 'cakes',
    name: 'Eggless Cakes',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
    badge: '100% Eggless',
  },
  {
    id: 'pizza',
    name: 'Pizzas',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    badge: 'Pan Crust',
  },
  {
    id: 'burgers',
    name: 'Burgers & Rolls',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    badge: 'Crispy Veg',
  },
  {
    id: 'pasta',
    name: 'Pastas & Italian',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=400&q=80',
    badge: 'White & Red',
  },
  {
    id: 'sandwiches',
    name: 'Sandwiches',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
    badge: 'Grilled',
  },
  {
    id: 'fries',
    name: 'Fries & Bites',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
    badge: 'Peri Peri',
  },
  {
    id: 'beverages',
    name: 'Drinks & Beer',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    badge: 'Chilled',
  },
];

export const CategoryCircleNav: React.FC = () => {
  const { selectedCategory, setSelectedCategory, products } = useStore();

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    const menuEl = document.getElementById('menu-section');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section aria-label="Explore Menu Categories" className="py-6 sm:py-8 bg-stone-50/60 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>What are you craving?</span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-extrabold text-stone-900 mt-0.5">
              Explore by Food Category
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Scroll or tap to filter live menu
          </span>
        </div>

        {/* Horizontal Category Carousel */}
        <div className="flex items-start gap-3 sm:gap-5 overflow-x-auto pb-2 pt-1 scroll-smooth no-scrollbar">
          {CATEGORY_VISUALS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all' 
              ? products.length 
              : products.filter((p) => p.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                id={`circle-cat-${cat.id}`}
                onClick={() => handleCategoryClick(cat.id)}
                className="group flex flex-col items-center flex-shrink-0 focus:outline-none cursor-pointer transition-all duration-200 w-[74px] sm:w-20"
              >
                {/* Circular Thumbnail */}
                <div
                  className={`relative w-15 h-15 sm:w-18 sm:h-18 rounded-full p-0.5 transition-all duration-200 ${
                    isSelected
                      ? 'ring-2.5 ring-emerald-700 ring-offset-2 scale-105 shadow-md bg-emerald-700'
                      : 'hover:ring-2 hover:ring-emerald-400 group-hover:scale-105 bg-stone-200'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                  {cat.badge && (
                    <span
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap uppercase tracking-tighter ${
                        isSelected
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-900/90 text-white group-hover:bg-emerald-800'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </div>

                {/* Category Label & Item Count */}
                <span
                  className={`mt-2 text-[11px] sm:text-xs font-bold text-center leading-tight truncate max-w-[72px] sm:max-w-[80px] transition-colors ${
                    isSelected ? 'text-emerald-800 font-extrabold' : 'text-stone-800 group-hover:text-emerald-800'
                  }`}
                  title={cat.name}
                >
                  {cat.name}
                </span>
                <span className="text-[10px] text-stone-500 font-medium tabular-nums">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};

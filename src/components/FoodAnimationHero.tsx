import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Utensils, Cake, Flame, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface FoodSlide {
  id: string;
  categoryId: string;
  nameKey: string;
  badge: string;
  title: string;
  description: string;
  leftItem: {
    name: string;
    image: string;
    price: string;
    tag: string;
  };
  rightItem: {
    name: string;
    image: string;
    price: string;
    tag: string;
  };
  ingredients: {
    id: string;
    type: 'basil' | 'pepper' | 'cheese' | 'fry' | 'tomato' | 'cherry' | 'garlic';
    x: string;
    y: string;
    size: number;
    delay: number;
    className: string;
  }[];
}

const FOOD_SLIDES: FoodSlide[] = [
  {
    id: 'bistro',
    categoryId: 'all',
    nameKey: 'BISTRO',
    badge: '100% Pure Eggless Bakery & Café',
    title: 'Punjabi Bistro & Bakery',
    description: 'Stone-fired pizzas, crispy burgers, creamy pastas, and pure eggless celebration cakes crafted daily in Dharamkot.',
    leftItem: {
      name: 'Paneer Special Pizza',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80',
      price: '₹260',
      tag: 'Bestseller Pizza',
    },
    rightItem: {
      name: 'Belgian Truffle Cake',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80',
      price: '₹450',
      tag: '100% Eggless',
    },
    ingredients: [
      { id: 'm1', type: 'basil', x: '16%', y: '16%', size: 34, delay: 0, className: 'animate-ingredient-1' },
      { id: 'm2', type: 'pepper', x: '82%', y: '18%', size: 36, delay: 0.3, className: 'animate-ingredient-2' },
      { id: 'm3', type: 'cheese', x: '50%', y: '82%', size: 30, delay: 0.5, className: 'animate-ingredient-3' },
      { id: 'm4', type: 'cherry', x: '80%', y: '75%', size: 32, delay: 0.2, className: 'animate-ingredient-1' },
      { id: 'm5', type: 'fry', x: '20%', y: '78%', size: 34, delay: 0.4, className: 'animate-ingredient-2' },
    ],
  },
  {
    id: 'pizza',
    categoryId: 'pizza',
    nameKey: 'PIZZA',
    badge: '100% Mozzarella & Hand-Tossed Pan Crust',
    title: 'Stone-Fired Pizzas',
    description: 'Fresh dough hand-tossed with house pizza sauce, loaded with diced paneer, sweet corn, crisp capsicum and gooey cheese.',
    leftItem: {
      name: 'Makhani Paneer Pizza',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80',
      price: '₹280',
      tag: 'Chef Special',
    },
    rightItem: {
      name: 'Farmhouse Veggie Pizza',
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=700&q=80',
      price: '₹240',
      tag: 'Crispy Pan',
    },
    ingredients: [
      { id: 'p1', type: 'basil', x: '18%', y: '15%', size: 36, delay: 0, className: 'animate-ingredient-1' },
      { id: 'p2', type: 'pepper', x: '84%', y: '20%', size: 38, delay: 0.3, className: 'animate-ingredient-2' },
      { id: 'p3', type: 'cheese', x: '48%', y: '80%', size: 32, delay: 0.6, className: 'animate-ingredient-3' },
      { id: 'p4', type: 'basil', x: '78%', y: '74%', size: 30, delay: 0.4, className: 'animate-ingredient-1' },
      { id: 'p5', type: 'pepper', x: '22%', y: '82%', size: 34, delay: 0.2, className: 'animate-ingredient-2' },
    ],
  },
  {
    id: 'burgers',
    categoryId: 'burgers',
    nameKey: 'BURGER',
    badge: 'Golden Crisp Vegetable Patties & Toasted Buns',
    title: 'Crispy Burgers & Wraps',
    description: 'Crunchy golden herb patties layered with fresh lettuce, sliced onions, tomatoes, and secret creamy tandoori dressing.',
    leftItem: {
      name: 'Veggie Crunch Burger',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
      price: '₹95',
      tag: 'Super Crispy',
    },
    rightItem: {
      name: 'Spicy Paneer Tikka Burger',
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=700&q=80',
      price: '₹135',
      tag: 'Tandoori Smoked',
    },
    ingredients: [
      { id: 'b1', type: 'fry', x: '18%', y: '22%', size: 36, delay: 0.1, className: 'animate-ingredient-2' },
      { id: 'b2', type: 'tomato', x: '82%', y: '16%', size: 36, delay: 0.4, className: 'animate-ingredient-1' },
      { id: 'b3', type: 'cheese', x: '50%', y: '82%', size: 32, delay: 0.2, className: 'animate-ingredient-3' },
      { id: 'b4', type: 'fry', x: '78%', y: '76%', size: 34, delay: 0.5, className: 'animate-ingredient-2' },
      { id: 'b5', type: 'tomato', x: '22%', y: '76%', size: 30, delay: 0.3, className: 'animate-ingredient-1' },
    ],
  },
  {
    id: 'cakes',
    categoryId: 'cakes',
    nameKey: 'CAKES',
    badge: '100% Pure Eggless Daily Bakes',
    title: 'Celebration Cakes & Pastries',
    description: 'Layered with velvety dairy whipped cream, rich cocoa glazes, and tropical fruit compotes. Custom message piping included.',
    leftItem: {
      name: 'Dutch Chocolate Truffle',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80',
      price: '₹450',
      tag: 'Bakery Favourite',
    },
    rightItem: {
      name: 'Fresh Pineapple Gateau',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=700&q=80',
      price: '₹320',
      tag: 'Light & Fresh',
    },
    ingredients: [
      { id: 'c1', type: 'cherry', x: '17%', y: '18%', size: 34, delay: 0, className: 'animate-ingredient-1' },
      { id: 'c2', type: 'cherry', x: '83%', y: '22%', size: 32, delay: 0.3, className: 'animate-ingredient-2' },
      { id: 'c3', type: 'cheese', x: '50%', y: '80%', size: 28, delay: 0.5, className: 'animate-ingredient-3' },
      { id: 'c4', type: 'cherry', x: '76%', y: '78%', size: 30, delay: 0.2, className: 'animate-ingredient-1' },
      { id: 'c5', type: 'basil', x: '21%', y: '78%', size: 26, delay: 0.4, className: 'animate-ingredient-2' },
    ],
  },
];

export const FoodAnimationHero: React.FC = () => {
  const { setSelectedCategory, setIsCakeStudioOpen, businessSettings } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = FOOD_SLIDES[currentIndex];

  // Auto-slide cycling every 4.8s unless hovered or tapped
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FOOD_SLIDES.length);
    }, 4800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const menuEl = document.getElementById('menu-section');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % FOOD_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + FOOD_SLIDES.length) % FOOD_SLIDES.length);
  };

  // Render SVG food and ingredient vector shapes
  const renderIngredient = (type: FoodSlide['ingredients'][0]['type'], size: number) => {
    switch (type) {
      case 'basil':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <path
              d="M12 2C6.5 2 2 7.5 2 13c0 5 4.5 9 10 9 6.5 0 10-5.5 10-11 0-5-4.5-9-10-9zm0 18c-4.4 0-8-3.6-8-8 0-4 3.5-7.5 8-8 4.4 0 8 3.6 8 8 0 4-3.5 8-8 8z"
              fill="#22C55E"
              opacity="0.85"
            />
            <path d="M12 4v16M4 12c4 2 8 2 16 0" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'pepper':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <circle cx="12" cy="12" r="9" stroke="#16A34A" strokeWidth="3.5" fill="#4ADE80" fillOpacity="0.4" />
            <circle cx="12" cy="12" r="4.5" fill="#0B2E15" fillOpacity="0.6" />
          </svg>
        );
      case 'cheese':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <path
              d="M3 18h18L12 4 3 18z"
              fill="#FBBF24"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="14" r="1.5" fill="#B45309" />
            <circle cx="14" cy="15" r="1" fill="#B45309" />
            <circle cx="12" cy="10" r="1.2" fill="#B45309" />
          </svg>
        );
      case 'fry':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <rect x="9" y="3" width="6" height="18" rx="2" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
            <line x1="12" y1="5" x2="12" y2="19" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'tomato':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <circle cx="12" cy="12" r="9" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="6" fill="#F87171" />
            <path d="M12 6v12M6 12h12" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="9" r="1" fill="#FEF2F2" />
            <circle cx="15" cy="9" r="1" fill="#FEF2F2" />
          </svg>
        );
      case 'cherry':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <circle cx="8" cy="15" r="6" fill="#991B1B" />
            <circle cx="16" cy="16" r="5" fill="#DC2626" />
            <path d="M8 10C8 5 15 3 17 2" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 11C16 7 15 4 17 2" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'garlic':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <path
              d="M12 3c-2 4-7 8-7 12a7 7 0 0014 0c0-4-5-8-7-12z"
              fill="#FEF3C7"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            <path d="M12 3v18" stroke="#D97706" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </svg>
        );
    }
  };

  return (
    <section
      id="hero-section"
      aria-label="Animated Food Showcase"
      className="relative overflow-hidden bg-gradient-to-b from-[#071F0F] via-[#0B2E15] to-[#06180C] text-white py-8 sm:py-14 select-none border-b border-emerald-800/60"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Subtle Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#10B981 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Animated Food Ingredients in Stage Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {currentSlide.ingredients.map((ing) => (
          <div
            key={`${currentSlide.id}-${ing.id}`}
            className={`absolute ${ing.className} transition-all duration-700`}
            style={{
              left: ing.x,
              top: ing.y,
            }}
          >
            {renderIngredient(ing.type, ing.size)}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        
        {/* Category Filter Chips at Top of Stage */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5 overflow-x-auto pb-1 no-scrollbar">
          {FOOD_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/25 scale-105 ring-2 ring-emerald-300'
                    : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/50'
                }`}
              >
                {slide.id === 'bistro' && <span>⭐ All Favorites</span>}
                {slide.id === 'pizza' && <span>🍕 Pizza</span>}
                {slide.id === 'burgers' && <span>🍔 Burgers</span>}
                {slide.id === 'cakes' && <span>🎂 100% Eggless Cakes</span>}
              </button>
            );
          })}
        </div>

        {/* Dynamic Presentation Stage (Repeating Outlined/Solid Words + Bobbing Food) */}
        <div className="relative min-h-[350px] sm:min-h-[420px] lg:min-h-[450px] flex items-center justify-center">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-full relative flex flex-col items-center justify-center py-2"
            >
              
              {/* Background Repeating Decorative Outline Words (Subtle Ambient Texture, Never Collides with Text) */}
              <div className="absolute inset-0 flex flex-col items-center justify-start pt-2 pointer-events-none overflow-hidden z-0 select-none">
                <div className="text-stroke-banner font-serif font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-widest uppercase opacity-[0.035] leading-none">
                  {currentSlide.nameKey}
                </div>
                <div className="text-stroke-banner-emerald font-serif font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-widest uppercase opacity-[0.03] leading-none -mt-2 sm:-mt-4">
                  {currentSlide.nameKey}
                </div>
              </div>

              {/* Main Food Showcase Grid: Mobile, Tablet (md), Laptop/Desktop (lg/xl) */}
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center z-20">
                
                {/* Left Floating Food Item (Bobbing smoothly) */}
                <div className="hidden md:flex md:col-span-3 lg:col-span-4 flex-col items-center md:items-end justify-center">
                  <motion.div
                    initial={{ x: -40, opacity: 0, rotate: -8 }}
                    animate={{ x: 0, opacity: 1, rotate: -3 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 120 }}
                    onClick={() => handleSelectCategory(currentSlide.categoryId)}
                    className="animate-food-left cursor-pointer group relative"
                  >
                    <div className="relative w-40 h-40 md:w-44 md:h-44 lg:w-56 lg:h-56 xl:w-64 xl:h-64 rounded-full p-2 bg-gradient-to-tr from-amber-400/30 via-emerald-400/20 to-transparent shadow-2xl backdrop-blur-xs">
                      <img
                        src={currentSlide.leftItem.image}
                        alt={currentSlide.leftItem.name}
                        className="w-full h-full object-cover rounded-full border-3 lg:border-4 border-emerald-500/50 group-hover:scale-105 transition-transform duration-500 shadow-2xl"
                      />
                      
                      {/* Floating Food Badge */}
                      <div className="absolute -bottom-2 -left-2 bg-emerald-950/95 border border-emerald-600/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl shadow-xl backdrop-blur-md text-left">
                        <span className="text-[9px] sm:text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                          {currentSlide.leftItem.tag}
                        </span>
                        <span className="text-xs font-bold text-white block truncate max-w-[130px]">
                          {currentSlide.leftItem.name}
                        </span>
                        <span className="text-xs font-black text-emerald-400">
                          {currentSlide.leftItem.price}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Center Content Card (Crystal-Clear Contrast, Opaque Background, Zero Text Collision) */}
                <div className="col-span-1 md:col-span-6 lg:col-span-4 px-2 sm:px-4 z-20">
                  <div className="bg-[#072413] border border-emerald-500/40 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-2xl text-center space-y-3.5 relative overflow-hidden">
                    {/* Subtle inner top glow */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-300 to-emerald-500 opacity-70" />

                    {/* Quality Pill */}
                    <div className="inline-flex items-center gap-1.5 bg-emerald-900/90 border border-emerald-600/60 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-emerald-200 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{currentSlide.badge}</span>
                    </div>

                    {/* Mobile Single Dish Preview */}
                    <div className="md:hidden relative w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400/40 via-emerald-400/30 to-transparent shadow-xl my-1">
                      <img
                        src={currentSlide.leftItem.image}
                        alt={currentSlide.leftItem.name}
                        className="w-full h-full object-cover rounded-full border-2 border-emerald-400/60 shadow-lg animate-food-left"
                      />
                      <div className="absolute -bottom-2 inset-x-1 bg-emerald-950/95 border border-emerald-600 px-2 py-0.5 rounded-xl text-center shadow-lg">
                        <span className="text-[11px] font-bold text-white block truncate">
                          {currentSlide.leftItem.name}
                        </span>
                        <span className="text-xs font-black text-emerald-400">
                          {currentSlide.leftItem.price}
                        </span>
                      </div>
                    </div>

                    {/* Title & Copy (High Contrast, Distinct Typographic Separation) */}
                    <div>
                      <h2
                        id="hero-feature-title"
                        className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight drop-shadow-md"
                      >
                        {currentSlide.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 max-w-sm mx-auto mt-2 leading-relaxed font-normal">
                        {currentSlide.description}
                      </p>
                    </div>

                    {/* Action CTA */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                      <button
                        onClick={() => handleSelectCategory(currentSlide.categoryId)}
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-emerald-950 font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl shadow-lg hover:shadow-emerald-400/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer group"
                      >
                        <Utensils className="w-4 h-4" />
                        <span>Order Now</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button
                        onClick={() => setIsCakeStudioOpen(true)}
                        className="w-full sm:w-auto bg-emerald-900/80 hover:bg-emerald-850 text-emerald-200 hover:text-white border border-emerald-700/60 font-bold px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                      >
                        <Cake className="w-4 h-4 text-pink-400" />
                        <span>Custom Cake Studio</span>
                      </button>
                    </div>

                    {/* Location & Quick Info */}
                    <div className="pt-1 flex items-center justify-center gap-2.5 text-[11px] text-emerald-300/80 font-medium">
                      <span>📍 Dharamkot, Punjab</span>
                      <span>•</span>
                      <span>🕒 10 AM – 10 PM</span>
                    </div>
                  </div>
                </div>

                {/* Right Floating Food Item (Bobbing smoothly) */}
                <div className="hidden md:flex md:col-span-3 lg:col-span-4 flex-col items-center md:items-start justify-center">
                  <motion.div
                    initial={{ x: 40, opacity: 0, rotate: 8 }}
                    animate={{ x: 0, opacity: 1, rotate: 3 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 120 }}
                    onClick={() => handleSelectCategory(currentSlide.categoryId)}
                    className="animate-food-right cursor-pointer group relative"
                  >
                    <div className="relative w-40 h-40 md:w-44 md:h-44 lg:w-56 lg:h-56 xl:w-64 xl:h-64 rounded-full p-2 bg-gradient-to-tl from-emerald-400/30 via-amber-400/20 to-transparent shadow-2xl backdrop-blur-xs">
                      <img
                        src={currentSlide.rightItem.image}
                        alt={currentSlide.rightItem.name}
                        className="w-full h-full object-cover rounded-full border-3 lg:border-4 border-emerald-500/50 group-hover:scale-105 transition-transform duration-500 shadow-2xl"
                      />

                      {/* Floating Food Badge */}
                      <div className="absolute -bottom-2 -right-2 bg-emerald-950/95 border border-emerald-600/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl shadow-xl backdrop-blur-md text-right">
                        <span className="text-[9px] sm:text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                          {currentSlide.rightItem.tag}
                        </span>
                        <span className="text-xs font-bold text-white block truncate max-w-[130px]">
                          {currentSlide.rightItem.name}
                        </span>
                        <span className="text-xs font-black text-emerald-400">
                          {currentSlide.rightItem.price}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

              </div>

            </motion.div>
          </AnimatePresence>

          {/* Previous / Next Controls */}
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-emerald-950/70 hover:bg-emerald-850 text-emerald-200 border border-emerald-700/60 transition-colors z-30 cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-emerald-950/70 hover:bg-emerald-850 text-emerald-200 border border-emerald-700/60 transition-colors z-30 cursor-pointer shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {FOOD_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'w-7 bg-emerald-400 shadow-sm'
                  : 'w-2 bg-emerald-800/80 hover:bg-emerald-700'
              }`}
            />
          ))}
        </div>

        {/* 3 Featured Trio Category Cards (Directly matching the video's BURGER / PIZZA / SNACKS trio) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 pt-6 border-t border-emerald-800/50">
          
          {/* Card 1: Burgers & Fast Food */}
          <div
            onClick={() => handleSelectCategory('burgers')}
            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-emerald-900/70 to-emerald-950/90 border border-emerald-700/50 hover:border-emerald-400 p-2.5 sm:p-4 text-center transition-all duration-300 hover:scale-103 hover:shadow-xl relative overflow-hidden"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden p-1 bg-gradient-to-tr from-amber-400 to-emerald-500 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
                alt="Burgers"
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="font-serif font-black text-xs sm:text-base text-white tracking-wide uppercase block">
                BURGERS
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-300 font-medium hidden sm:inline">
                Crispy Veg & Tikka
              </span>
            </div>
          </div>

          {/* Card 2: Hand-Tossed Pizzas */}
          <div
            onClick={() => handleSelectCategory('pizza')}
            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-emerald-900/70 to-emerald-950/90 border border-emerald-700/50 hover:border-emerald-400 p-2.5 sm:p-4 text-center transition-all duration-300 hover:scale-103 hover:shadow-xl relative overflow-hidden"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden p-1 bg-gradient-to-tr from-emerald-400 to-amber-500 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"
                alt="Pizzas"
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="font-serif font-black text-xs sm:text-base text-white tracking-wide uppercase block">
                PIZZA
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-300 font-medium hidden sm:inline">
                Stone-Fired Crusts
              </span>
            </div>
          </div>

          {/* Card 3: 100% Eggless Cakes & Snacks */}
          <div
            onClick={() => handleSelectCategory('cakes')}
            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-emerald-900/70 to-emerald-950/90 border border-emerald-700/50 hover:border-emerald-400 p-2.5 sm:p-4 text-center transition-all duration-300 hover:scale-103 hover:shadow-xl relative overflow-hidden"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden p-1 bg-gradient-to-tr from-pink-400 to-amber-400 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80"
                alt="Eggless Bakery Cakes"
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="font-serif font-black text-xs sm:text-base text-white tracking-wide uppercase block">
                CAKES & SNACKS
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-300 font-medium hidden sm:inline">
                100% Eggless Bakery
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

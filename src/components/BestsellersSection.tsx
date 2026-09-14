import React, { useState } from 'react';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { Product } from '../types';

export const BestsellersSection: React.FC = () => {
  const { products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4);

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="bestsellers-section" className="py-14 bg-emerald-50/30 border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Dharamkot Town Favourites</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0F2916] tracking-tight mt-1">
              Most Loved Dishes & Bakery Treats
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800/80 mt-1 max-w-xl">
              Handcrafted with authentic flavours and consistent quality. Ranked #1 by regular Dharamkot diners.
            </p>
          </div>

          <button
            onClick={scrollToMenu}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 self-start sm:self-auto group cursor-pointer"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4 Bestseller Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>

      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Heart, Sparkles, Check } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { cart, addToCart, updateCartQuantity, favorites, toggleFavorite, isStoreOpen, businessSettings } = useStore();
  const { user, openLoginModal } = useCustomerAuth();
  const [justAdded, setJustAdded] = useState(false);

  // Find if this product is in cart (any option)
  const cartItemsForProduct = cart.filter((i) => i.productId === product.id);
  const totalQtyInCart = cartItemsForProduct.reduce((sum, i) => sum + i.quantity, 0);

  const isFav = favorites.includes(product.id);
  const isCustomizable = Boolean(product.customizationGroups && product.customizationGroups.length > 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isStoreOpen) return;
    if (!product.isAvailable) return;

    if (!user) {
      openLoginModal();
      return;
    }

    // If product has required customization options (like cake weight or pizza size), open details modal
    if (isCustomizable) {
      onOpenDetails(product);
    } else {
      addToCart(product, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 800);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItemsForProduct.length === 1) {
      updateCartQuantity(cartItemsForProduct[0].cartItemId, cartItemsForProduct[0].quantity - 1);
    } else if (cartItemsForProduct.length > 1) {
      onOpenDetails(product);
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItemsForProduct.length === 1) {
      updateCartQuantity(cartItemsForProduct[0].cartItemId, cartItemsForProduct[0].quantity + 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 800);
    } else {
      onOpenDetails(product);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onOpenDetails(product)}
      className={`group bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-lg ${
        product.isAvailable
          ? 'border-stone-200/80 hover:border-emerald-600/40 hover:-translate-y-0.5'
          : 'border-stone-200 opacity-60 bg-stone-50'
      }`}
    >
      {/* Product Image & Overlays */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={product?.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
          alt={product?.name || 'Product'}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !product?.isAvailable ? 'grayscale' : ''
          }`}
          loading="lazy"
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/95 hover:bg-white text-stone-700 shadow-sm transition-transform active:scale-90"
          title={isFav ? 'Remove from favourites' : 'Save to favourites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`}
          />
        </button>

        {/* Badges container */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 items-start">
          {product.isBestseller && (
            <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              <span>Bestseller</span>
            </span>
          )}
          {product.isEggless && (
            <span className="bg-emerald-900 text-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
              100% Eggless
            </span>
          )}
        </div>

        {/* Sold out overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
            <span className="bg-stone-900 text-stone-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-700 uppercase tracking-wider">
              Sold Out For Today
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Veg indicator & title */}
          <div className="flex items-start gap-2 justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                {/* Veg / Eggless green square dot */}
                {product.isVegetarian && (
                  <div
                    className="w-3.5 h-3.5 border-1.5 border-emerald-600 rounded-xs flex items-center justify-center shrink-0 bg-white"
                    title="100% Pure Vegetarian / Eggless"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  </div>
                )}
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide truncate max-w-[150px]">
                  {product.categoryName}
                </span>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1 leading-snug">
                {product?.name || 'Item'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer: Price and Add / Quantity Button */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-stone-900 tabular-nums">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-stone-400 line-through tabular-nums">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {isCustomizable && (
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                Customisable
              </span>
            )}
          </div>

          {/* Add / Quantity Control */}
          <div className="relative shrink-0">
            {/* Temporary Floating "+1 Added" badge */}
            <AnimatePresence>
              {justAdded && (
                <motion.span
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -20, scale: 1 }}
                  exit={{ opacity: 0, y: -28, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute -top-1 right-3 bg-emerald-700 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md pointer-events-none z-20"
                >
                  +1
                </motion.span>
              )}
            </AnimatePresence>

            {!isStoreOpen ? (
              <span
                className="bg-stone-100 text-stone-500 border border-stone-200 font-bold text-[11px] px-3 py-1.5 rounded-xl select-none"
                title={`Store is closed. Ordering resumes at ${businessSettings.openingTime}`}
              >
                Closed
              </span>
            ) : product.isAvailable ? (
              <AnimatePresence mode="wait">
                {totalQtyInCart > 0 ? (
                  <motion.div
                    key="qty-controls"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex items-center gap-1.5 bg-emerald-700 text-white rounded-xl px-2 py-1 shadow-xs border border-emerald-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleDecrease}
                      className="p-1 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer active:scale-90"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black px-1 min-w-[16px] text-center tabular-nums">
                      {totalQtyInCart}
                    </span>
                    <button
                      onClick={handleIncrease}
                      className="p-1 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer active:scale-90"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="add-btn"
                    whileTap={{ scale: 0.95 }}
                    onClick={handleQuickAdd}
                    className="bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border-1.5 border-emerald-600 hover:border-emerald-700 font-extrabold text-xs px-4 py-1.5 rounded-xl transition-all duration-150 flex items-center justify-center min-w-[76px] shadow-xs cursor-pointer group-hover:bg-emerald-700 group-hover:text-white"
                  >
                    <span>{isCustomizable ? 'ADD +' : 'ADD'}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            ) : (
              <span className="text-[11px] text-stone-400 italic">Unavailable</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

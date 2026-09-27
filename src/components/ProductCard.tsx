import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Check, Sparkles, Heart, Flame, ShieldCheck, Clock, Lock } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { cart, addToCart, updateCartQuantity, favorites, toggleFavorite } = useStore();
  const { user, openLoginModal } = useCustomerAuth();
  const [justAdded, setJustAdded] = useState(false);

  // Find if this product is in cart (any option)
  const cartItemsForProduct = cart.filter((i) => i.productId === product.id);
  const totalQtyInCart = cartItemsForProduct.reduce((sum, i) => sum + i.quantity, 0);

  const isFav = favorites.includes(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;

    if (!user) {
      openLoginModal();
      return;
    }

    // If product has required customization options (like cake weight or pizza size), open details modal
    if (product.customizationGroups && product.customizationGroups.length > 0) {
      onOpenDetails(product);
    } else {
      addToCart(product, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 900);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    if (cartItemsForProduct.length === 1) {
      updateCartQuantity(cartItemsForProduct[0].cartItemId, cartItemsForProduct[0].quantity - 1);
    } else if (cartItemsForProduct.length > 1) {
      // If multiple customized variants, open details
      onOpenDetails(product);
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    if (cartItemsForProduct.length === 1) {
      updateCartQuantity(cartItemsForProduct[0].cartItemId, cartItemsForProduct[0].quantity + 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 900);
    } else {
      onOpenDetails(product);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onOpenDetails(product)}
      className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md ${
        product.isAvailable
          ? 'border-emerald-100 hover:border-emerald-500/60 hover:-translate-y-1'
          : 'border-stone-300 opacity-70 bg-stone-50'
      }`}
    >
      {/* Product Image and Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-emerald-50/50">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !product.isAvailable ? 'grayscale' : ''
          }`}
          loading="lazy"
        />

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-xs transition-colors"
          title={isFav ? 'Remove from favourites' : 'Save to favourites'}
        >
          <Heart
            className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`}
          />
        </button>

        {/* Badges container */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.isBestseller && (
            <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              Bestseller
            </span>
          )}
          {product.isEggless && (
            <span className="bg-emerald-850 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
              Eggless
            </span>
          )}
        </div>

        {/* Sold out overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-stone-900 text-stone-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-600 uppercase tracking-wider">
              Currently Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base text-[#0F2916] group-hover:text-emerald-700 transition-colors line-clamp-1">
              {product.name}
            </h3>

            {/* Veg / Eggless green dot indicator */}
            {product.isVegetarian && (
              <div
                className="w-4 h-4 border-2 border-emerald-600 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 bg-white shadow-2xs"
                title="100% Pure Vegetarian / Eggless"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
            )}
          </div>

          <p className="text-xs text-emerald-950/70 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer: Price and Add Button */}
        <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base sm:text-lg text-[#0F2916]">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {product.customizationGroups && product.customizationGroups.length > 0 && (
              <span className="text-[10px] text-emerald-700 font-medium block">
                Customizable options
              </span>
            )}
          </div>

          {/* Add / Quantity Control */}
          <div className="relative">
            {/* Temporary Floating "+1 Added" badge */}
            <AnimatePresence>
              {justAdded && (
                <motion.span
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -22, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="absolute -top-1 right-2 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-md pointer-events-none z-20"
                >
                  +1
                </motion.span>
              )}
            </AnimatePresence>

            {product.isAvailable ? (
              <AnimatePresence mode="wait">
                {totalQtyInCart > 0 ? (
                  <motion.div
                    key="qty-controls"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex items-center gap-2 bg-emerald-700 text-white rounded-xl px-2 py-1 shadow-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleDecrease}
                      className="p-1 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer active:scale-90"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-1 min-w-[14px] text-center">
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
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleQuickAdd}
                    title={user ? 'Add to cart' : 'Sign in with Google to add to cart'}
                    className="bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-200 hover:border-emerald-700 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1 shadow-xs cursor-pointer group-hover:bg-emerald-700 group-hover:text-white"
                  >
                    {user ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-emerald-600 group-hover:text-white" />}
                    <span>{user ? 'Add' : 'Sign in'}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            ) : (
              <span className="text-[11px] text-stone-500 italic">Unavailable</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

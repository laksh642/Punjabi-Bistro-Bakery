import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Clock, ShieldCheck, Flame, ShoppingBag, Lock } from 'lucide-react';
import { Product, CartItemOption } from '../types';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart, setIsCartOpen } = useStore();
  const { user, openLoginModal } = useCustomerAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<CartItemOption[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSpecialInstructions('');

      // Auto-select the first option for any 'single' choice group (like 0.5kg cake)
      const defaults: CartItemOption[] = [];
      product.customizationGroups?.forEach((grp) => {
        if (grp.type === 'single' && grp.options.length > 0) {
          defaults.push({
            groupName: grp.name,
            optionName: grp.options[0].name,
            price: grp.options[0].price,
          });
        }
      });
      setSelectedOptions(defaults);
    }
  }, [product]);

  if (!product) return null;

  // Toggle or select option
  const handleOptionChange = (
    groupName: string,
    optionName: string,
    price: number,
    isSingle: boolean
  ) => {
    if (isSingle) {
      setSelectedOptions((prev) => [
        ...prev.filter((o) => o.groupName !== groupName),
        { groupName, optionName, price },
      ]);
    } else {
      setSelectedOptions((prev) => {
        const exists = prev.some(
          (o) => o.groupName === groupName && o.optionName === optionName
        );
        if (exists) {
          return prev.filter(
            (o) => !(o.groupName === groupName && o.optionName === optionName)
          );
        } else {
          return [...prev, { groupName, optionName, price }];
        }
      });
    }
  };

  const optionsTotal = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
  const unitPrice = product.price + optionsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    addToCart(product, quantity, selectedOptions, specialInstructions.trim() || undefined);
    onClose();
  };

  const handleAddAndCheckout = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    addToCart(product, quantity, selectedOptions, specialInstructions.trim() || undefined);
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-emerald-200 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image with close button */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-200">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
            {product.isEggless && (
              <span className="bg-emerald-900/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs border border-emerald-600/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                100% Eggless
              </span>
            )}
            {product.isBestseller && (
              <span className="bg-amber-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
                Bestseller
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1 bg-white">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
                {product.name}
              </h2>
              <span className="font-bold text-xl text-emerald-800 whitespace-nowrap">
                ₹{unitPrice}
              </span>
            </div>

            <p className="text-sm text-emerald-800/80 mt-2 leading-relaxed">
              {product.description}
            </p>

            <div className="flex items-center gap-4 mt-3 text-xs text-emerald-700">
              {product.prepTimeMinutes && (
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Takes ~{product.prepTimeMinutes} mins to prepare
                </span>
              )}
              {product.isSpicy && (
                <span className="flex items-center gap-1 text-amber-700 font-medium">
                  <Flame className="w-3.5 h-3.5" />
                  Spicy
                </span>
              )}
            </div>
          </div>

          {/* Customization Groups */}
          {product.customizationGroups && product.customizationGroups.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-emerald-100">
              {product.customizationGroups.map((group) => (
                <div key={group.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                      {group.name}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      {group.type === 'single' ? 'Choose 1' : 'Optional add-ons'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions.some(
                        (o) => o.groupName === group.name && o.optionName === opt.name
                      );

                      return (
                        <label
                          key={opt.name}
                          onClick={() =>
                            handleOptionChange(
                              group.name,
                              opt.name,
                              opt.price,
                              group.type === 'single'
                            )
                          }
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                              : 'border-emerald-200 hover:bg-emerald-50/50 text-emerald-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-${
                                group.type === 'single' ? 'full' : 'md'
                              } border flex items-center justify-center ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-stone-400 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>

                          <span className="font-semibold text-emerald-800">
                            {opt.price === 0 ? 'Included' : `+₹${opt.price}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Requests / Notes */}
          <div className="pt-2 border-t border-emerald-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
              Special kitchen requests (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, write Happy Birthday on box, extra napkins"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
              maxLength={150}
            />
            <p className="text-[10px] text-emerald-700/80 mt-1">
              Special requests are subject to kitchen availability.
            </p>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 bg-emerald-50/80 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 bg-white border border-emerald-200 rounded-xl px-2 py-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-1 text-emerald-900 hover:text-emerald-950 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm min-w-[20px] text-center text-emerald-950">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 text-emerald-900 hover:text-emerald-950 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              id="modal-add-to-cart-btn"
              onClick={handleAddToCart}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {user ? <ShoppingBag className="w-4 h-4" /> : <Lock className="w-4 h-4 text-emerald-200" />}
              <span>{user ? `Add to Cart • ₹${totalPrice}` : `Sign In with Google to Add • ₹${totalPrice}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

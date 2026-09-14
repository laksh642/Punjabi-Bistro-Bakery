import React from 'react';
import { Sparkles, Heart, Clock, Award, Star, Truck } from 'lucide-react';

export const EgglessMovingBar: React.FC = () => {
  const marqueeItems = [
    {
      type: 'badge',
      text: '100% PURE EGGLESS',
      sub: 'Bakery & Kitchen',
      icon: 'veg',
      highlight: true,
    },
    {
      type: 'feature',
      text: 'FRESH CELEBRATION CAKES',
      sub: 'Custom Designs in 2 Hours',
      icon: 'sparkle',
    },
    {
      type: 'feature',
      text: 'STONE-FIRED CRISPY PIZZAS',
      sub: 'Gooey Mozzarella & Fresh Herbs',
      icon: 'star',
    },
    {
      type: 'badge',
      text: 'ONLY FOR FOODIES',
      sub: 'Original Punjabi Bistro Taste',
      icon: 'heart',
      highlight: true,
    },
    {
      type: 'feature',
      text: 'SAME-DAY DHARAMKOT DELIVERY',
      sub: 'Safe & Fresh At Your Doorstep',
      icon: 'truck',
    },
    {
      type: 'feature',
      text: 'ZERO PRESERVATIVES',
      sub: 'Pure Dairy & Premium Cocoa',
      icon: 'award',
    },
    {
      type: 'badge',
      text: '4.4★ ON GOOGLE',
      sub: 'Loved by 5000+ Foodies',
      icon: 'star',
      highlight: false,
    },
  ];

  // Repeat items to ensure seamless infinite loop
  const duplicatedItems = [...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <aside
      aria-label="100% Pure Eggless Highlights"
      className="relative z-20 bg-emerald-800 text-white overflow-hidden border-y border-emerald-900/40 shadow-sm select-none"
    >
      {/* Top accent glow line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-amber-300 to-emerald-500 opacity-80" />

      <div className="py-2.5 sm:py-3 relative flex items-center group">
        {/* Left and Right edge fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-emerald-800 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-emerald-800 to-transparent z-10 pointer-events-none" />

        {/* Animated Marquee Strip */}
        <div className="flex shrink-0 animate-marquee items-center gap-6 sm:gap-8 group-hover:[animation-play-state:paused] will-change-transform">
          {duplicatedItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 whitespace-nowrap"
            >
              {/* Green Veg Indicator Symbol */}
              {item.icon === 'veg' && (
                <div className="w-5 h-5 rounded-sm border-2 border-white bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                </div>
              )}

              {item.icon === 'sparkle' && (
                <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 animate-pulse" />
              )}

              {item.icon === 'heart' && (
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300 flex-shrink-0" />
              )}

              {item.icon === 'truck' && (
                <Truck className="w-4 h-4 text-emerald-200 flex-shrink-0" />
              )}

              {item.icon === 'award' && (
                <Award className="w-4 h-4 text-amber-300 flex-shrink-0" />
              )}

              {item.icon === 'star' && (
                <Star className="w-4 h-4 text-amber-300 fill-amber-300 flex-shrink-0" />
              )}

              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xs sm:text-sm font-extrabold tracking-wider ${
                    item.highlight
                      ? 'text-amber-300 underline decoration-amber-300/60 decoration-2 underline-offset-4'
                      : 'text-white'
                  }`}
                >
                  {item.text}
                </span>
                <span className="text-[11px] sm:text-xs text-emerald-100/80 font-medium hidden xs:inline">
                  • {item.sub}
                </span>
              </div>

              {/* Separator diamond dot */}
              <span className="text-emerald-400/50 text-xs pl-3">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom subtle edge */}
      <div className="h-[1px] w-full bg-emerald-700/60" />
    </aside>
  );
};

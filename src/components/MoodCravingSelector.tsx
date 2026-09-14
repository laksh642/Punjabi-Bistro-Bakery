import React from 'react';
import { Sparkles } from 'lucide-react';

interface MoodCravingSelectorProps {
  selectedMood: string | null;
  onSelectMood: (mood: string | null) => void;
}

export const MOODS = [
  {
    id: 'cheesy',
    label: 'Cheesy Delight',
    emoji: '🍕',
    subtitle: 'Pizzas, Garlic Bread & Cheese Burst',
    filterKeywords: ['pizza', 'cheese', 'mozzarella'],
  },
  {
    id: 'comfort',
    label: 'Comfort Food',
    emoji: '🍝',
    subtitle: 'Creamy White Sauce & Pink Pastas',
    filterKeywords: ['pasta', 'penne', 'sauce'],
  },
  {
    id: 'quick',
    label: 'Quick Bite',
    emoji: '🥪',
    subtitle: 'Crispy Burgers & Jumbo Sandwiches',
    filterKeywords: ['burger', 'sandwich', 'club'],
  },
  {
    id: 'sweet',
    label: 'Something Sweet',
    emoji: '🍰',
    subtitle: 'Eggless Truffle, Pastries & Cupcakes',
    filterKeywords: ['cake', 'pastry', 'cupcake', 'cookies'],
  },
  {
    id: 'spicy',
    label: 'Spicy Craving',
    emoji: '🌯',
    subtitle: 'Peri Peri Fries & Mexican Wraps',
    filterKeywords: ['spicy', 'peri', 'wrap', 'mexican', 'tikka'],
  },
  {
    id: 'sip',
    label: 'Chill & Sip',
    emoji: '☕',
    subtitle: 'Chilled Fruit Beer & Thick Cold Coffee',
    filterKeywords: ['beer', 'coffee', 'soda', 'cappuccino'],
  },
];

export const MoodCravingSelector: React.FC<MoodCravingSelectorProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Interactive Discovery</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F2916]">
              What are you craving today?
            </h2>
          </div>

          {selectedMood && (
            <button
              onClick={() => onSelectMood(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline self-start sm:self-auto cursor-pointer"
            >
              Reset Craving Filter ✕
            </button>
          )}
        </div>

        {/* Mood Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                id={`mood-btn-${m.id}`}
                onClick={() => {
                  onSelectMood(isSelected ? null : m.id);
                  const el = document.getElementById('menu-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md scale-[1.02]'
                    : 'bg-emerald-50/40 hover:bg-emerald-100/50 border-emerald-100 text-[#0F2916]'
                }`}
              >
                <div>
                  <span className="text-2xl block mb-1.5">{m.emoji}</span>
                  <div className="font-bold text-sm tracking-tight">{m.label}</div>
                </div>
                <div
                  className={`text-[11px] mt-1 leading-tight line-clamp-2 ${
                    isSelected ? 'text-emerald-100' : 'text-emerald-850'
                  }`}
                >
                  {m.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

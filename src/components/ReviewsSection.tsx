import React, { useState } from 'react';
import { Star, MessageCircle, ShieldCheck, CheckCircle2, Award, Heart, MessageSquarePlus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ReviewItem } from '../types';

export const ReviewsSection: React.FC = () => {
  const { reviews, addReview, businessSettings } = useStore();

  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // New review form
  const [authorName, setAuthorName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tag, setTag] = useState('Food');

  const tags = ['All', 'Cakes', 'Food', 'Pizza', 'Service', 'Atmosphere', 'Delivery'];

  const filteredReviews = reviews.filter((r) => {
    if (selectedTag !== 'All' && r.category !== selectedTag) return false;
    if (selectedRating !== null && r.rating !== selectedRating) return false;
    return true;
  });

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;

    addReview({
      author: authorName.trim(),
      rating: newRating,
      comment: comment.trim(),
      category: tag,
      source: 'Direct Website Review',
    });

    setShowReviewForm(false);
    setAuthorName('');
    setComment('');
  };

  return (
    <section id="reviews-section" className="py-16 bg-white border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Google Rating Summary */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Authentic Community Feedback</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0F2916] tracking-tight">
              Customer Experiences & Reviews
            </h2>
            <p className="text-sm text-emerald-800/80 mt-2 max-w-xl">
              Real opinions from diners across Dharamkot, Moga district, and visiting travellers.
            </p>
          </div>

          {/* Rating Badge */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4 self-start lg:self-auto">
            <div className="text-3xl font-serif font-black text-emerald-850">
              4.4
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <div className="text-xs font-medium text-emerald-950 mt-0.5">
                Based on 170+ Google Reviews
              </div>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer ml-2"
            >
              Write Review
            </button>
          </div>
        </div>

        {/* Commitment Banner: Addressing past friction honestly */}
        <div className="mb-10 bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-200/60 text-emerald-800 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              ★
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#0F2916]">
                Our Quality & Delivery Commitment in Dharamkot
              </h3>
              <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed">
                We read every single review. While guests love our 100% eggless cakes, cheesy pizzas, and creamy pasta, earlier feedback noted occasional delivery delays and delivery charge questions.
              </p>
              <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed">
                To fix this, we've implemented: <strong>(1) Fixed delivery zones</strong> with upfront transparent rates, <strong>(2) Scheduled 30-minute arrival slots</strong>, and <strong>(3) Live kitchen status updates</strong> with proactive delay alerts. Thank you for helping us grow better every day.
              </p>
            </div>
          </div>
        </div>

        {/* Review Form (Collapsible) */}
        {showReviewForm && (
          <div className="mb-10 p-6 bg-white rounded-3xl border border-emerald-200 shadow-sm animate-in fade-in duration-200">
            <h3 className="font-serif text-lg font-bold text-emerald-950 mb-4">
              Share Your Feedback
            </h3>
            <form onSubmit={handleCreateReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Gurpreet Singh"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setNewRating(s)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            newRating >= s
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Category
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                  >
                    <option value="Food">Food & Taste</option>
                    <option value="Cakes">Custom Cakes</option>
                    <option value="Pizza">Pizza & Pasta</option>
                    <option value="Service">Service & Staff</option>
                    <option value="Delivery">Delivery Experience</option>
                    <option value="Atmosphere">Café Atmosphere</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Your Review Comments *
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {tags.map((t) => {
            const isSelected = selectedTag === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50/60 text-emerald-950 hover:bg-emerald-100/70 border border-emerald-100'
                }`}
              >
                {t}
              </button>
            );
          })}

          <div className="h-4 w-px bg-emerald-200 mx-1 flex-shrink-0" />

          {[5, 4, 3].map((starCount) => (
            <button
              key={starCount}
              onClick={() => setSelectedRating(selectedRating === starCount ? null : starCount)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                selectedRating === starCount
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <span>{starCount}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < rev.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-[11px] text-stone-500 font-medium">
                    {rev.date}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-emerald-950">
                    {rev.author}
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                    {rev.category}
                  </span>
                </div>

                {/* Owner Response if present */}
                {rev.ownerResponse && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 border border-emerald-200">
                    <div className="font-bold text-emerald-800 mb-0.5">
                      Response from Bistro:
                    </div>
                    <p className="leading-snug">{rev.ownerResponse}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

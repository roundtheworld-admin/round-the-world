'use client';

import { useState } from 'react';
import { X, MapPin, Send } from 'lucide-react';
import StarRating from './StarRating';

interface CheckinSheetProps {
  onClose: () => void;
  onSubmit: (data: {
    drink_name: string;
    drink_emoji: string;
    bar_name?: string;
    city?: string;
    rating?: number;
    review?: string;
  }) => void;
}

const EMOJI_OPTIONS = ['🍺', '🍻', '🍷', '🍸', '🥃', '🍹', '🥂', '🍶', '🎲'];

export default function CheckinSheet({ onClose, onSubmit }: CheckinSheetProps) {
  const [drinkName, setDrinkName] = useState('');
  const [drinkEmoji, setDrinkEmoji] = useState('🍺');
  const [barName, setBarName] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const canSubmit = drinkName.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      drink_name: drinkName.trim(),
      drink_emoji: drinkEmoji,
      bar_name: barName.trim() || undefined,
      city: city.trim() || undefined,
      rating: rating > 0 ? rating : undefined,
      review: review.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-brand-card rounded-t-3xl p-5 pb-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg font-bold text-white">What are you drinking?</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Emoji picker */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => setDrinkEmoji(e)}
              className={`text-2xl w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                drinkEmoji === e ? 'bg-brand-purple/20 border-2 border-brand-purple' : 'bg-brand-dark border border-brand-border'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Drink name */}
        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
          Drink name *
        </label>
        <input
          value={drinkName}
          onChange={(e) => setDrinkName(e.target.value)}
          placeholder="Guinness, Old Fashioned, Aperol Spritz..."
          className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-brand-purple/50 mb-4"
        />

        {/* Bar & City */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
              Bar / Pub
            </label>
            <input
              value={barName}
              onChange={(e) => setBarName(e.target.value)}
              placeholder="Murphy's Pub"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-brand-purple/50"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
              City
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Dublin"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-brand-purple/50"
            />
          </div>
        </div>

        {/* Rating */}
        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
          Rating
        </label>
        <div className="mb-4">
          <StarRating rating={rating} size={28} interactive onChange={setRating} />
        </div>

        {/* Review */}
        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
          Quick review (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="How is it? Would you recommend it?"
          rows={3}
          className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-brand-purple/50 resize-none mb-5"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
            canSubmit
              ? 'bg-gradient-to-br from-brand-purple to-brand-purple-light text-white active:scale-[0.98]'
              : 'bg-brand-dark text-gray-600 cursor-not-allowed'
          }`}
        >
          <Send size={18} /> Post to the feed
        </button>
      </div>
    </div>
  );
}

'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, size = 14, interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(s)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            fill={s <= rating ? '#FDCB6E' : 'none'}
            color={s <= rating ? '#FDCB6E' : '#555'}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating > 0 ? rating : ''}</span>
    </div>
  );
}

'use client';

import { MapPin, Beer, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import StarRating from './StarRating';
import { timeAgo } from '@/lib/time';
import { shareCheckin } from '@/lib/whatsapp';
import type { FeedItem } from '@/lib/types';

interface FeedCardProps {
  item: FeedItem;
  onBuyRound: (userId: string) => void;
}

export default function FeedCard({ item, onBuyRound }: FeedCardProps) {
  const handleShare = () => {
    shareCheckin({
      checkinId: item.id,
      userName: item.user_name,
      drinkName: item.drink_name,
      drinkEmoji: item.drink_emoji,
      barName: item.bar_name,
      city: item.city,
      rating: item.rating,
    });
  };

  return (
    <div className="bg-brand-card rounded-2xl p-4 mb-3 border border-brand-border">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar name={item.user_name} color={item.avatar_color} size={40} />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-white text-sm">{item.user_name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {item.bar_name && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <MapPin size={10} /> {item.bar_name}{item.city ? `, ${item.city}` : ''}
              </span>
            )}
            <span className="text-[11px] text-gray-700">{timeAgo(item.created_at)}</span>
          </div>
        </div>
        <span className="text-3xl">{item.drink_emoji}</span>
      </div>

      {/* Drink & Rating */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-white font-semibold text-[15px]">{item.drink_name}</span>
        {item.rating && <StarRating rating={item.rating} />}
      </div>

      {/* Review */}
      {item.review && (
        <p className="text-gray-400 text-[13px] leading-relaxed mb-3">{item.review}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-brand-border">
        <button
          onClick={() => onBuyRound(item.user_id)}
          className="flex items-center gap-1.5 text-brand-purple border border-brand-purple rounded-full px-3.5 py-1.5 text-xs font-semibold hover:bg-brand-purple/10 transition-colors"
        >
          <Beer size={14} /> Buy a round
        </button>

        <button
          onClick={handleShare}
          className="ml-auto flex items-center gap-1.5 text-[#25D366] border border-[#25D366]/30 rounded-full px-3.5 py-1.5 text-xs font-semibold hover:bg-[#25D366]/10 transition-colors"
        >
          <MessageCircle size={14} /> WhatsApp
        </button>
      </div>
    </div>
  );
}

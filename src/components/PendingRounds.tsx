'use client';

import { useState } from 'react';
import { Check, X, MessageCircle, Beer } from 'lucide-react';
import Avatar from './Avatar';
import { formatCents } from '@/lib/types';
import { timeAgo } from '@/lib/time';
import { shareRound } from '@/lib/whatsapp';

interface PendingRound {
  id: string;
  from_user_id: string;
  drink_name: string;
  drink_emoji: string;
  amount_cents: number;
  note: string | null;
  created_at: string;
  from_profile: {
    name: string;
    avatar_color: string;
    city: string | null;
  };
}

interface PendingRoundsProps {
  rounds: PendingRound[];
  myName: string;
  onAccept: (roundId: string) => Promise<void>;
  onDecline: (roundId: string) => Promise<void>;
}

export default function PendingRounds({
  rounds,
  myName,
  onAccept,
  onDecline,
}: PendingRoundsProps) {
  if (rounds.length === 0) return null;

  return (
    <div className="mx-4 mb-3 animate-fade-in-up">
      <div className="text-[10.5px] text-brand-gold font-semibold uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5">
        <Beer size={12} /> {rounds.length} round{rounds.length > 1 ? 's' : ''} waiting for you
      </div>

      {rounds.map((round) => (
        <PendingRoundCard
          key={round.id}
          round={round}
          myName={myName}
          onAccept={() => onAccept(round.id)}
          onDecline={() => onDecline(round.id)}
        />
      ))}
    </div>
  );
}

function PendingRoundCard({
  round,
  myName,
  onAccept,
  onDecline,
}: {
  round: PendingRound;
  myName: string;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null);

  const handleAccept = async () => {
    setResponding(true);
    await onAccept();
    setResponded('accepted');
    setResponding(false);
  };

  const handleDecline = async () => {
    setResponding(true);
    await onDecline();
    setResponded('declined');
    setResponding(false);
  };

  const handleShare = () => {
    shareRound({
      fromName: round.from_profile.name,
      toName: myName,
      drinkName: round.drink_name,
      drinkEmoji: round.drink_emoji,
      note: round.note,
    });
  };

  if (responded === 'accepted') {
    return (
      <div className="rounded-2xl p-4 mb-2 text-center border border-brand-green/30 bg-brand-green/10 animate-fade-in-up">
        <div className="text-2xl mb-1">🍻</div>
        <div className="text-brand-green-light text-sm font-semibold">
          Accepted · {formatCents(round.amount_cents)} on your tab with{' '}
          {round.from_profile.name}
        </div>
        <button
          onClick={handleShare}
          className="mt-2 text-[#25D366] text-xs font-semibold flex items-center gap-1 mx-auto press"
        >
          <MessageCircle size={12} /> Share to WhatsApp
        </button>
      </div>
    );
  }

  if (responded === 'declined') {
    return (
      <div className="rounded-2xl p-3 mb-2 text-center bg-white/[0.03] border border-white/[0.06]">
        <div className="text-ink-300 text-sm">Round declined</div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-4 mb-2 overflow-hidden"
      style={{
        background:
          'linear-gradient(155deg, rgba(245,184,46,0.14) 0%, rgba(249,112,102,0.06) 55%, rgba(20,20,26,0.9) 100%)',
        border: '1px solid rgba(245,184,46,0.22)',
        boxShadow: '0 24px 48px -24px rgba(245,184,46,0.3)',
      }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-gold/25 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-3 mb-3">
        <Avatar name={round.from_profile.name} color={round.from_profile.avatar_color} size={40} />
        <div className="flex-1 min-w-0">
          <div className="text-ink-50 font-semibold text-sm">
            {round.from_profile.name} wants to buy you a drink
          </div>
          <div className="text-ink-300 text-xs mt-0.5">{timeAgo(round.created_at)}</div>
        </div>
        <span className="text-3xl drop-shadow-[0_4px_12px_rgba(245,184,46,0.4)]">
          {round.drink_emoji}
        </span>
      </div>

      <div className="relative flex items-center gap-2 mb-2">
        <span className="text-ink-50 font-semibold">{round.drink_name}</span>
        <span className="text-brand-gold text-sm font-bold tabular">
          {formatCents(round.amount_cents)}
        </span>
      </div>

      {round.note && (
        <p className="relative text-ink-300 text-[13px] italic mb-3">
          &ldquo;{round.note}&rdquo;
        </p>
      )}

      <div className="relative flex gap-2">
        <button
          onClick={handleAccept}
          disabled={responding}
          className="flex-1 py-2.5 rounded-xl bg-brand-green text-white font-bold text-sm flex items-center justify-center gap-1.5 press disabled:opacity-50 shadow-glow-green"
        >
          <Check size={16} /> Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={responding}
          className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-ink-300 text-sm flex items-center justify-center press disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

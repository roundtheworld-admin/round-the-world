'use client';

import { Beer, Users } from 'lucide-react';
import Avatar from './Avatar';

interface RoundRobin {
  userId: string;
  name: string;
  avatarColor: string;
  lastBoughtAt: string | null;
  isYou: boolean;
}

interface RoundRobinCardProps {
  next: RoundRobin;
  onBuyForThem: () => void;
  onBuyForEveryone: () => void;
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function RoundRobinCard({
  next,
  onBuyForThem,
  onBuyForEveryone,
}: RoundRobinCardProps) {
  const subtitle = next.lastBoughtAt
    ? (() => {
        const d = daysSince(next.lastBoughtAt);
        if (d === 0) return 'Their last round was earlier today';
        if (d === 1) return "1 day since their last round";
        if (d < 14) return `${d} days since their last round`;
        return 'It has been a while';
      })()
    : 'Still to buy their first round';

  if (next.isYou) {
    return (
      <div
        className="relative rounded-[24px] p-4 mx-4 mt-4 overflow-hidden animate-fade-in-up"
        style={{
          background:
            'linear-gradient(155deg, rgba(245,184,46,0.2) 0%, rgba(249,112,102,0.1) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(245,184,46,0.28)',
          boxShadow: '0 24px 48px -24px rgba(245,184,46,0.35)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-brand-gold/30 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 mb-3">
          <Avatar name={next.name} color={next.avatarColor} size={44} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-brand-gold font-semibold uppercase tracking-[0.2em]">
              Round the world says
            </div>
            <div className="text-ink-50 font-bold text-[17px] font-display tracking-tight">
              It&apos;s your round
            </div>
            <div className="text-ink-300 text-[12px] mt-0.5">{subtitle}</div>
          </div>
          <Beer size={22} className="text-brand-gold drop-shadow-[0_4px_12px_rgba(245,184,46,0.4)]" />
        </div>

        <button
          onClick={onBuyForEveryone}
          className="relative w-full py-3 rounded-xl bg-brand-gold text-black font-bold text-sm press shadow-glow-gold flex items-center justify-center gap-1.5"
        >
          <Users size={15} /> Get them in for everyone
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-[24px] p-4 mx-4 mt-4 overflow-hidden animate-fade-in-up"
      style={{
        background:
          'linear-gradient(155deg, rgba(139,92,246,0.18) 0%, rgba(52,211,153,0.08) 55%, rgba(20,20,26,0.9) 100%)',
        border: '1px solid rgba(139,92,246,0.22)',
        boxShadow: '0 24px 48px -24px rgba(139,92,246,0.3)',
      }}
    >
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-brand-purple/25 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-3 mb-3">
        <Avatar name={next.name} color={next.avatarColor} size={44} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-brand-purple-light font-semibold uppercase tracking-[0.2em]">
            Next up
          </div>
          <div className="text-ink-50 font-bold text-[17px] font-display tracking-tight truncate">
            It&apos;s {next.name}&apos;s round
          </div>
          <div className="text-ink-300 text-[12px] mt-0.5 truncate">{subtitle}</div>
        </div>
        <Beer size={22} className="text-brand-purple-light drop-shadow-[0_4px_12px_rgba(139,92,246,0.35)]" />
      </div>

      <button
        onClick={onBuyForThem}
        className="relative w-full py-3 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-light text-white font-semibold text-sm press shadow-glow-purple"
      >
        Beat them to it, buy {next.name} a drink
      </button>
    </div>
  );
}

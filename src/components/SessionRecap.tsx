'use client';

import { MessageCircle, X, MapPin, Clock } from 'lucide-react';
import type { BarTheme } from '@/lib/types';
import { shareSessionRecap } from '@/lib/whatsapp';

interface SessionRecapProps {
  userName: string;
  pubName: string;
  city: string;
  barTheme: BarTheme;
  durationMs: number;
  drinksCount: number;
  roundsBought: number;
  questionsAnswered: number;
  onClose: () => void;
}

const THEME_META: Record<
  BarTheme,
  { emoji: string; label: string; glow: string; accent: string }
> = {
  snug: {
    emoji: '🪵',
    label: 'The Snug',
    glow: 'rgba(231,111,81,0.35)',
    accent: '#E76F51',
  },
  beach: {
    emoji: '🏖️',
    label: 'Beach Bar',
    glow: 'rgba(0,184,148,0.35)',
    accent: '#00B894',
  },
  speakeasy: {
    emoji: '🎷',
    label: 'Speakeasy',
    glow: 'rgba(245,184,46,0.35)',
    accent: '#F5B82E',
  },
  tokyo: {
    emoji: '🏮',
    label: 'Tokyo Alley',
    glow: 'rgba(251,113,133,0.35)',
    accent: '#FB7185',
  },
};

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function pickHeadline(opts: {
  roundsBought: number;
  drinksCount: number;
  questionsAnswered: number;
  durationMs: number;
}): string {
  if (opts.roundsBought >= 3) return 'You owned the tab tonight.';
  if (opts.roundsBought >= 1) return 'Rounds got bought. Respect.';
  if (opts.drinksCount >= 4) return 'Solid session.';
  if (opts.questionsAnswered >= 3) return 'Deep chat unlocked.';
  if (opts.durationMs > 1000 * 60 * 90) return 'Long one.';
  return 'That is a wrap.';
}

export default function SessionRecap({
  userName,
  pubName,
  city,
  barTheme,
  durationMs,
  drinksCount,
  roundsBought,
  questionsAnswered,
  onClose,
}: SessionRecapProps) {
  const theme = THEME_META[barTheme] || THEME_META.snug;
  const headline = pickHeadline({ roundsBought, drinksCount, questionsAnswered, durationMs });
  const durationLabel = formatDuration(durationMs);

  const handleShare = () => {
    shareSessionRecap({
      userName,
      pubName,
      city,
      themeEmoji: theme.emoji,
      themeLabel: theme.label,
      durationLabel,
      drinksCount,
      roundsBought,
      questionsAnswered,
    });
  };

  const stats: { label: string; value: string | number; show: boolean }[] = [
    { label: 'Duration', value: durationLabel, show: true },
    { label: 'Drinks', value: drinksCount, show: drinksCount > 0 },
    { label: 'Rounds', value: roundsBought, show: roundsBought > 0 },
    { label: 'Answers', value: questionsAnswered, show: questionsAnswered > 0 },
  ].filter((s) => s.show);

  return (
    <div className="fixed inset-0 z-[120] bg-brand-dark overflow-y-auto animate-fade-in">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none opacity-70"
        style={{ background: theme.glow }}
      />
      <div className="absolute top-40 right-10 w-48 h-48 rounded-full bg-brand-purple/25 blur-3xl pointer-events-none" />

      <div className="relative min-h-screen flex flex-col px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-3 pb-1">
          <div className="text-[10px] text-ink-400 font-semibold uppercase tracking-[0.22em]">
            Night recap
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full glass flex items-center justify-center press"
            aria-label="Close recap"
          >
            <X size={16} className="text-ink-300" />
          </button>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center text-center mt-10 mb-10">
          <div className="text-[72px] leading-none mb-3 drop-shadow-[0_8px_32px_rgba(245,184,46,0.35)]">
            {theme.emoji}
          </div>
          <h1 className="font-display text-[30px] leading-[1.05] font-bold tracking-tightest mb-2">
            <span className="bg-gradient-to-r from-white via-brand-purple-light to-brand-gold bg-clip-text text-transparent">
              {headline}
            </span>
          </h1>
          <div className="text-ink-200 text-[14.5px] font-semibold">{pubName}</div>
          <div className="text-ink-400 text-[12px] flex items-center justify-center gap-3 mt-1">
            {city && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} /> {durationLabel}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass rounded-2xl p-4 text-center"
              style={{ borderColor: `${theme.accent}22` }}
            >
              <div className="text-[10px] text-ink-400 font-semibold uppercase tracking-[0.16em]">
                {s.label}
              </div>
              <div
                className="text-[28px] font-display font-bold tabular mt-1"
                style={{ color: theme.accent }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Attribution */}
        <div className="text-center text-ink-400 text-[11px] mb-6">
          {userName} · Round The World
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2.5">
          <button
            onClick={handleShare}
            className="w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-[15px] press flex items-center justify-center gap-2 shadow-[0_16px_40px_-20px_rgba(37,211,102,0.7)]"
          >
            <MessageCircle size={17} /> Share to WhatsApp
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl border border-white/10 bg-white/[0.03] text-ink-200 font-semibold text-[14px] press"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

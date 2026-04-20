'use client';

import { useState } from 'react';
import PixelBar from './PixelBar';
import { BeerSprite, AnimatedBeerSprite } from './BeerSprite';
import { ROUND_THEMES, type BarTheme } from '@/lib/types';

interface PubModeEntryProps {
  userCity: string;
  unansweredCount: number;
  completedCount: number;
  onStart: (params: { theme: BarTheme; pubName: string; city: string }) => void;
}

const BAR_THEMES: { id: BarTheme; name: string; icon: string; desc: string }[] = [
  { id: 'snug', name: 'The Snug', icon: '🪵', desc: 'Cosy Irish pub, fireplace vibes' },
  { id: 'beach', name: 'Beach Bar', icon: '🏖️', desc: 'Sand, sun, and cold ones' },
  { id: 'speakeasy', name: 'Speakeasy', icon: '🎷', desc: 'Dark and classy, hidden door' },
  { id: 'tokyo', name: 'Tokyo Alley', icon: '🏮', desc: 'Neon signs, tiny bar, big vibes' },
];

export default function PubModeEntry({ userCity, unansweredCount, completedCount, onStart }: PubModeEntryProps) {
  const [theme, setTheme] = useState<BarTheme | null>(null);
  const [pubName, setPubName] = useState('');
  const [city, setCity] = useState(userCity || '');
  const [step, setStep] = useState<'theme' | 'details'>('theme');

  if (step === 'theme') {
    return (
      <div className="px-4 pb-28">
        {/* Header with beer sprites */}
        <div className="text-center py-6">
          <div className="flex justify-center items-end gap-1 mb-2">
            <BeerSprite size={40} tilt={-10} color="#E17055" />
            <AnimatedBeerSprite size={56} />
            <BeerSprite size={40} tilt={10} color="#00B894" />
          </div>
          <h2 className="text-[22px] font-extrabold text-white mt-2">Enter Pub Mode</h2>
          <p className="text-[13px] text-gray-500 mt-1">Pick the vibe of your pub tonight</p>
        </div>

        {/* Theme grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {BAR_THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`text-left rounded-2xl overflow-hidden transition-all ${
                theme === t.id
                  ? 'border-2 border-brand-purple bg-brand-purple/10'
                  : 'border border-brand-border bg-brand-card'
              }`}
            >
              <PixelBar type={t.id} width={180} height={80} />
              <div className="p-2.5 pb-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{t.icon}</span>
                  <span className="text-white font-bold text-[13px]">{t.name}</span>
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Pending questions notification */}
        {(unansweredCount > 0 || completedCount > 0) && (
          <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-3 mt-3.5 flex items-center gap-2.5">
            <span className="text-xl">💬</span>
            <div className="flex-1">
              {unansweredCount > 0 && (
                <div className="text-white text-[13px] font-semibold">{unansweredCount} questions waiting for you</div>
              )}
              {completedCount > 0 && (
                <div className="text-gray-500 text-[11px] mt-0.5">{completedCount} answers ready to reveal</div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => theme && setStep('details')}
          disabled={!theme}
          className="w-full mt-4 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-brand-purple to-brand-purple-light text-white"
        >
          Next
        </button>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="px-4 pb-28">
        <div className="rounded-2xl overflow-hidden my-4">
          <PixelBar type={theme!} width={396} height={120} />
        </div>
        <h2 className="text-xl font-extrabold text-white mb-1">Where are you?</h2>
        <p className="text-[13px] text-gray-500 mb-5">Tell the crew about your spot tonight</p>

        <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest block mb-1.5">Pub name</label>
        <input
          value={pubName}
          onChange={e => setPubName(e.target.value)}
          placeholder="Murphy's Pub, The Speakeasy..."
          className="w-full bg-brand-card border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm outline-none focus:border-brand-purple/50 mb-3.5"
        />

        <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest block mb-1.5">City</label>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Dublin"
          className="w-full bg-brand-card border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm outline-none focus:border-brand-purple/50 mb-3.5"
        />

        <button
          onClick={() => onStart({ theme: theme!, pubName, city })}
          disabled={!pubName.trim()}
          className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-brand-purple to-brand-purple-light text-white"
        >
          Start the night
        </button>
      </div>
    );
  }

  return null;
}

'use client';

import { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  PartyPopper,
  MessageCircle,
  EyeOff,
  Radio,
} from 'lucide-react';

interface PubTutorialProps {
  onDone: () => void;
}

type Step = 'what' | 'reveal' | 'live';
const STEPS: Step[] = ['what', 'reveal', 'live'];

// Small, focused tutorial shown once before a user's first Pub Mode session.
// Sets a localStorage flag (see PubTab) so it never shows again.
//
// Design intent: three tappable beats that tell a first-timer
//   1. what pub mode actually is ("a card deck you play while drinking")
//   2. the async reveal mechanic (the thing that's least obvious from the UI)
//   3. how questions propagate between sessions (so they know it's not broken
//      when they ask a question and nothing visible happens right away).
export default function PubTutorial({ onDone }: PubTutorialProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const currentStep: Step = STEPS[stepIdx];
  const progress = (stepIdx + 1) / STEPS.length;
  const isLast = stepIdx === STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));

  return (
    <div className="fixed inset-0 z-[220] flex items-stretch justify-center bg-brand-dark/80 backdrop-blur-lg animate-fade-in">
      {/* Ambient bar lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-12 w-[320px] h-[320px] rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="absolute top-1/3 -left-16 w-[280px] h-[280px] rounded-full bg-brand-purple/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[360px] h-[220px] rounded-full bg-brand-purple-deep/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.2em] text-ink-300">
            <Sparkles size={12} className="text-brand-gold" />
            <span>Pub Mode tour</span>
          </div>
          <button
            onClick={onDone}
            className="text-ink-300 hover:text-ink-50 text-xs font-semibold flex items-center gap-1 press"
          >
            Skip <X size={13} />
          </button>
        </div>

        {/* Progress */}
        <div className="mx-5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-purple via-brand-purple-light to-brand-gold transition-[width] duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div key={currentStep} className="flex-1 overflow-y-auto px-5 pt-8 pb-4 tab-enter">
          {currentStep === 'what' && <WhatStep />}
          {currentStep === 'reveal' && <RevealStep />}
          {currentStep === 'live' && <LiveStep />}
        </div>

        {/* Footer nav */}
        <div className="px-5 pb-6 pt-3 flex items-center gap-3">
          {stepIdx > 0 ? (
            <button
              onClick={goBack}
              className="flex items-center justify-center w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-ink-100 press"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-11" />
          )}

          <button
            onClick={goNext}
            className="flex-1 relative py-3.5 rounded-2xl text-white font-semibold text-[15px] press overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #9F7AEA 0%, #7C3AED 52%, #6D28D9 100%)',
              boxShadow:
                '0 10px 32px -10px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLast ? (
                <>
                  Pour me a pint <PartyPopper size={17} />
                </>
              ) : (
                <>
                  Next <ArrowRight size={17} />
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step: What is Pub Mode ─────────────────────────────────

function WhatStep() {
  return (
    <div>
      <StepHeader
        icon={<MessageCircle size={18} className="text-brand-purple-light" />}
        title="What is Pub Mode"
        subtitle="A card deck you play while you drink"
      />

      <div
        className="relative rounded-2xl p-4 my-5 overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, rgba(139,92,246,0.22) 0%, rgba(245,184,46,0.08) 60%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-purple/25 blur-3xl pointer-events-none" />
        <p className="relative text-ink-100 text-[13.5px] leading-relaxed">
          Pick a vibe, walk into the pub, and a deck of cards rolls in. Questions for the crew, a dash of trivia, a challenge or two, hot takes worth arguing about.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniCard emoji="💬" title="Questions" copy="Prompts for the crew" />
        <MiniCard emoji="🎲" title="Trivia" copy="Stake a sip, guess right" />
        <MiniCard emoji="🎯" title="Challenges" copy="Dares of varying spice" />
        <MiniCard emoji="🔥" title="Hot takes" copy="Agree, disagree, fight" />
      </div>
    </div>
  );
}

// ── Step: How reveals work ─────────────────────────────────

function RevealStep() {
  return (
    <div>
      <StepHeader
        icon={<EyeOff size={18} className="text-brand-gold" />}
        title="No one peeks first"
        subtitle="Everyone answers privately, then it all drops"
      />

      <div
        className="relative rounded-2xl p-4 my-5 overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, rgba(245,184,46,0.16) 0%, rgba(139,92,246,0.12) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-gold/20 blur-3xl pointer-events-none" />
        <p className="relative text-ink-100 text-[13.5px] leading-relaxed">
          Someone asks a question, the whole crew answers on their own phone, and answers stay hidden until the last person replies. Then they all flip at once.
        </p>
      </div>

      {/* Small visual: three masked answers then a reveal */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
        <div className="space-y-1.5">
          <MaskedRow label="Answer in..." state="sent" />
          <MaskedRow label="Answer in..." state="sent" />
          <MaskedRow label="Waiting on you..." state="waiting" />
        </div>
        <div className="mt-3 text-center text-[11px] text-ink-400">
          Everyone answers → answers reveal at once
        </div>
      </div>

      <p className="mt-4 text-ink-300 text-[12.5px] leading-relaxed text-center px-2">
        Keeps it honest. No copying each other, no gaming the vibe.
      </p>
    </div>
  );
}

function MaskedRow({ label, state }: { label: string; state: 'sent' | 'waiting' }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-2 h-2 rounded-full ${
          state === 'sent' ? 'bg-brand-green-light' : 'bg-brand-gold animate-pulse'
        }`}
      />
      <div className="flex-1 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center px-3">
        <div className="text-[11px] text-ink-400">
          {state === 'sent' ? 'Locked in' : label}
        </div>
      </div>
    </div>
  );
}

// ── Step: Live updates / how it propagates ─────────────────

function LiveStep() {
  return (
    <div>
      <StepHeader
        icon={<Radio size={18} className="text-brand-green-light" />}
        title="Asks travel live"
        subtitle="Ask something, the crew sees it in their deck"
      />

      <div
        className="relative rounded-2xl p-4 my-5 overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, rgba(0,184,148,0.12) 0%, rgba(139,92,246,0.1) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-green/20 blur-3xl pointer-events-none" />
        <p className="relative text-ink-100 text-[13.5px] leading-relaxed">
          When you ask a question, your crew&rsquo;s phones pick it up. If they&rsquo;re already mid-session, new cards drop straight into their deck. Otherwise it&rsquo;s waiting next time they walk into the pub.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2">
        <FlowRow
          step="1"
          text="You ask: &ldquo;What&rsquo;s the best bar you&rsquo;ve ever been to?&rdquo;"
        />
        <FlowRow
          step="2"
          text="Card lands in every crew member&rsquo;s deck"
        />
        <FlowRow
          step="3"
          text="Everyone answers, then it all gets revealed"
          accent
        />
      </div>

      <p className="mt-4 text-ink-300 text-[12.5px] leading-relaxed text-center px-2">
        Your first night is going to be a bit sparse. It fills up fast.
      </p>
    </div>
  );
}

function FlowRow({ step, text, accent }: { step: string; text: string; accent?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
          accent
            ? 'bg-brand-green/20 text-brand-green-light border border-brand-green/40'
            : 'bg-white/[0.06] text-ink-200 border border-white/10'
        }`}
      >
        {step}
      </div>
      <div className="text-[12.5px] text-ink-100 leading-snug">{text}</div>
    </div>
  );
}

// ── Shared bits ────────────────────────────────────────────

function MiniCard({
  emoji,
  title,
  copy,
}: {
  emoji: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="text-2xl">{emoji}</div>
      <div className="text-ink-50 font-semibold text-[13px] mt-1.5">{title}</div>
      <div className="text-ink-400 text-[11.5px] mt-0.5 leading-snug">{copy}</div>
    </div>
  );
}

function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="font-display text-[20px] font-bold tracking-tight text-ink-50">
          {title}
        </div>
        <div className="text-ink-300 text-[12.5px]">{subtitle}</div>
      </div>
    </div>
  );
}

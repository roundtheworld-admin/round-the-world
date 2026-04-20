'use client';

import { useState } from 'react';
import {
  Sparkles,
  MessageCircle,
  Receipt,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Plus,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Handshake,
  PartyPopper,
} from 'lucide-react';
import Avatar from './Avatar';

interface FirstLoginWizardProps {
  profileName: string;
  profileAvatarColor: string;
  groupName: string;
  inviteCode: string;
  /** Persist a new question to the real crew. */
  onAskQuestion: (text: string) => Promise<{ error?: any }>;
  /** Called when the user finishes or skips. */
  onComplete: () => void;
}

const SUGGESTED_QUESTIONS_STEP_ONE = [
  "What's the best bar you've ever been to?",
  'Weirdest thing you\u2019ve ever drunk?',
  'Last meal on earth, what are you eating?',
  'Three places on your bucket list?',
];

const SUGGESTED_QUESTIONS_STEP_TWO = [
  'If you had to swap lives with someone in this crew for a day, who?',
  'What\u2019s one thing nobody in this crew knows about you?',
  'Best night out you\u2019ve ever had. Go.',
  'Round you\u2019d buy if money didn\u2019t matter?',
];

type StepId = 'welcome' | 'pub' | 'tab' | 'crew' | 'done';
const STEP_ORDER: StepId[] = ['welcome', 'pub', 'tab', 'crew', 'done'];

export default function FirstLoginWizard({
  profileName,
  profileAvatarColor,
  groupName,
  inviteCode,
  onAskQuestion,
  onComplete,
}: FirstLoginWizardProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q1Custom, setQ1Custom] = useState('');
  const [q2Custom, setQ2Custom] = useState('');
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const currentStep: StepId = STEP_ORDER[stepIdx];
  const progress = (stepIdx + 1) / STEP_ORDER.length;

  const goNext = () => setStepIdx((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));

  const persistQuestion = async (text: string, stepMarker: number) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSavingIdx(stepMarker);
    const { error } = await onAskQuestion(trimmed);
    setSavingIdx(null);
    if (!error) {
      setSavedSteps((s) => new Set(s).add(stepMarker));
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleFinish = async () => {
    // Persist whatever questions are ready but not yet saved.
    const q1Text = (q1Custom.trim() || q1).trim();
    const q2Text = (q2Custom.trim() || q2).trim();
    if (q1Text && !savedSteps.has(1)) await persistQuestion(q1Text, 1);
    if (q2Text && !savedSteps.has(3)) await persistQuestion(q2Text, 3);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-stretch justify-center bg-brand-dark/80 backdrop-blur-lg animate-fade-in">
      {/* Ambient bar lighting inside the wizard */}
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
            <span>Quick tour</span>
          </div>
          <button
            onClick={onComplete}
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
        <div key={currentStep} className="flex-1 overflow-y-auto px-5 pt-6 pb-4 tab-enter">
          {currentStep === 'welcome' && (
            <WelcomeStep
              name={profileName}
              groupName={groupName}
              avatarColor={profileAvatarColor}
            />
          )}

          {currentStep === 'pub' && (
            <PubStep
              chosen={q1}
              custom={q1Custom}
              onChoose={setQ1}
              onCustom={setQ1Custom}
              saving={savingIdx === 1}
              saved={savedSteps.has(1)}
              onSave={() => persistQuestion((q1Custom.trim() || q1).trim(), 1)}
            />
          )}

          {currentStep === 'tab' && (
            <TabStep name={profileName} avatarColor={profileAvatarColor} />
          )}

          {currentStep === 'crew' && (
            <CrewStep
              groupName={groupName}
              inviteCode={inviteCode}
              copied={copied}
              onCopy={handleCopy}
              chosen={q2}
              custom={q2Custom}
              onChoose={setQ2}
              onCustom={setQ2Custom}
              saving={savingIdx === 3}
              saved={savedSteps.has(3)}
              onSave={() => persistQuestion((q2Custom.trim() || q2).trim(), 3)}
            />
          )}

          {currentStep === 'done' && (
            <DoneStep
              groupName={groupName}
              inviteCode={inviteCode}
              copied={copied}
              onCopy={handleCopy}
              savedCount={savedSteps.size}
            />
          )}
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
            onClick={currentStep === 'done' ? handleFinish : goNext}
            className="flex-1 relative py-3.5 rounded-2xl text-white font-semibold text-[15px] press overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #9F7AEA 0%, #7C3AED 52%, #6D28D9 100%)',
              boxShadow:
                '0 10px 32px -10px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {currentStep === 'done' ? (
                <>
                  Let&rsquo;s go <PartyPopper size={17} />
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

// ── Step: Welcome ───────────────────────────────────────────

function WelcomeStep({
  name,
  groupName,
  avatarColor,
}: {
  name: string;
  groupName: string;
  avatarColor: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center mb-5">
        <div className="relative">
          <Avatar name={name} color={avatarColor} size={84} />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-lg shadow-glow-gold">
            🍻
          </div>
        </div>
      </div>
      <h2 className="font-display text-[26px] leading-tight font-bold tracking-tight">
        Welcome to{' '}
        <span className="bg-gradient-to-r from-white via-brand-purple-light to-brand-gold bg-clip-text text-transparent">
          {groupName}
        </span>
      </h2>
      <p className="text-ink-300 text-[14px] mt-2 max-w-[300px] mx-auto">
        Round The World is better with a crew. Quick 60 second tour so your friends walk into something alive.
      </p>

      <div className="mt-7 space-y-2.5 text-left">
        <FeatureBullet
          icon={<MessageCircle size={16} className="text-brand-purple-light" />}
          title="Pub Mode"
          body="Start a session when you&rsquo;re out. Everyone answers the same questions from wherever they are."
        />
        <FeatureBullet
          icon={<Receipt size={16} className="text-brand-gold" />}
          title="Keep a tab"
          body="Buy a round from anywhere in the world. Settle up whenever."
        />
        <FeatureBullet
          icon={<Users size={16} className="text-brand-green-light" />}
          title="Crew leaderboard"
          body="Most generous, biggest spender, best taste. Bragging rights forever."
        />
      </div>
    </div>
  );
}

function FeatureBullet({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-2xl p-3.5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-ink-50 font-semibold text-[14px]">{title}</div>
        <div className="text-ink-300 text-[12.5px] leading-snug">{body}</div>
      </div>
    </div>
  );
}

// ── Step: Pub Mode + seed first question ────────────────────

function PubStep({
  chosen,
  custom,
  onChoose,
  onCustom,
  saving,
  saved,
  onSave,
}: {
  chosen: string;
  custom: string;
  onChoose: (v: string) => void;
  onCustom: (v: string) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  const hasPick = (custom.trim() || chosen).trim().length > 0;

  return (
    <div>
      <StepHeader
        icon={<MessageCircle size={18} className="text-brand-purple-light" />}
        title="Pub Mode"
        subtitle="Questions that travel between pints"
      />

      <div
        className="relative rounded-2xl p-4 my-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, rgba(139,92,246,0.2) 0%, rgba(245,184,46,0.06) 60%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-purple/25 blur-3xl pointer-events-none" />
        <p className="relative text-ink-100 text-[13.5px] leading-snug">
          In the pub with your crew. Someone asks a question. Everyone answers from their phone. Nothing revealed until the last person&rsquo;s in.
        </p>
      </div>

      <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-300 font-semibold mb-2">
        Seed a first question for your crew
      </div>
      <p className="text-ink-400 text-[12px] mb-3">
        Pick one, or write your own. Your friends will see it the moment they join.
      </p>

      <div className="space-y-1.5 mb-3">
        {SUGGESTED_QUESTIONS_STEP_ONE.map((q) => {
          const active = chosen === q && !custom.trim();
          return (
            <button
              key={q}
              onClick={() => {
                onChoose(q);
                onCustom('');
              }}
              className={`w-full text-left rounded-xl px-3.5 py-3 text-[13.5px] press transition-all ${
                active
                  ? 'bg-brand-purple/20 border border-brand-purple/40 text-ink-50'
                  : 'bg-white/[0.03] border border-white/[0.06] text-ink-100 hover:bg-white/[0.06]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    active ? 'border-brand-purple bg-brand-purple' : 'border-white/20'
                  }`}
                >
                  {active && <Check size={11} className="text-white" />}
                </span>
                {q}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <input
          value={custom}
          onChange={(e) => {
            onCustom(e.target.value);
            if (e.target.value.trim()) onChoose('');
          }}
          placeholder="Or write your own"
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-ink-50 text-[14px] placeholder-ink-400 outline-none focus-ring"
        />
      </div>

      <button
        disabled={!hasPick || saving || saved}
        onClick={onSave}
        className={`w-full mt-3 py-2.5 rounded-xl text-sm font-semibold press transition-all ${
          saved
            ? 'bg-brand-green/20 text-brand-green-light border border-brand-green/40'
            : 'bg-white/[0.06] text-ink-100 border border-white/10 disabled:opacity-40'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check size={15} /> Saved for your crew
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <Plus size={15} /> {saving ? 'Saving…' : 'Save for my crew'}
          </span>
        )}
      </button>
    </div>
  );
}

// ── Step: Tab mockup ────────────────────────────────────────

function TabStep({ name, avatarColor }: { name: string; avatarColor: string }) {
  return (
    <div>
      <StepHeader
        icon={<Receipt size={18} className="text-brand-gold" />}
        title="Your Tab"
        subtitle="A running balance with every friend"
      />

      {/* Mock balance hero */}
      <div
        className="relative rounded-[22px] p-5 my-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, rgba(139,92,246,0.22) 0%, rgba(245,184,46,0.08) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-brand-gold/20 blur-3xl pointer-events-none" />
        <div className="text-[10.5px] text-ink-300 uppercase tracking-[0.18em] font-semibold mb-1.5">
          Your tab
        </div>
        <div className="font-display text-[36px] leading-none font-bold tabular tracking-tightest text-brand-green-light">
          +$14
        </div>
        <div className="text-ink-300 text-[12px] mt-1.5">You are owed overall</div>
      </div>

      {/* Mock balance rows */}
      <div className="space-y-1.5">
        <MockTabRow
          name="Dave"
          color="#F97066"
          delta="+$7"
          label="Owes you $7"
          icon={<ArrowDownLeft size={12} />}
          tone="green"
          showSettle
        />
        <MockTabRow
          name="Kieran"
          color="#8B5CF6"
          delta="-$5"
          label="You owe $5"
          icon={<ArrowUpRight size={12} />}
          tone="coral"
          showSettle
        />
        <MockTabRow
          name="Ryan"
          color="#34D399"
          delta="+$12"
          label="Owes you $12"
          icon={<ArrowDownLeft size={12} />}
          tone="green"
          showSettle
        />
      </div>

      {/* Mock history row */}
      <div className="mt-5 rounded-xl px-3.5 py-3 bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-purple/12 ring-1 ring-brand-purple/25 text-base">
          🍺
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-ink-100 text-[13px] leading-snug">
            <span className="font-semibold">Dave</span> bought{' '}
            <span className="font-semibold">{name || 'you'}</span> a Pint
          </div>
          <div className="text-ink-400 text-[11px] mt-0.5">2 hours ago</div>
        </div>
        <div className="text-[13px] font-semibold text-brand-purple-light tabular">$7</div>
      </div>

      <p className="text-ink-400 text-[12px] mt-5 text-center">
        Buy a round from anywhere. The tab takes care of itself.
      </p>

      {/* Tiny floating avatar to tie it to the user */}
      <div className="sr-only">
        <Avatar name={name} color={avatarColor} size={1} />
      </div>
    </div>
  );
}

function MockTabRow({
  name,
  color,
  delta,
  label,
  icon,
  tone,
  showSettle,
}: {
  name: string;
  color: string;
  delta: string;
  label: string;
  icon: React.ReactNode;
  tone: 'green' | 'coral';
  showSettle?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-3">
      <Avatar name={name} color={color} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-ink-50 font-semibold text-[14px]">{name}</div>
        <div
          className={`text-[11px] mt-0.5 flex items-center gap-1 tabular ${
            tone === 'green' ? 'text-brand-green-light' : 'text-brand-coral'
          }`}
        >
          {icon}
          <span>
            {label} <span className="opacity-70">({delta})</span>
          </span>
        </div>
      </div>
      {showSettle && (
        <div className="flex items-center gap-1.5 text-brand-green-light border border-brand-green/40 bg-brand-green/10 rounded-full px-3 py-1 text-[11px] font-semibold">
          <Handshake size={12} /> Settle
        </div>
      )}
    </div>
  );
}

// ── Step: Crew + invite + seed second question ──────────────

function CrewStep({
  groupName,
  inviteCode,
  copied,
  onCopy,
  chosen,
  custom,
  onChoose,
  onCustom,
  saving,
  saved,
  onSave,
}: {
  groupName: string;
  inviteCode: string;
  copied: boolean;
  onCopy: () => void;
  chosen: string;
  custom: string;
  onChoose: (v: string) => void;
  onCustom: (v: string) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  const hasPick = (custom.trim() || chosen).trim().length > 0;

  return (
    <div>
      <StepHeader
        icon={<Users size={18} className="text-brand-green-light" />}
        title="Your Crew"
        subtitle="Invite your people, bragging rights follow"
      />

      {/* Invite card */}
      <div
        className="relative rounded-[22px] p-4 my-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, rgba(245,184,46,0.14) 0%, rgba(139,92,246,0.14) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-gold/25 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-300 font-semibold mb-1">
            Share {groupName}&rsquo;s invite
          </div>
          <div className="flex items-center justify-between">
            <div className="text-brand-gold font-mono font-bold text-[22px] tracking-[0.28em]">
              {inviteCode}
            </div>
            <button
              onClick={onCopy}
              className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 press transition-all ${
                copied
                  ? 'bg-brand-green/20 text-brand-green-light border border-brand-green/40'
                  : 'bg-white/[0.06] text-ink-100 border border-white/10'
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>
          <div className="text-ink-300 text-[12px] mt-2">
            Drop it in your group chat. They paste it on the join screen.
          </div>
        </div>
      </div>

      <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-300 font-semibold mb-2">
        Plant one more question
      </div>
      <p className="text-ink-400 text-[12px] mb-3">
        A second prompt waiting for them so the first session isn&rsquo;t empty.
      </p>

      <div className="space-y-1.5 mb-3">
        {SUGGESTED_QUESTIONS_STEP_TWO.map((q) => {
          const active = chosen === q && !custom.trim();
          return (
            <button
              key={q}
              onClick={() => {
                onChoose(q);
                onCustom('');
              }}
              className={`w-full text-left rounded-xl px-3.5 py-3 text-[13.5px] press transition-all ${
                active
                  ? 'bg-brand-purple/20 border border-brand-purple/40 text-ink-50'
                  : 'bg-white/[0.03] border border-white/[0.06] text-ink-100 hover:bg-white/[0.06]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    active ? 'border-brand-purple bg-brand-purple' : 'border-white/20'
                  }`}
                >
                  {active && <Check size={11} className="text-white" />}
                </span>
                {q}
              </span>
            </button>
          );
        })}
      </div>

      <input
        value={custom}
        onChange={(e) => {
          onCustom(e.target.value);
          if (e.target.value.trim()) onChoose('');
        }}
        placeholder="Or write your own"
        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-ink-50 text-[14px] placeholder-ink-400 outline-none focus-ring"
      />

      <button
        disabled={!hasPick || saving || saved}
        onClick={onSave}
        className={`w-full mt-3 py-2.5 rounded-xl text-sm font-semibold press transition-all ${
          saved
            ? 'bg-brand-green/20 text-brand-green-light border border-brand-green/40'
            : 'bg-white/[0.06] text-ink-100 border border-white/10 disabled:opacity-40'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check size={15} /> Saved for your crew
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <Plus size={15} /> {saving ? 'Saving…' : 'Save for my crew'}
          </span>
        )}
      </button>
    </div>
  );
}

// ── Step: Done ──────────────────────────────────────────────

function DoneStep({
  groupName,
  inviteCode,
  copied,
  onCopy,
  savedCount,
}: {
  groupName: string;
  inviteCode: string;
  copied: boolean;
  onCopy: () => void;
  savedCount: number;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center mb-5">
        <div className="relative text-[64px] leading-none drop-shadow-[0_10px_32px_rgba(245,184,46,0.5)]">
          🍻
        </div>
      </div>
      <h2 className="font-display text-[26px] leading-tight font-bold tracking-tight">
        You&rsquo;re all set
      </h2>
      <p className="text-ink-300 text-[14px] mt-2 max-w-[300px] mx-auto">
        {savedCount > 0
          ? `${savedCount} question${
              savedCount === 1 ? '' : 's'
            } planted for the crew. Send your invite code, start a session when you&rsquo;re out.`
          : 'Send your invite code, start a session when you\u2019re out.'}
      </p>

      <div
        className="relative rounded-2xl p-4 mt-6 overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, rgba(245,184,46,0.14) 0%, rgba(139,92,246,0.14) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-gold/25 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-300 font-semibold">
              {groupName} invite
            </div>
            <div className="text-brand-gold font-mono font-bold text-[22px] tracking-[0.28em]">
              {inviteCode}
            </div>
          </div>
          <button
            onClick={onCopy}
            className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 press transition-all ${
              copied
                ? 'bg-brand-green/20 text-brand-green-light border border-brand-green/40'
                : 'bg-white/[0.06] text-ink-100 border border-white/10'
            }`}
          >
            {copied ? (
              <>
                <Check size={13} /> Copied
              </>
            ) : (
              <>
                <Copy size={13} /> Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step header ─────────────────────────────────────────────

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

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Clock,
  MapPin,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  Handshake,
  Copy,
  Check,
  Pencil,
  X as XIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGroup } from '@/hooks/useGroup';
import { useTab } from '@/hooks/useTab';
import { usePubSession } from '@/hooks/usePubSession';
import { useQuestions, type CategorizedQuestions } from '@/hooks/useQuestions';
import PubModeEntry from '@/components/pub/PubModeEntry';
import PubSession from '@/components/pub/PubSession';
import type { BarTheme } from '@/lib/types';
import BottomNav, { type TabId } from '@/components/BottomNav';
import BuyRoundSheet from '@/components/BuyRoundSheet';
import SettleUpSheet from '@/components/SettleUpSheet';
import Avatar from '@/components/Avatar';
import FirstLoginWizard from '@/components/FirstLoginWizard';
import RoundRobinCard from '@/components/RoundRobinCard';
import SessionRecap from '@/components/SessionRecap';
import { createClient } from '@/lib/supabase-browser';
import { localTime, timeAgo } from '@/lib/time';
import { formatCents, type Profile, type TabEntry } from '@/lib/types';

// ── Shared bits ─────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] text-ink-400 font-semibold uppercase tracking-[0.14em] mb-3 mt-6 flex items-center gap-1.5">
      {icon}
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-ink-50 text-[15px] placeholder-ink-400 outline-none transition-all focus-ring ${
        props.className || ''
      }`}
    />
  );
}

function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`relative w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] press disabled:opacity-40 disabled:pointer-events-none overflow-hidden ${
        props.className || ''
      }`}
      style={{
        background:
          'linear-gradient(180deg, #9F7AEA 0%, #7C3AED 52%, #6D28D9 100%)',
        boxShadow:
          '0 10px 32px -10px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-ink-50 font-semibold text-[15px] press disabled:opacity-40 disabled:pointer-events-none ${
        props.className || ''
      }`}
    />
  );
}

// ── Auth Screen ─────────────────────────────────────────────

function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState<'auth' | 'forgot'>('auth');
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Wrong email or password. Try again or sign up.');
      } else if (error.message.includes('already registered')) {
        setError('That email already has an account. Try signing in.');
      } else if (error.message.includes('least 6')) {
        setError('Password needs to be at least 6 characters.');
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Check your email to confirm your account first.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleForgot = async () => {
    setError('');
    if (!email.includes('@')) {
      setError('Enter your email first, then tap Send reset link.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setForgotSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative">
      {/* Soft bar-light glow behind the logo */}
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="text-[64px] leading-none mb-7 text-center select-none drop-shadow-[0_8px_24px_rgba(139,92,246,0.35)]">
          🍻
        </div>
      </div>
      <h1 className="font-display text-[34px] leading-[1.05] font-bold tracking-tightest text-center mb-2">
        <span className="bg-gradient-to-r from-white via-brand-purple-light to-brand-gold bg-clip-text text-transparent">
          Round The World
        </span>
      </h1>
      <p className="text-ink-300 text-[13.5px] mb-10 text-center max-w-[260px]">
        Buy rounds for friends, keep a tab, settle up later.
      </p>

      <div className="w-full max-w-xs space-y-3 relative">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && mode === 'forgot') handleForgot();
          }}
        />

        {mode === 'auth' && (
          <>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Password"
            />
            <PrimaryButton
              onClick={handleSubmit}
              disabled={!email.includes('@') || password.length < 6 || loading}
            >
              {loading ? 'Hold on…' : isSignUp ? 'Create account' : 'Sign in'}
            </PrimaryButton>
          </>
        )}

        {mode === 'forgot' && !forgotSent && (
          <PrimaryButton
            onClick={handleForgot}
            disabled={!email.includes('@') || loading}
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </PrimaryButton>
        )}

        {mode === 'forgot' && forgotSent && (
          <div className="rounded-2xl border border-brand-green/30 bg-brand-green/10 p-4 text-center animate-fade-in">
            <div className="text-2xl mb-1">📬</div>
            <div className="text-brand-green-light text-sm font-semibold">
              Check your inbox
            </div>
            <div className="text-ink-300 text-xs mt-1">
              We sent a reset link to {email}. Open it on this device.
            </div>
          </div>
        )}

        {error && (
          <p className="text-brand-coral text-xs text-center animate-fade-in">{error}</p>
        )}

        {mode === 'auth' && !isSignUp && (
          <button
            onClick={() => {
              setError('');
              setForgotSent(false);
              setMode('forgot');
            }}
            className="w-full text-ink-400 text-[11px] text-center hover:text-ink-100 transition-colors"
          >
            Forgot your password?
          </button>
        )}

        {mode === 'auth' && (
          <button
            onClick={() => {
              setError('');
              setIsSignUp(!isSignUp);
            }}
            className="w-full mt-1 text-ink-300 text-xs text-center hover:text-ink-100 transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        )}

        {mode === 'forgot' && (
          <button
            onClick={() => {
              setError('');
              setForgotSent(false);
              setMode('auth');
            }}
            className="w-full mt-1 text-ink-300 text-xs text-center hover:text-ink-100 transition-colors"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}

// ── Onboarding ──────────────────────────────────────────────

function OnboardingScreen({
  createGroup,
  joinGroup,
}: {
  createGroup: (name: string) => Promise<{ error: any }>;
  joinGroup: (code: string) => Promise<{ error: any }>;
}) {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState<'profile' | 'group'>('profile');
  const [name, setName] = useState(profile?.name || '');
  const [city, setCity] = useState(profile?.city || '');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleProfileDone = async () => {
    await updateProfile({
      name: name.trim(),
      city: city.trim() || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setStep('group');
  };

  const handleCreateGroup = async () => {
    setError('');
    const { error } = await createGroup(groupName.trim());
    if (error) setError(error.message);
  };

  const handleJoinGroup = async () => {
    setError('');
    const { error } = await joinGroup(inviteCode);
    if (error) setError(error.message);
  };

  if (step === 'profile') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 animate-fade-in">
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" />
        <div className="text-5xl mb-4">👋</div>
        <h2 className="font-display text-2xl font-bold text-ink-50 mb-1 tracking-tight">
          Welcome in
        </h2>
        <p className="text-ink-300 text-sm mb-8">Tell us a bit about yourself.</p>
        <div className="w-full max-w-xs space-y-3 relative">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Your city (e.g. Dublin)"
          />
          <PrimaryButton onClick={handleProfileDone} disabled={!name.trim()}>
            Next
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 animate-fade-in">
      <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full bg-brand-gold/20 blur-3xl pointer-events-none" />
      <div className="text-5xl mb-4">🌍</div>
      <h2 className="font-display text-2xl font-bold text-ink-50 mb-1 tracking-tight">
        Join or start a crew
      </h2>
      <p className="text-ink-300 text-sm mb-8 text-center">
        Your private group of friends.
      </p>
      <div className="w-full max-w-xs space-y-3 relative">
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Crew name (e.g. The Lads)"
        />
        <PrimaryButton onClick={handleCreateGroup} disabled={!groupName.trim()}>
          Create a crew
        </PrimaryButton>
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-ink-400 text-[11px] uppercase tracking-[0.18em]">
            or
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <Input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Invite code"
        />
        <SecondaryButton onClick={handleJoinGroup} disabled={!inviteCode.trim()}>
          Join with code
        </SecondaryButton>
        {error && (
          <p className="text-brand-coral text-xs text-center animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}

// ── Tab Screen ──────────────────────────────────────────────

function TabSkeleton() {
  return (
    <div className="px-4 pt-4 tab-enter">
      <div className="skeleton h-[132px] mb-5" />
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-[68px] mb-2" />
      <div className="skeleton h-[68px] mb-2" />
      <div className="skeleton h-[68px]" />
    </div>
  );
}

function TabScreen({
  groupId,
  myUserId,
  onSettleUp,
}: {
  groupId: string;
  myUserId: string;
  myName: string;
  onSettleUp: (entry: TabEntry) => void;
}) {
  const { tab, history, netBalance, loading } = useTab(groupId, myUserId);

  if (loading) return <TabSkeleton />;

  const positive = netBalance > 0;
  const negative = netBalance < 0;

  return (
    <div className="px-4 pb-40 tab-enter">
      {/* Hero balance card */}
      <div
        className="relative rounded-[28px] p-6 my-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, rgba(139,92,246,0.22) 0%, rgba(245,184,46,0.08) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -24px rgba(139,92,246,0.35)',
        }}
      >
        {/* Faint orb for depth */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-gold/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-brand-purple/25 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="text-[10.5px] text-ink-300 uppercase tracking-[0.18em] font-semibold mb-2">
            Your tab
          </div>
          <div
            className={`font-display text-[44px] leading-none font-bold tabular tracking-tightest ${
              positive ? 'text-brand-green-light' : negative ? 'text-brand-coral' : 'text-ink-100'
            }`}
          >
            {positive ? '+' : ''}
            {formatCents(netBalance)}
          </div>
          <div className="text-ink-300 text-[13px] mt-2">
            {positive
              ? 'You are owed overall'
              : negative
              ? 'You owe overall'
              : 'All squared up — nice.'}
          </div>
        </div>
      </div>

      {/* Individual balances */}
      {tab.length > 0 && (
        <>
          <SectionLabel>Balances</SectionLabel>
          <div className="space-y-2">
            {tab.map((entry) => {
              const owes = entry.amount_cents > 0;
              const you = entry.amount_cents < 0;
              return (
                <div
                  key={entry.userId}
                  className="glass rounded-2xl p-3.5 flex items-center gap-3 press"
                >
                  <Avatar name={entry.name} color={entry.avatar_color} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="text-ink-50 font-semibold text-[14.5px]">
                      {entry.name}
                    </div>
                    <div
                      className={`text-xs mt-0.5 flex items-center gap-1 tabular ${
                        owes ? 'text-brand-green-light' : you ? 'text-brand-coral' : 'text-ink-300'
                      }`}
                    >
                      {owes ? (
                        <>
                          <ArrowDownLeft size={12} /> Owes you {formatCents(entry.amount_cents)}
                        </>
                      ) : you ? (
                        <>
                          <ArrowUpRight size={12} /> You owe {formatCents(entry.amount_cents)}
                        </>
                      ) : (
                        'Squared up'
                      )}
                    </div>
                  </div>
                  {entry.amount_cents !== 0 && (
                    <button
                      onClick={() => onSettleUp(entry)}
                      className="flex items-center gap-1.5 text-brand-green-light border border-brand-green/40 bg-brand-green/10 rounded-full px-3.5 py-1.5 text-xs font-semibold press hover:bg-brand-green/15 transition-colors"
                    >
                      <Handshake size={14} /> Settle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <SectionLabel>History</SectionLabel>
          <div className="space-y-1.5">
            {history.map((item: any) => {
              const isRound = item._type === 'round';
              return (
                <div
                  key={item.id}
                  className="rounded-xl px-3.5 py-3 bg-white/[0.02] border border-white/[0.04] flex items-center gap-3"
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full text-base ${
                      isRound
                        ? 'bg-brand-purple/12 ring-1 ring-brand-purple/25'
                        : 'bg-brand-green/12 ring-1 ring-brand-green/25'
                    }`}
                  >
                    {isRound ? item.drink_emoji || '🍺' : '🤝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-ink-100 text-[13.5px] leading-snug">
                      {isRound ? (
                        <>
                          <span className="font-semibold">{item.from_profile?.name}</span>
                          {' bought '}
                          <span className="font-semibold">{item.to_profile?.name}</span>
                          {' a '}
                          {item.drink_name}
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{item.from_profile?.name}</span>
                          {' settled up with '}
                          <span className="font-semibold">{item.to_profile?.name}</span>
                        </>
                      )}
                    </div>
                    <div className="text-ink-400 text-[11px] mt-0.5">
                      {timeAgo(item.created_at)}
                    </div>
                  </div>
                  <div
                    className={`text-[13.5px] font-semibold tabular ${
                      isRound ? 'text-brand-purple-light' : 'text-brand-green-light'
                    }`}
                  >
                    {formatCents(item.amount_cents)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab.length === 0 && history.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3 opacity-80">🤝</div>
          <div className="text-ink-300 text-sm max-w-[240px] mx-auto">
            No rounds yet. Buy someone a drink to open the tab.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Crew Tab ────────────────────────────────────────────────

function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 press transition-all ${
        copied
          ? 'bg-brand-green/20 text-brand-green-light border border-brand-green/40'
          : 'bg-white/[0.06] text-ink-100 border border-white/10 hover:bg-white/[0.09]'
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
  );
}

interface LedgerRow {
  userId: string;
  name: string;
  avatarColor: string;
  boughtForThem: number;
  boughtForMe: number;
  net: number;
}

function CrewTab({
  members,
  leaderboard,
  group,
  getDrinkLedger,
  myUserId,
  renameGroup,
}: {
  members: Profile[];
  leaderboard: any[];
  group: any;
  getDrinkLedger: () => Promise<LedgerRow[]>;
  myUserId: string;
  renameGroup: (name: string) => Promise<{ error: any }>;
}) {
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group?.name || '');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSaving, setRenameSaving] = useState(false);
  const canRename = group?.created_by === myUserId;

  useEffect(() => {
    getDrinkLedger().then(setLedger);
  }, [members.length]);

  const handleRenameSave = async () => {
    setRenameError(null);
    const next = nameDraft.trim();
    if (!next) {
      setRenameError('Give it a name.');
      return;
    }
    if (next === group?.name) {
      setEditingName(false);
      return;
    }
    setRenameSaving(true);
    const { error } = await renameGroup(next);
    setRenameSaving(false);
    if (error) {
      setRenameError(error.message || 'Could not rename. Try again.');
      return;
    }
    setEditingName(false);
  };

  const handleRenameCancel = () => {
    setNameDraft(group?.name || '');
    setRenameError(null);
    setEditingName(false);
  };

  const hasAnyHistory = ledger.some((l) => l.boughtForThem > 0 || l.boughtForMe > 0);
  const AWARDS = [
    { label: 'Most generous', key: 'rounds_bought', emoji: '🏆' },
    {
      label: 'Biggest spender',
      key: 'total_spent_cents',
      emoji: '💸',
      format: (v: number) => formatCents(v),
    },
    { label: 'Most check-ins', key: 'total_checkins', emoji: '📝' },
    {
      label: 'Best taste',
      key: 'avg_rating',
      emoji: '👑',
      format: (v: number) => `${v.toFixed(1)} avg`,
    },
  ];

  return (
    <div className="px-4 pb-40 tab-enter">
      {/* Crew card */}
      <div
        className="relative rounded-[28px] p-5 my-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, rgba(245,184,46,0.12) 0%, rgba(139,92,246,0.15) 55%, rgba(20,20,26,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -24px rgba(245,184,46,0.2)',
        }}
      >
        <div className="absolute -top-12 -right-10 w-48 h-48 rounded-full bg-brand-gold/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-center mb-4">
          <div className="flex -space-x-2.5">
            {members.slice(0, 4).map((m) => (
              <div key={m.id} className="ring-2 ring-brand-dark rounded-full">
                <Avatar name={m.name} color={m.avatar_color} size={44} ring={false} />
              </div>
            ))}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            {editingName ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSave();
                      if (e.key === 'Escape') handleRenameCancel();
                    }}
                    maxLength={40}
                    className="flex-1 min-w-0 bg-white/[0.06] border border-brand-gold/40 rounded-lg px-2.5 py-1.5 text-ink-50 font-bold text-[15px] outline-none focus:border-brand-gold"
                    placeholder="Crew name"
                  />
                  <button
                    onClick={handleRenameSave}
                    disabled={renameSaving}
                    className="w-8 h-8 rounded-lg bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center press disabled:opacity-40"
                    aria-label="Save crew name"
                  >
                    <Check size={14} className="text-brand-gold" />
                  </button>
                  <button
                    onClick={handleRenameCancel}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center press"
                    aria-label="Cancel rename"
                  >
                    <XIcon size={14} className="text-ink-300" />
                  </button>
                </div>
                {renameError && (
                  <div className="text-brand-coral text-[11px]">{renameError}</div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="text-ink-50 font-bold text-[17px] font-display tracking-tight truncate">
                  {group?.name || 'Your Crew'}
                </div>
                {canRename && (
                  <button
                    onClick={() => {
                      setNameDraft(group?.name || '');
                      setRenameError(null);
                      setEditingName(true);
                    }}
                    className="p-1 rounded-md hover:bg-white/[0.06] press"
                    aria-label="Rename crew"
                  >
                    <Pencil size={12} className="text-ink-400" />
                  </button>
                )}
              </div>
            )}
            <div className="text-ink-300 text-xs">
              {members.length} {members.length === 1 ? 'friend' : 'friends'}
            </div>
          </div>
        </div>

        {group?.invite_code && (
          <div className="relative bg-black/30 border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[9.5px] text-ink-400 uppercase tracking-[0.18em] font-semibold mb-0.5">
                Invite code
              </div>
              <div className="text-brand-gold font-mono font-bold text-lg tracking-[0.28em]">
                {group.invite_code}
              </div>
            </div>
            <CopyInviteButton code={group.invite_code} />
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <SectionLabel icon={<Trophy size={12} className="text-brand-gold" />}>
        Leaderboard
      </SectionLabel>
      <div className="space-y-2">
        {AWARDS.map((award) => {
          const sorted = [...leaderboard].sort(
            (a, b) => (b[award.key] || 0) - (a[award.key] || 0)
          );
          const winner = sorted[0];
          if (!winner || !winner[award.key]) return null;

          return (
            <div
              key={award.key}
              className="glass rounded-2xl p-3 flex items-center gap-3 press"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-gold/12 ring-1 ring-brand-gold/25 text-base">
                {award.emoji}
              </div>
              <Avatar name={winner.name} color={winner.avatar_color} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-ink-50 font-semibold text-[14.5px] truncate">
                  {winner.name}
                </div>
                <div className="text-ink-300 text-xs">{award.label}</div>
              </div>
              <div className="text-brand-gold text-[13px] font-semibold tabular">
                {award.format ? award.format(winner[award.key]) : winner[award.key]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Where is everyone */}
      <SectionLabel icon={<Globe size={12} className="text-brand-purple-light" />}>
        Where is everyone
      </SectionLabel>
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="glass rounded-2xl p-3 flex items-center gap-3 press"
          >
            <Avatar name={m.name} color={m.avatar_color} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-ink-50 font-semibold text-[14.5px] truncate">
                {m.name}
              </div>
              <div className="text-ink-300 text-xs flex items-center gap-1">
                <MapPin size={10} /> {m.city || 'Unknown'}
              </div>
            </div>
            {m.timezone && (
              <div className="text-[11px] text-ink-300 flex items-center gap-1 tabular">
                <Clock size={10} /> {localTime(m.timezone)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drink ledger */}
      {ledger.length > 0 && (
        <>
          <SectionLabel icon={<Handshake size={12} className="text-brand-gold" />}>
            Drink ledger
          </SectionLabel>
          {!hasAnyHistory ? (
            <div className="glass rounded-2xl p-4 text-center text-ink-300 text-[12.5px]">
              No rounds yet. Buy someone their first one.
            </div>
          ) : (
            <div className="space-y-2">
              {ledger.map((l) => (
                <LedgerRowCard key={l.userId} row={l} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LedgerRowCard({ row }: { row: LedgerRow }) {
  const status =
    row.net > 0
      ? { text: `${row.name} owes you ${Math.abs(row.net)}`, tone: 'positive' as const }
      : row.net < 0
      ? { text: `You owe ${row.name} ${Math.abs(row.net)}`, tone: 'negative' as const }
      : { text: 'All square', tone: 'neutral' as const };

  const badgeClasses =
    status.tone === 'positive'
      ? 'bg-brand-green/12 text-brand-green-light border-brand-green/20'
      : status.tone === 'negative'
      ? 'bg-brand-coral/12 text-brand-coral border-brand-coral/25'
      : 'bg-white/[0.05] text-ink-300 border-white/10';

  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-3">
      <Avatar name={row.name} color={row.avatarColor} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-ink-50 font-semibold text-[14.5px] truncate">{row.name}</div>
        <div className="text-ink-300 text-[11.5px] mt-0.5 tabular">
          You bought {row.boughtForThem} · They bought {row.boughtForMe}
        </div>
      </div>
      <span
        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border tabular ${badgeClasses}`}
      >
        {status.text}
      </span>
    </div>
  );
}

// ── Profile Tab ─────────────────────────────────────────────

function ProfileTab() {
  const { profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [city, setCity] = useState(profile?.city || '');

  if (!profile) return null;

  const handleSave = async () => {
    await updateProfile({ name: name.trim(), city: city.trim() || null });
    setEditing(false);
  };

  return (
    <div className="px-4 pb-40 tab-enter">
      <div
        className="relative rounded-[28px] p-6 my-4 text-center overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, rgba(139,92,246,0.18) 0%, rgba(20,20,26,0.9) 70%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -24px rgba(139,92,246,0.25)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-purple/25 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center">
          <Avatar name={profile.name} color={profile.avatar_color} size={80} />
          {editing ? (
            <div className="mt-4 w-full space-y-2.5 text-left">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
              <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
            </div>
          ) : (
            <>
              <div className="text-ink-50 font-bold text-xl mt-3 font-display tracking-tight">
                {profile.name}
              </div>
              {profile.city && (
                <div className="text-ink-300 text-sm mt-1 flex items-center justify-center gap-1">
                  <MapPin size={12} /> {profile.city}
                </div>
              )}
              <button
                onClick={() => {
                  setName(profile.name);
                  setCity(profile.city || '');
                  setEditing(true);
                }}
                className="mt-4 text-brand-purple-light text-xs font-semibold hover:text-white transition-colors"
              >
                Edit profile
              </button>
            </>
          )}
        </div>
      </div>
      <button
        onClick={signOut}
        className="w-full py-3 rounded-2xl border border-brand-coral/30 bg-brand-coral/5 text-brand-coral text-sm font-semibold mt-4 press hover:bg-brand-coral/10 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

// ── Pub Tab ────────────────────────────────────────────────

function PubTab({
  groupId,
  members,
  myProfile,
  onBuyForUser,
  onBuyForEveryone,
  getRoundRobin,
}: {
  groupId: string;
  members: Profile[];
  myProfile: Profile;
  onBuyForUser: (userId: string) => void;
  onBuyForEveryone: () => void;
  getRoundRobin: () => Promise<{
    userId: string;
    name: string;
    avatarColor: string;
    lastBoughtAt: string | null;
    isYou: boolean;
  } | null>;
}) {
  const { startSession, endSession, drinks, session } = usePubSession();
  const { questions, categorize, submitAnswer, askQuestion, fetchAnswers } =
    useQuestions(groupId);
  const [categorized, setCategorized] = useState<CategorizedQuestions | null>(null);
  const [inSession, setInSession] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<{
    theme: BarTheme;
    pubName: string;
    city: string;
  } | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [recapStats, setRecapStats] = useState<{
    durationMs: number;
    drinksCount: number;
    roundsBought: number;
    questionsAnswered: number;
  } | null>(null);
  const [roundRobin, setRoundRobin] = useState<Awaited<
    ReturnType<typeof getRoundRobin>
  >>(null);

  useEffect(() => {
    categorize().then(setCategorized);
  }, [questions]);

  // Fetch round robin whenever we come back to the entry view
  useEffect(() => {
    if (!inSession) {
      getRoundRobin().then(setRoundRobin);
    }
  }, [inSession, members.length]);

  const handleStart = async (params: {
    theme: BarTheme;
    pubName: string;
    city: string;
  }) => {
    setSessionConfig(params);
    setSessionStartedAt(Date.now());
    await startSession({
      groupId,
      pubName: params.pubName,
      city: params.city,
      barTheme: params.theme,
      roundTheme: 'pint',
    });
    setInSession(true);
  };

  // When PubSession calls onEnd, gather stats, save the review, show the recap.
  const handleEnd = async () => {
    const startedAt = sessionStartedAt ?? Date.now();
    const durationMs = Date.now() - startedAt;
    const activeSessionId = session?.id;

    // Tally rounds bought during the session window.
    let roundsBought = 0;
    let questionsAnswered = 0;
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        const startedIso = new Date(startedAt).toISOString();
        const { data: rounds } = await supabase
          .from('rounds')
          .select('id')
          .eq('from_user_id', userId)
          .eq('group_id', groupId)
          .eq('status', 'accepted')
          .gte('created_at', startedIso);
        roundsBought = rounds?.length || 0;

        if (activeSessionId) {
          const { data: answers } = await supabase
            .from('answers')
            .select('id')
            .eq('user_id', userId)
            .eq('session_id', activeSessionId);
          questionsAnswered = answers?.length || 0;
        }
      }
    } catch {
      // non-fatal; the recap can still render without these
    }

    const stats = {
      durationMs,
      drinksCount: drinks.length,
      roundsBought,
      questionsAnswered,
    };

    // Persist session_reviews + pub_sessions.ended_at
    await endSession({
      durationMs,
      drinksCount: drinks.length,
      questionsAnswered,
      questionsAsked: 0,
      challengesDone: 0,
      roundsBought,
      unansweredCount: 0,
    });

    setRecapStats(stats);
    setInSession(false);
  };

  const handleRecapClose = () => {
    setRecapStats(null);
    setSessionConfig(null);
    setSessionStartedAt(null);
  };

  if (inSession && sessionConfig && categorized) {
    return (
      <PubSession
        barTheme={sessionConfig.theme}
        pubName={sessionConfig.pubName}
        city={sessionConfig.city}
        groupId={groupId}
        members={members}
        myProfile={myProfile}
        unanswered={categorized.unanswered}
        waiting={categorized.waiting}
        completed={categorized.completed}
        onSubmitAnswer={async (qId, text) => {
          await submitAnswer(qId, session?.id || null, text);
        }}
        onAskQuestion={async (text) => {
          await askQuestion(text);
        }}
        onFetchAnswers={fetchAnswers}
        onEnd={handleEnd}
      />
    );
  }

  return (
    <>
      {roundRobin && (
        <RoundRobinCard
          next={roundRobin}
          onBuyForThem={() => onBuyForUser(roundRobin.userId)}
          onBuyForEveryone={onBuyForEveryone}
        />
      )}
      <PubModeEntry
        userCity={myProfile.city || ''}
        unansweredCount={categorized?.unanswered.length || 0}
        completedCount={categorized?.completed.length || 0}
        onStart={handleStart}
      />
      {recapStats && sessionConfig && (
        <SessionRecap
          userName={myProfile.name}
          pubName={sessionConfig.pubName}
          city={sessionConfig.city}
          barTheme={sessionConfig.theme}
          durationMs={recapStats.durationMs}
          drinksCount={recapStats.drinksCount}
          roundsBought={recapStats.roundsBought}
          questionsAnswered={recapStats.questionsAnswered}
          onClose={handleRecapClose}
        />
      )}
    </>
  );
}

// ── Main App ────────────────────────────────────────────────

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const {
    group,
    members,
    leaderboard,
    loading: groupLoading,
    createGroup,
    joinGroup,
    sendRound,
    sendRoundToEveryone,
    getPendingRounds,
    getRoundRobin,
    getDrinkLedger,
    settleUp,
    renameGroup,
  } = useGroup();

  const { askQuestion } = useQuestions(group?.id ?? null);

  const [activeTab, setActiveTab] = useState<TabId>('pub');
  const [buyingForId, setBuyingForId] = useState<string | null>(null);
  const [buyingForEveryone, setBuyingForEveryone] = useState(false);
  const [settlingWith, setSettlingWith] = useState<TabEntry | null>(null);
  const [tabRefreshKey, setTabRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [, setPendingRounds] = useState<any[]>([]);
  const [showTour, setShowTour] = useState(false);

  // First-login wizard gate: show once per user, per device
  useEffect(() => {
    if (!user || !profile || !group) return;
    if (typeof window === 'undefined') return;
    const key = `rtw-tour-done-${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowTour(true);
    }
  }, [user, profile, group]);

  const buyingForUser = buyingForId
    ? members.find((m) => m.id === buyingForId) || null
    : null;

  const fetchPending = useCallback(async () => {
    if (group) {
      const rounds = await getPendingRounds();
      setPendingRounds(rounds);
    }
  }, [group]);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  if (authLoading || (user && groupLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-5xl animate-glow-pulse drop-shadow-[0_8px_32px_rgba(139,92,246,0.55)]">
          🍻
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (!group) return <OnboardingScreen createGroup={createGroup} joinGroup={joinGroup} />;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 z-40 bg-brand-dark/70 backdrop-blur-xl">
        <div>
          <div className="font-display text-[20px] font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-brand-purple-light to-brand-gold bg-clip-text text-transparent">
              Round The World
            </span>
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            buy rounds · keep a tab · settle up
          </div>
        </div>
        <div className="w-9 h-9 rounded-full glass flex items-center justify-center shadow-glow-purple">
          <Globe size={17} className="text-brand-purple-light" />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pub' && user && profile && (
        <PubTab
          groupId={group.id}
          members={members}
          myProfile={profile}
          onBuyForUser={setBuyingForId}
          onBuyForEveryone={() => setBuyingForEveryone(true)}
          getRoundRobin={getRoundRobin}
        />
      )}
      {activeTab === 'tab' && user && profile && (
        <TabScreen
          key={tabRefreshKey}
          groupId={group.id}
          myUserId={user.id}
          myName={profile.name}
          onSettleUp={setSettlingWith}
        />
      )}
      {activeTab === 'crew' && user && (
        <CrewTab
          members={members}
          leaderboard={leaderboard}
          group={group}
          getDrinkLedger={getDrinkLedger}
          myUserId={user.id}
          renameGroup={renameGroup}
        />
      )}
      {activeTab === 'profile' && <ProfileTab />}

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Buy Round Sheet (single) */}
      {buyingForUser && profile && (
        <BuyRoundSheet
          user={buyingForUser}
          myName={profile.name}
          onClose={() => setBuyingForId(null)}
          onSend={async (drink, note) => {
            await sendRound(
              buyingForUser.id,
              drink.name,
              drink.emoji,
              drink.amount_cents,
              note
            );
            setBuyingForId(null);
            showToast(
              `Round offered! ${drink.emoji} Waiting for ${buyingForUser.name}`
            );
          }}
        />
      )}

      {/* Buy Round Sheet (everyone) */}
      {buyingForEveryone && profile && (
        <BuyRoundSheet
          user={null}
          memberCount={members.length - 1}
          myName={profile.name}
          onClose={() => setBuyingForEveryone(false)}
          onSend={async (drink, note) => {
            await sendRoundToEveryone(drink.name, drink.emoji, drink.amount_cents, note);
            setBuyingForEveryone(false);
            showToast(`Round offered to everyone! ${drink.emoji}`);
          }}
        />
      )}

      {/* Settle Up Sheet */}
      {settlingWith && profile && (
        <SettleUpSheet
          entry={settlingWith}
          myName={profile.name}
          onClose={() => setSettlingWith(null)}
          onSettle={async (amountCents, note) => {
            // Positive balance = they owe me, so they're paying me.
            // Negative balance = I owe them, so I'm paying them.
            const theyOweMe = settlingWith.amount_cents > 0;
            const fromUserId = theyOweMe ? settlingWith.userId : user.id;
            const toUserId = theyOweMe ? user.id : settlingWith.userId;
            const { error } = await settleUp({
              fromUserId,
              toUserId,
              amountCents,
              note: note || null,
            });
            setSettlingWith(null);
            if (error) {
              showToast('Could not settle. Try again.');
            } else {
              setTabRefreshKey((k) => k + 1);
              showToast('Tab settled 🤝');
            }
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-brand-green text-white px-5 py-2.5 rounded-full font-semibold text-sm z-[200] shadow-glow-green animate-fade-in-up">
          {toast}
        </div>
      )}

      {/* First login wizard */}
      {showTour && profile && group && user && (
        <FirstLoginWizard
          profileName={profile.name}
          profileAvatarColor={profile.avatar_color}
          groupName={group.name}
          inviteCode={group.invite_code}
          onAskQuestion={askQuestion}
          onComplete={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`rtw-tour-done-${user.id}`, '1');
            }
            setShowTour(false);
          }}
        />
      )}
    </>
  );
}

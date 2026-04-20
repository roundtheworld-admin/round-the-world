'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Wait for Supabase to parse the recovery hash fragment from the email link.
  // The client SDK emits a PASSWORD_RECOVERY event when that happens.
  useEffect(() => {
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        settled = true;
        setReady(true);
      }
    });

    // Also check current session for the case where the hash was consumed before
    // we had a chance to subscribe (unlikely, but safe).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setReady(true);
      }
    });

    // If nothing resolves within ~3 seconds, the link is probably invalid or expired.
    const timer = setTimeout(() => {
      if (!settled) setInvalidLink(true);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  const handleSubmit = async () => {
    setError('');
    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/'), 1200);
  };

  if (invalidLink && !ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-display text-2xl font-bold text-ink-50 mb-2 text-center">
          Reset link expired
        </h1>
        <p className="text-ink-300 text-sm mb-6 text-center max-w-xs">
          That link is no longer valid. Head back and request a new one.
        </p>
        <button
          onClick={() => router.push('/')}
          className="py-3 px-6 rounded-2xl bg-brand-purple text-white font-semibold text-sm press"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 animate-fade-in">
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full bg-brand-green/20 blur-3xl pointer-events-none" />
        <div className="text-5xl mb-4">🍻</div>
        <h1 className="font-display text-2xl font-bold text-ink-50 mb-1 text-center">
          Password updated
        </h1>
        <p className="text-ink-300 text-sm text-center">Taking you back in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative">
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="text-[56px] leading-none mb-6 text-center select-none drop-shadow-[0_8px_24px_rgba(139,92,246,0.35)]">
          🔐
        </div>
      </div>
      <h1 className="font-display text-[28px] leading-[1.1] font-bold tracking-tight text-center mb-2">
        <span className="bg-gradient-to-r from-white via-brand-purple-light to-brand-gold bg-clip-text text-transparent">
          Set a new password
        </span>
      </h1>
      <p className="text-ink-300 text-[13.5px] mb-8 text-center max-w-[280px]">
        Pick something you&apos;ll remember. Six characters minimum.
      </p>

      <div className="w-full max-w-xs space-y-3 relative">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          disabled={!ready}
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-ink-50 text-[15px] placeholder-ink-400 outline-none transition-all focus-ring disabled:opacity-40"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Confirm password"
          disabled={!ready}
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-ink-50 text-[15px] placeholder-ink-400 outline-none transition-all focus-ring disabled:opacity-40"
        />
        <button
          onClick={handleSubmit}
          disabled={!ready || loading || password.length < 6 || confirm.length < 6}
          className="relative w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] press disabled:opacity-40 disabled:pointer-events-none overflow-hidden bg-gradient-to-br from-brand-purple to-brand-purple-light shadow-glow-purple"
        >
          {loading ? 'Saving…' : ready ? 'Update password' : 'Verifying link…'}
        </button>
        {error && (
          <p className="text-brand-coral text-xs text-center animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}

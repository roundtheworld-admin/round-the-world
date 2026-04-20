'use client';

import { useState } from 'react';
import { X, Check, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import { formatCents, type TabEntry } from '@/lib/types';
import { shareSettlement } from '@/lib/whatsapp';

interface SettleUpSheetProps {
  entry: TabEntry;
  myName: string;
  onClose: () => void;
  onSettle: (amountCents: number, note?: string) => Promise<void>;
}

export default function SettleUpSheet({ entry, myName, onClose, onSettle }: SettleUpSheetProps) {
  const absAmount = Math.abs(entry.amount_cents);
  const [amount, setAmount] = useState(absAmount);
  const [note, setNote] = useState('');
  const [settled, setSettled] = useState(false);
  const [settling, setSettling] = useState(false);

  // Who owes whom
  const theyOweMe = entry.amount_cents > 0;
  const oweLabel = theyOweMe
    ? `${entry.name} owes you ${formatCents(absAmount)}`
    : `You owe ${entry.name} ${formatCents(absAmount)}`;

  const handleSettle = async () => {
    if (settling) return;
    setSettling(true);
    await onSettle(amount, note || undefined);
    setSettled(true);
    setSettling(false);
  };

  const handleShareWhatsApp = () => {
    const fromName = theyOweMe ? entry.name : myName;
    const toName = theyOweMe ? myName : entry.name;
    shareSettlement({ fromName, toName, amountLabel: formatCents(amount) });
    onClose();
  };

  if (settled) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-brand-card rounded-3xl p-10 text-center max-w-xs mx-4">
          <div className="text-6xl mb-4">🤝</div>
          <div className="text-2xl font-bold text-white mb-2">Settled!</div>
          <div className="text-gray-400 text-sm">
            {formatCents(amount)} cleared between you and {entry.name}
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="mt-5 w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <MessageCircle size={18} /> Share to WhatsApp
          </button>

          <button onClick={onClose} className="mt-2 text-gray-500 text-sm">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-brand-card rounded-t-3xl p-5 pb-8 w-full max-w-md sheet-enter">
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Avatar name={entry.name} color={entry.avatar_color} size={44} />
            <div>
              <div className="font-bold text-white text-base">Settle up</div>
              <div className="text-gray-500 text-xs">{oweLabel}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Amount */}
        <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Amount to settle</div>
        <div className="flex gap-2 mb-4">
          {/* Preset buttons */}
          {absAmount > 0 && (
            <button
              onClick={() => setAmount(absAmount)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                amount === absAmount
                  ? 'border-brand-purple bg-brand-purple/15 text-brand-purple'
                  : 'border-brand-border text-gray-400'
              }`}
            >
              Full ({formatCents(absAmount)})
            </button>
          )}
          {absAmount > 100 && (
            <button
              onClick={() => setAmount(Math.round(absAmount / 2))}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                amount === Math.round(absAmount / 2)
                  ? 'border-brand-purple bg-brand-purple/15 text-brand-purple'
                  : 'border-brand-border text-gray-400'
              }`}
            >
              Half ({formatCents(Math.round(absAmount / 2))})
            </button>
          )}
        </div>

        {/* Custom amount */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-500 text-lg">$</span>
          <input
            type="number"
            value={(amount / 100).toFixed(2)}
            onChange={(e) => setAmount(Math.round(parseFloat(e.target.value || '0') * 100))}
            className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-3.5 py-3 text-white text-lg font-bold outline-none focus:border-brand-purple/50"
          />
        </div>

        {/* Note */}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-brand-purple/50 mb-5"
        />

        <button
          onClick={handleSettle}
          disabled={amount <= 0 || settling}
          className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
            amount > 0 && !settling
              ? 'bg-gradient-to-br from-brand-green to-emerald-400 text-white active:scale-[0.98]'
              : 'bg-brand-dark text-gray-600 cursor-not-allowed'
          }`}
        >
          <Check size={18} /> {settling ? 'Settling...' : `Mark ${formatCents(amount)} as settled`}
        </button>
      </div>
    </div>
  );
}

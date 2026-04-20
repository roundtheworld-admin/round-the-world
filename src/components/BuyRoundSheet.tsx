'use client';

import { useState } from 'react';
import { X, Send, MapPin, Check, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import { DRINK_MENU, formatCents, type DrinkOption, type Profile } from '@/lib/types';
import { shareRound } from '@/lib/whatsapp';

interface BuyRoundSheetProps {
  user: Profile | null;  // null = buying for everyone
  memberCount?: number;
  myName: string;
  onClose: () => void;
  onSend: (drink: DrinkOption, note: string) => Promise<void>;
}

export default function BuyRoundSheet({ user, memberCount, myName, onClose, onSend }: BuyRoundSheetProps) {
  const isEveryone = !user;
  const recipientName = user ? user.name : 'everyone';
  const [selected, setSelected] = useState<DrinkOption | null>(null);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selected || sending) return;
    setSending(true);
    await onSend(selected, note);
    setSent(true);
    setSending(false);
  };

  const handleShareWhatsApp = () => {
    if (!selected) return;
    shareRound({
      fromName: myName,
      toName: recipientName,
      drinkName: selected.name,
      drinkEmoji: selected.emoji,
      note: note || null,
    });
    onClose();
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-brand-card rounded-3xl p-10 text-center max-w-xs mx-4">
          <div className="text-6xl mb-4">🍻</div>
          <div className="text-2xl font-bold text-white mb-2">Cheers!</div>
          <div className="text-gray-400 text-sm">
            You offered {recipientName} a {selected?.name}. They will see it next time they open the app.
          </div>
          <div className="mt-4 flex items-center justify-center gap-1 text-brand-yellow text-[13px]">
            <Check size={16} /> Pending their acceptance
          </div>

          {/* Share to WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="mt-5 w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <MessageCircle size={18} /> Share to WhatsApp
          </button>

          <button
            onClick={onClose}
            className="mt-2 text-gray-500 text-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-brand-card rounded-t-3xl p-5 pb-8 w-full max-w-md max-h-[85vh] overflow-y-auto sheet-enter">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {user ? (
              <Avatar name={user.name} color={user.avatar_color} size={44} />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-xl">🍻</div>
            )}
            <div>
              <div className="font-bold text-white text-base">
                {isEveryone ? 'Buy everyone a drink' : `Buy ${user!.name} a drink`}
              </div>
              {isEveryone ? (
                <div className="text-gray-500 text-xs">{memberCount} people in the crew</div>
              ) : user?.city ? (
                <div className="text-gray-500 text-xs flex items-center gap-1"><MapPin size={10} /> {user.city}</div>
              ) : null}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Drink Options */}
        <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2.5">Pick a drink</div>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {DRINK_MENU.map((d) => (
            <button
              key={d.name}
              onClick={() => setSelected(d)}
              className={`text-left rounded-xl p-3.5 transition-all ${
                selected?.name === d.name
                  ? 'bg-brand-purple/15 border-2 border-brand-purple'
                  : 'bg-brand-dark border border-brand-border'
              }`}
            >
              <div className="text-2xl mb-1.5">{d.emoji}</div>
              <div className="text-white text-[13px] font-semibold">{d.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">{d.price_label}</div>
            </button>
          ))}
        </div>

        {/* Note */}
        <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Add a note (optional)</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Cheers from across the world!"
          className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-brand-purple/50 mb-3"
        />

        {/* Tab impact */}
        {selected && (
          <div className="bg-brand-dark rounded-xl p-3 mb-5 border border-brand-border">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">How it works</div>
            <div className="text-white text-sm">
              {isEveryone ? (
                <>Each person gets a pending round for <span className="text-brand-green font-bold">{formatCents(selected.amount_cents)}</span>. It hits their tab when they accept.</>
              ) : (
                <>{recipientName} will get a notification. Once they accept, <span className="text-brand-green font-bold">{formatCents(selected.amount_cents)}</span> goes on their tab.</>
              )}
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!selected || sending}
          className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
            selected && !sending
              ? 'bg-gradient-to-br from-brand-purple to-brand-purple-light text-white active:scale-[0.98]'
              : 'bg-brand-dark text-gray-600 cursor-not-allowed'
          }`}
        >
          <Send size={18} /> {sending ? 'Sending...' : `Send the round${selected ? ` (${selected.price_label})` : ''}`}
        </button>
      </div>
    </div>
  );
}

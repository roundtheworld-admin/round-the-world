// ── WhatsApp Share Helpers ──────────────────────────────────
// Uses WhatsApp's deep link API to pre-fill messages.
// On mobile this opens the WhatsApp app directly.
// The user picks which chat/group to send it to.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://roundtheworld.app';

/**
 * Build a WhatsApp share URL with a pre-filled message.
 * Opens WhatsApp with the message ready to send.
 */
export function whatsappShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Open WhatsApp with a share message (works on mobile and desktop).
 */
export function shareToWhatsApp(text: string): void {
  window.open(whatsappShareUrl(text), '_blank');
}

/**
 * Share a check-in to WhatsApp.
 */
export function shareCheckin(opts: {
  checkinId: string;
  userName: string;
  drinkName: string;
  drinkEmoji: string;
  barName?: string | null;
  city?: string | null;
  rating?: number | null;
}): void {
  const location = [opts.barName, opts.city].filter(Boolean).join(', ');
  const ratingStr = opts.rating ? ` (${opts.rating}/5)` : '';
  const link = `${APP_URL}/c/${opts.checkinId}`;

  const text = [
    `${opts.drinkEmoji} ${opts.userName} is having a ${opts.drinkName}${ratingStr}`,
    location ? `at ${location}` : null,
    '',
    `Buy them a round: ${link}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  shareToWhatsApp(text);
}

/**
 * Share a round purchase to WhatsApp.
 */
export function shareRound(opts: {
  fromName: string;
  toName: string;
  drinkName: string;
  drinkEmoji: string;
  note?: string | null;
}): void {
  const text = [
    `🍻 ${opts.fromName} just bought ${opts.toName} a ${opts.drinkName} ${opts.drinkEmoji}`,
    opts.note ? `"${opts.note}"` : null,
    '',
    'Round The World -- buy rounds for friends, anywhere',
  ]
    .filter((line) => line !== null)
    .join('\n');

  shareToWhatsApp(text);
}

/**
 * Share an end-of-session recap to WhatsApp.
 */
export function shareSessionRecap(opts: {
  userName: string;
  pubName: string;
  city: string;
  themeEmoji: string;
  themeLabel: string;
  durationLabel: string;
  drinksCount: number;
  roundsBought: number;
  questionsAnswered: number;
}): void {
  const lines = [
    `🍻 ${opts.userName} wrapped a night at ${opts.pubName}${opts.city ? `, ${opts.city}` : ''}`,
    `${opts.themeEmoji} ${opts.themeLabel} · ${opts.durationLabel}`,
    '',
  ];
  const stats: string[] = [];
  if (opts.drinksCount > 0) stats.push(`${opts.drinksCount} drinks logged`);
  if (opts.roundsBought > 0) stats.push(`${opts.roundsBought} rounds bought`);
  if (opts.questionsAnswered > 0) stats.push(`${opts.questionsAnswered} questions answered`);
  if (stats.length > 0) lines.push(stats.join(' · '));

  lines.push('', 'Round The World');

  shareToWhatsApp(lines.filter((l) => l !== null).join('\n'));
}

/**
 * Share a settle-up to WhatsApp.
 */
export function shareSettlement(opts: {
  fromName: string;
  toName: string;
  amountLabel: string;
}): void {
  const text = `${opts.fromName} settled up with ${opts.toName} (${opts.amountLabel}). Tab cleared! 🤝`;
  shareToWhatsApp(text);
}

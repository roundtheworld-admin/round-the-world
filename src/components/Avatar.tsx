'use client';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
  ring?: boolean;
}

/**
 * Shifts a hex color toward black by ~18% to create a subtle top-to-bottom
 * gradient on avatars. Falls back to the original color on parse errors.
 */
function darken(hex: string, amount = 0.18): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  const d = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`;
}

export default function Avatar({
  name,
  color,
  size = 40,
  online,
  ring = true,
}: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  const bottom = darken(color, 0.22);

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className="flex items-center justify-center rounded-full text-white font-semibold"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(160deg, ${color} 0%, ${bottom} 100%)`,
          fontSize: size * 0.4,
          letterSpacing: '-0.02em',
          boxShadow: ring
            ? '0 0 0 1px rgba(255,255,255,0.08) inset, 0 6px 18px -6px rgba(0,0,0,0.6)'
            : undefined,
        }}
      >
        {initial}
      </div>
      {online !== undefined && (
        <div
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-brand-dark ${
            online ? 'bg-brand-green' : 'bg-ink-500'
          }`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}

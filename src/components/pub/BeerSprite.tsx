'use client';

interface BeerSpriteProps {
  size?: number;
  tilt?: number;
  foam?: boolean;
  color?: string;
}

export function BeerSprite({ size = 48, tilt = 0, foam = true, color = '#FDCB6E' }: BeerSpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{
      imageRendering: 'pixelated', flexShrink: 0,
      transform: `rotate(${tilt}deg)`, transition: 'transform 0.3s ease',
    }}>
      <rect x="4" y="4" width="8" height="10" fill="#fff" opacity="0.12" rx="1" />
      <rect x="4" y="4" width="8" height="10" fill="none" stroke="#8B7355" strokeWidth="0.5" rx="1" />
      <rect x="5" y={foam ? '7' : '5'} width="6" height={foam ? 6 : 8} fill={color} />
      <rect x="5" y={foam ? '7' : '5'} width="6" height="2" fill={color} opacity="0.7" />
      {foam && (
        <>
          <rect x="5" y="5" width="6" height="3" fill="#fff" opacity="0.9" />
          <rect x="4" y="5" width="1" height="2" fill="#fff" opacity="0.7" />
          <rect x="11" y="5" width="1" height="2" fill="#fff" opacity="0.7" />
          <rect x="6" y="4" width="2" height="1" fill="#fff" opacity="0.6" />
          <rect x="9" y="4" width="1" height="1" fill="#fff" opacity="0.5" />
          <rect x="6" y="6" width="1" height="1" fill="#fff" opacity="0.4" />
          <rect x="9" y="5" width="1" height="1" fill="#fff" opacity="0.3" />
        </>
      )}
      <rect x="5" y="5" width="1" height="7" fill="#fff" opacity="0.15" />
      <rect x="7" y="10" width="1" height="1" fill="#fff" opacity="0.3" />
      <rect x="9" y="8" width="1" height="1" fill="#fff" opacity="0.2" />
      <rect x="8" y="12" width="1" height="1" fill="#fff" opacity="0.25" />
      <rect x="12" y="6" width="2" height="1" fill="#8B7355" />
      <rect x="13" y="6" width="1" height="5" fill="#8B7355" />
      <rect x="12" y="10" width="2" height="1" fill="#8B7355" />
      <rect x="3" y="14" width="10" height="1" fill="#8B7355" />
    </svg>
  );
}

export function AnimatedBeerSprite({ size = 64 }: { size?: number }) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <BeerSprite size={size} />
      {/* Animated bubbles via CSS */}
      <style jsx>{`
        @keyframes bubble1 { 0%,100%{opacity:0;transform:translateY(0)} 50%{opacity:0.6;transform:translateY(-${size*0.25}px)} }
        @keyframes bubble2 { 0%,100%{opacity:0;transform:translateY(0)} 40%{opacity:0.4;transform:translateY(-${size*0.3}px)} }
      `}</style>
      <div style={{
        position: 'absolute', left: '40%', bottom: '30%',
        width: size * 0.06, height: size * 0.06, borderRadius: '50%',
        background: 'rgba(255,255,255,0.5)',
        animation: 'bubble1 2s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', left: '55%', bottom: '35%',
        width: size * 0.04, height: size * 0.04, borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)',
        animation: 'bubble2 2.5s ease-in-out infinite 0.5s',
      }} />
    </div>
  );
}

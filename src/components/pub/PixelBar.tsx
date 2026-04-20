'use client';

import type { BarTheme } from '@/lib/types';

interface PixelBarProps {
  type: BarTheme;
  width?: number;
  height?: number;
}

export default function PixelBar({ type, width = 320, height = 140 }: PixelBarProps) {
  const bars: Record<BarTheme, React.ReactNode> = {
    snug: (
      <svg viewBox="0 0 64 28" width={width} height={height} style={{ imageRendering: 'pixelated' }}>
        <rect width="64" height="28" fill="#1a0f0a" />
        <rect x="0" y="0" width="64" height="20" fill="#3d2517" />
        {[4,8,12].map(y => <rect key={y} x="0" y={y} width="64" height="1" fill="#4a2e1c" opacity="0.3" />)}
        <rect x="4" y="8" width="14" height="12" fill="#2a1810" />
        <rect x="3" y="7" width="16" height="2" fill="#4a3020" />
        <rect x="5" y="9" width="12" height="10" fill="#1a0f08" />
        <rect x="8" y="14" width="2" height="4" fill="#ff6b35" />
        <rect x="10" y="13" width="2" height="5" fill="#ff8c42" />
        <rect x="12" y="15" width="2" height="3" fill="#ff6b35" />
        <rect x="9" y="12" width="4" height="2" fill="#ffd166" />
        <rect x="24" y="16" width="36" height="4" fill="#5c3a21" />
        <rect x="24" y="16" width="36" height="1" fill="#6d4c30" />
        <rect x="28" y="10" width="2" height="6" fill="#c4a35a" />
        <rect x="27" y="9" width="4" height="2" fill="#d4b36a" />
        <rect x="34" y="10" width="2" height="6" fill="#c4a35a" />
        <rect x="33" y="9" width="4" height="2" fill="#d4b36a" />
        <rect x="42" y="13" width="3" height="4" fill="#ffd166" opacity="0.6" />
        <rect x="48" y="13" width="3" height="4" fill="#8b4513" opacity="0.6" />
        <rect x="0" y="20" width="64" height="8" fill="#2a1810" />
        {[22,25].map(y => <rect key={y} x="0" y={y} width="64" height="1" fill="#3d2517" opacity="0.3" />)}
      </svg>
    ),
    beach: (
      <svg viewBox="0 0 64 28" width={width} height={height} style={{ imageRendering: 'pixelated' }}>
        <rect width="64" height="14" fill="#ff9a56" />
        <rect width="64" height="6" fill="#ffb347" />
        <rect width="64" height="3" fill="#ffd89b" />
        <rect x="50" y="2" width="6" height="6" rx="3" fill="#fff3b0" />
        <rect x="0" y="14" width="64" height="4" fill="#4ecdc4" />
        <rect x="0" y="14" width="64" height="2" fill="#45b7aa" />
        <rect x="5" y="14" width="8" height="1" fill="#fff" opacity="0.3" />
        <rect x="0" y="18" width="64" height="10" fill="#f4d03f" />
        <rect x="14" y="10" width="36" height="10" fill="#8b6914" />
        <rect x="10" y="6" width="44" height="5" fill="#9b8b3a" />
        <rect x="12" y="5" width="40" height="2" fill="#b39f45" />
        <rect x="14" y="4" width="36" height="2" fill="#c4b050" />
        <rect x="16" y="10" width="2" height="10" fill="#6d5210" />
        <rect x="46" y="10" width="2" height="10" fill="#6d5210" />
        <rect x="24" y="8" width="2" height="3" fill="#ff6b6b" opacity="0.8" />
        <rect x="32" y="8" width="2" height="3" fill="#4ecdc4" opacity="0.8" />
        <rect x="4" y="6" width="2" height="14" fill="#6d5210" />
        <rect x="0" y="3" width="4" height="3" fill="#27ae60" />
        <rect x="2" y="2" width="6" height="3" fill="#2ecc71" />
      </svg>
    ),
    speakeasy: (
      <svg viewBox="0 0 64 28" width={width} height={height} style={{ imageRendering: 'pixelated' }}>
        <rect width="64" height="28" fill="#0d0d15" />
        <rect x="0" y="0" width="64" height="18" fill="#1a1520" />
        {[0,4,8,12].map(y => (
          <g key={y}>
            {[0,8,16,24,32,40,48,56].map((x,i) => (
              <rect key={x} x={x} y={y} width="8" height="3" fill={i%2===0?'#231c2a':'#201928'} stroke="#1a1520" strokeWidth="0.5" />
            ))}
          </g>
        ))}
        <rect x="8" y="4" width="48" height="1" fill="#3d2517" />
        <rect x="8" y="10" width="48" height="1" fill="#3d2517" />
        {[[12,'#6c5ce7'],[16,'#e17055'],[20,'#00b894'],[24,'#fdcb6e'],[30,'#e17055'],[36,'#6c5ce7'],[42,'#00b894'],[48,'#fdcb6e']].map(([x,c]) => (
          <rect key={x as number} x={x as number} y={1} width="2" height="3" fill={c as string} opacity="0.8" />
        ))}
        <rect x="0" y="16" width="64" height="3" fill="#2d1f10" />
        <rect x="0" y="16" width="64" height="1" fill="#3d2a17" />
        <rect x="20" y="0" width="1" height="3" fill="#333" />
        <rect x="19" y="3" width="3" height="2" fill="#fdcb6e" opacity="0.6" />
        <rect x="42" y="0" width="1" height="3" fill="#333" />
        <rect x="41" y="3" width="3" height="2" fill="#fdcb6e" opacity="0.6" />
        <rect x="0" y="19" width="64" height="9" fill="#0f0a15" />
      </svg>
    ),
    tokyo: (
      <svg viewBox="0 0 64 28" width={width} height={height} style={{ imageRendering: 'pixelated' }}>
        <rect width="64" height="28" fill="#0a0a1a" />
        <rect x="0" y="0" width="64" height="18" fill="#0f0f25" />
        <rect x="4" y="2" width="12" height="6" fill="#ff006e" opacity="0.15" />
        <rect x="5" y="3" width="10" height="4" rx="1" fill="none" stroke="#ff006e" strokeWidth="0.5" />
        <rect x="7" y="4" width="2" height="2" fill="#ff006e" opacity="0.8" />
        <rect x="48" y="2" width="12" height="8" fill="#00f5ff" opacity="0.1" />
        <rect x="50" y="3" width="1" height="6" fill="#00f5ff" opacity="0.7" />
        <rect x="52" y="3" width="4" height="1" fill="#00f5ff" opacity="0.7" />
        <rect x="52" y="8" width="4" height="1" fill="#00f5ff" opacity="0.7" />
        <rect x="22" y="1" width="1" height="3" fill="#333" />
        <rect x="20" y="4" width="5" height="5" rx="1" fill="#ff4444" opacity="0.7" />
        <rect x="36" y="1" width="1" height="3" fill="#333" />
        <rect x="34" y="4" width="5" height="5" rx="1" fill="#ff4444" opacity="0.7" />
        <rect x="8" y="14" width="48" height="4" fill="#2d1f10" />
        <rect x="8" y="14" width="48" height="1" fill="#3d2a17" />
        <rect x="40" y="11" width="3" height="4" fill="#ffd166" opacity="0.5" />
        <rect x="0" y="18" width="64" height="10" fill="#0a0815" />
      </svg>
    ),
  };

  return <>{bars[type] || bars.snug}</>;
}

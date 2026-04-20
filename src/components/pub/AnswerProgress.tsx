'use client';

interface AnswerProgressProps {
  answered: number;
  total: number;
  size?: number;
}

export default function AnswerProgress({ answered, total, size = 36 }: AnswerProgressProps) {
  const pct = total > 0 ? answered / total : 0;
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const isComplete = answered >= total;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#222" strokeWidth="3" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={isComplete ? '#00B894' : '#6C5CE7'}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">{answered}/{total}</span>
      </div>
    </div>
  );
}

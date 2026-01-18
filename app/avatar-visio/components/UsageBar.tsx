'use client';

import { useMemo } from 'react';

interface UsageBarProps {
  usedSeconds: number;
  quotaSeconds: number;
  className?: string;
}

export function UsageBar({ usedSeconds, quotaSeconds, className = '' }: UsageBarProps) {
  const { remainingSeconds, percentUsed, formattedRemaining, isLow } = useMemo(() => {
    const remaining = Math.max(0, quotaSeconds - usedSeconds);
    const percent = Math.min(100, (usedSeconds / quotaSeconds) * 100);

    // Formater en mm:ss
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    const formatted = `${mins}:${String(secs).padStart(2, '0')}`;

    return {
      remainingSeconds: remaining,
      percentUsed: percent,
      formattedRemaining: formatted,
      isLow: remaining < 60, // Moins d'une minute
    };
  }, [usedSeconds, quotaSeconds]);

  const getBarColor = () => {
    if (percentUsed >= 90) return 'bg-red-500';
    if (percentUsed >= 75) return 'bg-amber-500';
    return 'bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d]';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icône temps */}
      <div className={`p-2 rounded-lg ${isLow ? 'bg-red-100' : 'bg-pink-100'}`}>
        <svg
          className={`w-4 h-4 ${isLow ? 'text-red-600' : 'text-pink-600'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Barre de progression */}
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 font-medium">Temps restant</span>
          <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
            {formattedRemaining}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${getBarColor()}`}
            style={{ width: `${100 - percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Version compacte pour le header
export function UsageBarCompact({
  usedSeconds,
  quotaSeconds,
}: {
  usedSeconds: number;
  quotaSeconds: number;
}) {
  const remaining = Math.max(0, quotaSeconds - usedSeconds);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const formatted = `${mins}:${String(secs).padStart(2, '0')}`;
  const isLow = remaining < 60;

  return (
    <div
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        ${isLow ? 'bg-red-100 text-red-700' : 'bg-pink-100 text-pink-700'}
      `}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{formatted}</span>
    </div>
  );
}

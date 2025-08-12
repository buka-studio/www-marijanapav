import { useEffect, useRef, useState } from 'react';

import { cn } from '~/src/util';

import './KonamiCode.css';

import { arraySuffixPrefixMatch, CircularBuffer } from './util';

const _konamiCode = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

const konamiCode = ['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 's', 'n', 'a', 'k', 'e'];

const konamiCodeMap = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  b: 'B',
  a: 'A',
  s: 'S',
  n: 'N',
  k: 'K',
  e: 'E',
};

export default function KonamiCode({ onComplete }: { onComplete: () => void }) {
  const userInputRef = useRef(new CircularBuffer(konamiCode.length));
  const [match, setMatch] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      userInputRef.current.add(e.key);

      const match = arraySuffixPrefixMatch(userInputRef.current.getContents(), konamiCode);

      setMatch(match);

      if (match.length === konamiCode.length) {
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className={cn('font-mono text-xs text-theme-2 transition-opacity duration-300', {
        'text-text-muted opacity-70': !match.length,
      })}
      style={
        {
          '--color-active': 'oklch(var(--text-primary))',
          '--color-inactive': 'oklch(var(--text-muted))',
        } as React.CSSProperties
      }
    >
      {konamiCode.map((key, i) => (
        <span
          key={i}
          className={cn({
            'text-text-primary': i < match.length,
            'animate-blink-glow': i === match.length - 1,
          })}
        >
          {konamiCodeMap[key as keyof typeof konamiCodeMap]}
        </span>
      ))}
    </div>
  );
}

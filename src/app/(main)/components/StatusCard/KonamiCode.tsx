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

const konamiCode = ['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'g', 'a', 'm', 'e'];

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
  g: 'G',
  m: 'M',
};

export function konamiCodeToString() {
  return konamiCode.map((key) => konamiCodeMap[key as keyof typeof konamiCodeMap]).join(' ');
}

export default function KonamiCode({ onComplete }: { onComplete: () => void }) {
  const userInputRef = useRef(new CircularBuffer<string>(konamiCode.length));
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
  }, [onComplete]);

  return (
    <div
      className={cn('text-theme-2 font-mono text-xs transition-opacity duration-300', {
        'text-text-muted opacity-70': !match.length,
      })}
      style={
        {
          '--color-active': 'var(--text-primary)',
          '--color-inactive': 'var(--text-muted)',
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

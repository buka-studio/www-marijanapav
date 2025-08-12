import { cn } from '~/src/util';

export default function ScoreCounter({ score, padding = 3 }: { score: number; padding?: number }) {
  const maxScore = Math.pow(10, padding) - 1;

  if (score > maxScore) {
    return <div className="font-mono text-xs text-text-primary">{maxScore}+</div>;
  }

  const formattedNum = String(score).padStart(padding, '0');
  const firstDigitIndex = formattedNum.split('').findIndex((char) => char !== '0');

  return (
    <div className="flex font-mono text-xs">
      {formattedNum.split('').map((char, index) => {
        const isMuted = firstDigitIndex === -1 ? true : index < firstDigitIndex;
        return (
          <span
            key={index}
            className={cn('transition-colors duration-100', {
              'text-text-muted': isMuted,
              'text-text-primary': !isMuted,
            })}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

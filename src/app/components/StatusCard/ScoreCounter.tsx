import { cn } from '~/src/util';

interface PlayerScoreCounterProps {
  score: number;
  padding?: number;
}

function PlayerScoreCounter({ score, padding = 4 }: PlayerScoreCounterProps) {
  const maxScore = Math.pow(10, padding) - 1;

  if (score > maxScore) {
    return <div className="font-mono text-xs text-text-primary">{maxScore}+</div>;
  }

  const formattedNum = String(score).padStart(padding, '0');
  const firstDigitIndex = formattedNum.split('').findIndex((char) => char !== '0');

  return (
    <div className="flex">
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

interface Props {
  player1Score: number;
  player2Score?: number;
  padding?: number;
}

export default function ScoreCounter({ player1Score, player2Score, padding = 4 }: Props) {
  if (typeof player2Score !== 'undefined') {
    return (
      <div className="flex items-center gap-1 font-mono text-xs text-text-primary">
        <PlayerScoreCounter score={player1Score} padding={padding} />
        <span>:</span>
        <PlayerScoreCounter score={player2Score} padding={padding} />
      </div>
    );
  }

  return <PlayerScoreCounter score={player1Score} padding={padding} />;
}

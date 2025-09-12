'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';

import CardTitle from '~/src/components/ui/CardTitle';
import { SystemMetrics } from '~/src/lib/models';
import { remap } from '~/src/math';
import { track } from '~/src/umami/event';
import { cn } from '~/src/util';

import Card from '../Card';
import useColorTheme from '../useColorTheme';
import DotMatrixDisplay from './DotMatrixDisplay';
import KonamiCode from './KonamiCode';
import { MatrixFrameContext, MatrixRenderer } from './models';
import PongGameRenderer, { Player, PongDirection } from './PongGameRenderer';
import ScoreCounter from './ScoreCounter';
import SnakeGameRenderer, { Direction } from './SnakeGameRenderer';
import TextRenderer from './TextRenderer';
import TransitionRenderer from './TransitionRenderer';
import { getPalette } from './util';

const getMetricsText = (metrics: SystemMetrics) => {
  const memoryMB = Math.round(metrics.memory.usedBytes / 1024 / 1024);
  const memoryText = metrics.memory.usedPct === 0 ? `${memoryMB}MB` : `${metrics.memory.usedPct}%`;
  return ` CPU:${metrics.cpu.percent}% • MEMORY:${memoryText} • STATUS:${metrics.status.toUpperCase()} •`;
};

export default function StatusCard({ metrics }: { metrics: SystemMetrics }) {
  const { colorTheme } = useColorTheme();
  const { resolvedTheme } = useTheme();

  const [scoreVisible, setScoreVisible] = useState(false);
  const [score, setScore] = useState<{
    player1: number;
    player2?: number;
  }>({
    player1: 0,
    player2: 0,
  });

  // const statsText = ` VISITORS:${visitors} • PAGEVIEWS:${pageviews} • STATUS:${visitors ? 'ONLINE' : 'OFFLINE'} •`;
  const metricsText = getMetricsText(metrics);

  const displayText = metricsText;

  const dotSize = 4;
  const animationSpeed = -1;
  const dotPadding = 0.25;

  const renderers = useRef<{
    text: TextRenderer | null;
    snake: SnakeGameRenderer | null;
    pong: PongGameRenderer | null;
    transition: TransitionRenderer | null;
    active: MatrixRenderer | null;
  }>({
    text: null,
    snake: null,
    pong: null,
    active: null,
    transition: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const dotMatrixDisplayRef = useRef<{
    getFrameContext: () => MatrixFrameContext;
  }>(null);

  useEffect(() => {
    const palette = getPalette({ resolvedTheme, colorTheme });

    Object.values(renderers.current).forEach((renderer) => {
      if (renderer) {
        renderer.setPalette(palette);
      }
    });
  }, [colorTheme, resolvedTheme]);

  useEffect(() => {
    const palette = getPalette({ resolvedTheme, colorTheme });

    renderers.current.text = new TextRenderer({
      text: displayText,
      speed: animationSpeed,
      charSpacing: 1,
      glow: true,
      cellShape: 'circle',
      cellPadding: dotPadding,
      fps: 10,
      palette,
    });

    const snakeFps = Math.round(remap(containerRef.current?.clientWidth ?? 0, 0, 1280, 20, 40));

    renderers.current.snake = new SnakeGameRenderer({
      glow: true,
      fps: snakeFps,
      palette,
      onScoreChange: (score) => {
        setScore({
          player1: score,
        });
      },
      onGameOver: (score) => {
        track('snake_game_over', {
          score,
        });

        const ctx = dotMatrixDisplayRef.current?.getFrameContext();

        if (!ctx) {
          return;
        }

        renderers.current.active?.pause();

        renderers.current.transition
          ?.renderTransition(ctx, {
            durationSeconds: 0.7,
          })
          .then(() => {
            containerRef.current?.blur();

            renderers.current.active = renderers.current.text;

            renderers.current.active?.resume();

            setScoreVisible(false);
          });
      },
    });

    renderers.current.pong = new PongGameRenderer({
      palette,
      maxScore: 5,
      snapBallToGrid: true,
      cellShape: 'circle',
      computerOpponent: true,
      glow: true,
      onScoreChange: (score) => {
        setScore({
          player1: score.left,
          player2: score.right,
        });
      },
      onGameOver: (score) => {
        track('pong_game_over', {
          score,
        });

        const ctx = dotMatrixDisplayRef.current?.getFrameContext();

        if (!ctx) {
          return;
        }

        renderers.current.active?.pause();

        renderers.current.transition
          ?.renderTransition(ctx, {
            durationSeconds: 0.7,
          })
          .then(() => {
            containerRef.current?.blur();

            renderers.current.active = renderers.current.text;

            renderers.current.active?.resume();

            setScoreVisible(false);
          });
      },
    });

    renderers.current.transition = new TransitionRenderer({
      cellPadding: dotPadding,
      palette,
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const focused = document.activeElement === containerRef.current;

      const { snake } = renderers.current;
      if (!snake) {
        return;
      }

      if (renderers.current.active === renderers.current.snake && e.key !== 'Escape' && focused) {
        if (e.key === 'w' || e.key === 'ArrowUp') {
          e.preventDefault();
          snake.enqueueDirection(Direction.Up);
        } else if (e.key === 's' || e.key === 'ArrowDown') {
          e.preventDefault();
          snake.enqueueDirection(Direction.Down);
        } else if (e.key === 'a' || e.key === 'ArrowLeft') {
          e.preventDefault();
          snake.enqueueDirection(Direction.Left);
        } else if (e.key === 'd' || e.key === 'ArrowRight') {
          e.preventDefault();
          snake.enqueueDirection(Direction.Right);
        }
      }

      if (renderers.current.active === renderers.current.pong && e.key !== 'Escape' && focused) {
        if (e.key === 'w' || e.key === 'ArrowUp') {
          e.preventDefault();
          renderers.current.pong?.setKeyPress(Player.Left, PongDirection.Up);
        }

        if (e.key === 's' || e.key === 'ArrowDown') {
          e.preventDefault();
          renderers.current.pong?.setKeyPress(Player.Left, PongDirection.Down);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (renderers.current.active === null) {
      renderers.current.active = renderers.current.text;
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleRender = useCallback((ctx: MatrixFrameContext) => {
    if (!renderers.current.active) {
      return;
    }

    renderers.current.active.render.call(renderers.current.active, ctx);
  }, []);

  const handleKonamiCodeComplete = useCallback(() => {
    const ctx = dotMatrixDisplayRef.current?.getFrameContext();

    if (!ctx) {
      return;
    }

    renderers.current.active?.pause();

    renderers.current.transition
      ?.renderTransition(ctx, {
        durationSeconds: 0.7,
      })
      .then(() => {
        containerRef.current?.focus();

        renderers.current.active = renderers.current.pong;

        renderers.current.pong?.restart();
        renderers.current.active?.resume();

        const score =
          renderers.current.active === renderers.current.pong
            ? {
                player1: 0,
                player2: 0,
              }
            : {
                player1: 0,
              };

        setScoreVisible(true);
        setScore(score);
      });
  }, []);

  const [init, setInit] = useState(false);

  return (
    <Card className="">
      <div className="flex flex-col justify-between gap-5">
        <CardTitle variant="mono" className="flex items-center justify-between gap-2">
          System Monitor{' '}
          <AnimatePresence mode="popLayout">
            {scoreVisible ? (
              <motion.div
                key="score"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ScoreCounter player1Score={score.player1} player2Score={score.player2} />
              </motion.div>
            ) : (
              <motion.div
                className="hidden md:block"
                key="konami"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <KonamiCode onComplete={handleKonamiCodeComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardTitle>

        <div
          className="rounded-lg border border-panel-border bg-black p-1 focus-visible:outline-none focus-visible:outline-[0.5px] focus-visible:outline-theme-1/20"
          tabIndex={0}
          ref={containerRef}
          aria-label={displayText}
        >
          <div className="relative" style={{ height: dotSize * 7 }}>
            <DotMatrixDisplay
              className={cn(
                'absolute left-1/2 top-0 -translate-x-1/2 overflow-clip rounded opacity-0 transition-opacity duration-1000',
                {
                  'opacity-100': init,
                },
              )}
              onRender={handleRender}
              onInit={() => setInit(true)}
              rows={7}
              cellSize={dotSize}
              ref={dotMatrixDisplayRef}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

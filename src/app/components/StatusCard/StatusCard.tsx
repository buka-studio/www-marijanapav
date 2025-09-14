'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import CardTitle from '~/src/components/ui/CardTitle';
import { SystemMetrics } from '~/src/lib/models';
import { track } from '~/src/umami/event';
import { cn } from '~/src/util';

import Card from '../Card';
import DotMatrixDisplay from './DotMatrixDisplay';
import KonamiCode from './KonamiCode';
import { MatrixFrameContext } from './MatrixRenderer';
import { SceneManager, useSceneManager } from './SceneManager';
import ScoreCounter from './ScoreCounter';

const infoSlideProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const analytics = { track };

export default function StatusCard({ metrics }: { metrics: SystemMetrics }) {
  const [scoreVisible, setScoreVisible] = useState(false);
  const [score, setScore] = useState<{ player1: number; player2?: number }>({
    player1: 0,
    player2: 0,
  });
  const [init, setInit] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dotMatrixDisplayRef = useRef<{ getFrameContext: () => MatrixFrameContext }>(null);

  const handleGameEnd = useCallback(() => {
    setScoreVisible(false);
  }, []);

  const handleGameSelect = useCallback((manager: SceneManager, game: 'snake' | 'pong') => {
    setScoreVisible(true);
    const initialScore = game === 'pong' ? { player1: 0, player2: 0 } : { player1: 0 };
    setScore(initialScore);
  }, []);

  const { sceneManager, activeRenderer } = useSceneManager({
    metrics,
    dotMatrixDisplayRef,
    containerRef,
    onScoreChange: setScore,
    onGameEnd: handleGameEnd,
    onGameSelect: handleGameSelect,
    analytics,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !sceneManager) {
      return;
    }

    const handleFocus = () => sceneManager.setupActiveControls();
    const handleBlur = () => sceneManager.cleanupActiveControls();

    container.addEventListener('focus', handleFocus);
    container.addEventListener('blur', handleBlur);
    return () => {
      container.removeEventListener('focus', handleFocus);
      container.removeEventListener('blur', handleBlur);
    };
  }, [sceneManager]);

  const handleRender = useCallback(
    (ctx: MatrixFrameContext) => {
      activeRenderer?.render.call(activeRenderer, ctx);
    },
    [activeRenderer],
  );

  const handleKonamiCodeComplete = useCallback(() => {
    sceneManager?.switchTo('menu');
    containerRef.current?.focus();
  }, [sceneManager]);

  return (
    <Card className="">
      <div className="flex flex-col justify-between gap-5">
        <CardTitle variant="mono" className="flex items-center justify-between gap-2">
          System Monitor{' '}
          <AnimatePresence mode="popLayout">
            {scoreVisible ? (
              <motion.div key="score" {...infoSlideProps}>
                <ScoreCounter player1Score={score.player1} player2Score={score.player2} />
              </motion.div>
            ) : (
              <motion.div className="hidden md:block" key="konami" {...infoSlideProps}>
                <KonamiCode onComplete={handleKonamiCodeComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardTitle>

        <div
          className="rounded-lg border border-panel-border bg-black p-1 focus-visible:outline-none focus-visible:outline-[0.5px] focus-visible:outline-theme-1/20"
          tabIndex={0}
          ref={containerRef}
          aria-label="System status display"
        >
          <div className="relative" style={{ height: 4 * 7 }}>
            <DotMatrixDisplay
              className={cn(
                'absolute left-1/2 top-0 -translate-x-1/2 overflow-clip rounded opacity-0 transition-opacity duration-1000',
                { 'opacity-100': init },
              )}
              onRender={handleRender}
              onInit={() => setInit(true)}
              rows={7}
              cellSize={4}
              ref={dotMatrixDisplayRef}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import Battery from '~/public/stickers/Battery.svg';
import Buka from '~/public/stickers/Buka.svg';
import CmdKey from '~/public/stickers/Cmd-key.svg';
import Copyright from '~/public/stickers/Copyright.svg';
import FigmaExport from '~/public/stickers/Figma-export.svg';
import LoremIpsum from '~/public/stickers/Lorem-ipsum.svg';
import OptionKey from '~/public/stickers/Option-key.svg';
import Stamp1 from '~/public/stickers/Stamp1.svg';
import Stamp2 from '~/public/stickers/Stamp2.svg';
import Zet from '~/public/stickers/Zet.svg';
import Button from '~/src/components/ui/Button';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn } from '~/src/util';

const stickers = [
  Stamp1,
  Zet,
  CmdKey,
  OptionKey,
  Battery,
  Copyright,
  Buka,
  FigmaExport,
  Stamp2,
  LoremIpsum,
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(min: number, max: number, value: number) {
  return Math.min(Math.max(value, min), max);
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function DraggableStickers({
  rotationSeed,
  positionSeed,
}: {
  rotationSeed: number;
  positionSeed: number;
}) {
  const constraintsRef = useRef(null);

  const stickerRefs = useRef(new Map<number, { e: HTMLElement; z: number; dragging: boolean }>());
  const isMdScreen = useMatchMedia('(min-width: 768px) and (max-width: 1024)');
  const isSmScreen = useMatchMedia('(max-width: 768px)');
  const controls = useAnimationControls();

  const [resetEnabled, setResetEnabled] = useState(false);

  const stickerMotionVariants = useMemo(() => {
    return stickers.map((_, i) => {
      const len = stickers.length;
      const isInFirstHalf = i < Math.floor(stickers.length / 2);
      const t = i / (len - 1);
      const isOdd = i & 1;

      let initialX: number;
      let initialY: number;
      if (isSmScreen) {
        initialX = Math.sin(lerp(-1, 1, t)) * 150 * -1;
        initialY = (isOdd ? -1 : 1) * randInt(20, 50);
      } else {
        initialX =
          Math.abs(Math.sin(lerp(-1, 1, t))) *
          (isMdScreen ? 150 : randInt(300, 500)) *
          (isInFirstHalf ? -1 : 1);

        initialY = (isOdd ? -1 : 1) * randInt(20, 50);
      }

      const initRotate = Math.random() * (Math.sign(Math.sin(Math.random() * 100)) * 30);
      const initScale = isSmScreen ? 0.7 : isMdScreen ? 0.75 : 1.25;

      const variants = {
        hidden: {
          opacity: 0,
        },
        initial: {
          rotate: initRotate,
          x: initialX,
          y: initialY,
          opacity: 1,
          scale: initScale,
        },
      };

      return variants;
    });
  }, [isMdScreen, isSmScreen]);

  function handleDragStart(i: number) {
    const newMaxI = Math.max(...Array.from(stickerRefs.current.values()).map(({ z }) => z)) + 1;

    const target = stickerRefs.current.get(i);

    if (target?.e) {
      target.e.style.setProperty('--z', newMaxI.toString());

      stickerRefs.current.set(i, {
        ...target,
        z: newMaxI,
        dragging: true,
      });
    }

    setResetEnabled(false);
  }

  function handleDragEnd(i: number) {
    const target = stickerRefs.current.get(i);

    if (target) {
      controls.start({
        scale: stickerMotionVariants[i].initial.scale,
      });
    }
  }

  function handleDragTransitionEnd(i: number) {
    const target = stickerRefs.current.get(i);

    if (target) {
      stickerRefs.current.set(i, {
        ...target,
        dragging: false,
      });
    }

    const isDraggingAny = Array.from(stickerRefs.current.values()).some(({ dragging }) => dragging);

    if (!isDraggingAny) {
      setResetEnabled(true);
    }
  }

  useEffect(() => {
    controls.start('initial');
  }, [controls]);

  function handleResetStickers() {
    controls.start('initial');
  }

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        ref={constraintsRef}
      />
      <div
        style={
          {
            '--rotation-seed': rotationSeed,
            '--position-seed': positionSeed,
            '--items': stickers.length,
          } as CSSProperties
        }
        className="relative z-[1] grid grid-cols-[clamp(200px,50vw,300px)] grid-rows-[auto] justify-center"
      >
        <div
          className={cn('m-auto inline-flex transition-all duration-300', {
            'opacity-0': !resetEnabled,
            'opacity-100': resetEnabled,
          })}
        >
          <Button onClick={handleResetStickers} disabled={!resetEnabled}>
            Reset Stickers
          </Button>
        </div>

        {stickers.map((Sticker, i) => {
          const variants = stickerMotionVariants[i];
          const initScale = variants.initial.scale as number;

          return (
            <motion.div
              className="sticker group pointer-events-auto absolute z-[var(--z)] col-start-1
       col-end-1 row-start-1 row-end-1 inline-flex origin-center cursor-grab items-center justify-center"
              key={i}
              drag
              ref={(e) => {
                stickerRefs.current.set(i, {
                  z: 1,
                  e: e!,
                  dragging: false,
                });
              }}
              initial="hidden"
              animate={controls}
              variants={variants}
              transition={{
                y: { duration: 1.2, type: 'spring', bounce: Math.random() * 0.6 },
                x: { duration: 1.2, type: 'spring', bounce: Math.random() * 0.6 },
                opacity: { duration: 0.5 },
              }}
              whileDrag={{ scale: initScale * 1.2, cursor: 'grabbing', rotate: 0 }}
              onDragStart={() => handleDragStart(i)}
              dragConstraints={constraintsRef}
              dragTransition={{ bounceStiffness: 100, bounceDamping: 10, power: 0.4 }}
              onDragTransitionEnd={() => handleDragTransitionEnd(i)}
              onDragEnd={() => handleDragEnd(i)}
            >
              <Sticker />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

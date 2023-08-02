'use client';

import { motion } from 'framer-motion';
import { CSSProperties, useRef } from 'react';

import Battery from '~/public/stickers/Battery.svg';
import Buka from '~/public/stickers/Buka.svg';
import CmdKey from '~/public/stickers/Cmd-key.svg';
import CoffeeMachine from '~/public/stickers/Coffee-machine.svg';
import Copyright from '~/public/stickers/Copyright.svg';
import FigmaExport from '~/public/stickers/Figma-export.svg';
import FigmaFrame from '~/public/stickers/Figma-frame.svg';
import LoremIpsum from '~/public/stickers/Lorem-ipsum.svg';
import OptionKey from '~/public/stickers/Option-key.svg';
import Stamp1 from '~/public/stickers/Stamp1.svg';
import Stamp2 from '~/public/stickers/Stamp2.svg';
import Zet from '~/public/stickers/Zet.svg';
import useMatchMedia from '~/src/hooks/useMatchMedia';

const stickers = [
  Stamp1,
  FigmaFrame,
  Zet,
  CmdKey,
  OptionKey,
  CoffeeMachine,
  Battery,
  Copyright,
  LoremIpsum,
  Buka,
  FigmaExport,
  Stamp2,
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

  const stickerRefs = useRef(new Map<HTMLElement, { z: number }>());
  const isMdScreen = useMatchMedia('(min-width: 768px) and (max-width: 1024)');
  const isSmScreen = useMatchMedia('(max-width: 768px)');

  function handleDragStart(e: MouseEvent) {
    const newMaxI = Math.max(...Array.from(stickerRefs.current.values()).map(({ z }) => z)) + 1;

    const target = e.target as HTMLElement;
    const container = target.classList.contains('sticker')
      ? target
      : target.closest('svg')?.parentElement;

    if (container) {
      container.style.setProperty('--z', newMaxI.toString());
    }

    stickerRefs.current.set(container!, { z: newMaxI });
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
        {stickers.map((Sticker, i) => {
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

          const initScale = isSmScreen ? 0.7 : isMdScreen ? 0.75 : 1.25;
          const initRotate = Math.random() * (Math.sign(Math.sin(Math.random() * 100)) * 30);

          return (
            <motion.div
              className="sticker group pointer-events-auto absolute z-[var(--z)] col-start-1
       col-end-1 row-start-1 row-end-1 inline-flex origin-center cursor-grab items-center justify-center"
              key={i}
              drag
              ref={(e) => {
                stickerRefs.current.set(e!, { z: 1 });
              }}
              initial={{
                opacity: 0,
              }}
              animate={{
                rotate: initRotate,
                x: initialX,
                y: initialY,
                opacity: 1,
                scale: initScale,
              }}
              transition={{
                y: { duration: 1.2, type: 'spring', bounce: Math.random() * 0.6 },
                x: { duration: 1.2, type: 'spring', bounce: Math.random() * 0.6 },
                opacity: { duration: 0.5 },
              }}
              whileDrag={{ scale: initScale * 1.2, cursor: 'grabbing', rotate: 0 }}
              onDragStart={handleDragStart}
              dragConstraints={constraintsRef}
              dragTransition={{ bounceStiffness: 100, bounceDamping: 10, power: 0.4 }}
            >
              <Sticker />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

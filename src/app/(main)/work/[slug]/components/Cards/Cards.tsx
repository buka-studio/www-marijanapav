'use client';

import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';

import AboutSVG from '~/public/work/illustrated-cards/About.svg';
import ContactSVG from '~/public/work/illustrated-cards/Contact.svg';
import WorkSVG from '~/public/work/illustrated-cards/Work.svg';
import GridBackground from '~/src/components/GridBackground';
import { JoystickIcon } from '~/src/components/icons';
import Button from '~/src/components/ui/Button';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn } from '~/src/util';

import CardEffects from './CardEffects';

import './Cards.css';

type Swipeable = {
  onSwiped: () => void;
  constrained?: boolean;
  i: number;
};

export function SwipeableCard({
  children,
  onSwiped,
  constrained,
  i,
  ...props
}: Swipeable & ComponentProps<typeof motion.button>) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const controls = useAnimation();

  const trajectory = useRef<{
    v: number;
    direction: 'left' | 'right' | undefined;
  }>({
    v: 0,
    direction: undefined,
  });

  function setTrajectory() {
    const velocity = x.getVelocity();
    const direction = velocity >= 1 ? 'right' : velocity <= -1 ? 'left' : undefined;
    if (velocity === 0 || direction === undefined) {
      return;
    }

    trajectory.current = { v: velocity, direction };
  }

  function flyAway(minVelocity: number) {
    const flyAwayDistance = (direction: 'left' | 'right') => {
      const parentWidth = cardRef.current?.parentElement?.getBoundingClientRect()?.width;
      if (!parentWidth) {
        return 0;
      }
      const childWidth = cardRef.current!.getBoundingClientRect().width;

      return direction === 'left'
        ? -parentWidth / 2 - childWidth / 2
        : parentWidth / 2 + childWidth / 2;
    };

    if (
      trajectory.current.direction &&
      Math.abs(trajectory.current.v) > minVelocity &&
      cardRef.current
    ) {
      controls
        .start({
          x: flyAwayDistance(trajectory.current.direction) * 1.2,
        })
        .then(onSwiped);
    }
  }

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      scale: 1.1,
      transition: {
        delay: 0.1 * i,
        type: 'spring',
        stiffness: 100,
      },
    });
  }, [controls, i]);

  return (
    <motion.button
      {...props}
      animate={controls}
      dragConstraints={constrained && { left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      ref={cardRef}
      style={{
        ...(props.style || {}),
        x,
        y: 50,
        opacity: 0,
      }}
      onDrag={setTrajectory}
      onDragEnd={() => flyAway(1000)}
      whileTap={{ scale: 1.2, rotate: 0 }}
      onTouchStart={(e) => {
        (e.currentTarget as HTMLButtonElement)?.focus();
      }}
      onTouchEnd={(e) => {
        (e.currentTarget as HTMLButtonElement)?.blur();
      }}
      drag
    >
      {children}
    </motion.button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => {
        const el = e.currentTarget;
        const bcr = el.getBoundingClientRect();
        const x = clamp(0, el.clientWidth, e.clientX - bcr.left);
        const y = clamp(0, el.clientHeight, e.clientY - bcr.top);

        el.style.setProperty(`--mouse-x`, `${x}`);
        el.style.setProperty(`--mouse-y`, `${y}`);
      }}
      className={cn('card flex overflow-hidden rounded-2xl', className)}
    >
      <div className="relative">
        <div className="illustration">{children}</div>
        <div className="foil absolute -top-px left-0 h-full w-full"></div>
        <div className="reflection absolute top-0 left-0 h-full w-full rounded-2xl"></div>
      </div>
    </div>
  );
}

function clamp(min: number, max: number, value: number) {
  return Math.min(Math.max(value, min), max);
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const itemVariants = (i: number) => ({
  shown: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      type: 'spring' as const,
      stiffness: 50,
      delay: 0.1 * i,
    },
  },
  hidden: {
    opacity: 0,
    y: 100,
    transition: {
      duration: 0.35,
      type: 'spring' as const,
      stiffness: 50,
      delay: 0.1 * i,
    },
  },
});

const cards = ['work', 'about', 'contact'] as const;
type Card = (typeof cards)[number];

const illustrations: Record<Card, ReactNode> = {
  // surprise: <SurpriseSVG />,
  contact: <ContactSVG />,
  about: <AboutSVG />,
  work: <WorkSVG />,
};

const rotations = {
  surprise: 0,
  contact: -10,
  about: 10,
  work: 5,
};

function findLastIndex(arr: Array<any>, predicate: (item: any) => boolean) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return i;
    }
  }
  return -1;
}

function CardStack({ effect }: { effect?: CardEffect }) {
  const [stack, setStack] = useState<Array<Card | null>>([...cards]);

  const hoverAvailable = useMatchMedia('(hover: hover) and (min-width: 950px)', false);

  useEffect(() => {
    const allSwiped = stack.every((c) => !c);
    const someSwiped = stack.some((c) => !c);

    if (allSwiped || (someSwiped && hoverAvailable)) {
      setStack([...cards]);
    }
  }, [stack, hoverAvailable]);

  return (
    <motion.div
      className="cards relative z-1 flex h-full w-full flex-1 items-center justify-center gap-2"
      initial="hidden"
      animate={effect ? 'hidden' : 'shown'}
    >
      {stack.map((c, i) => {
        if (!c) {
          return null;
        }

        const Illustration = illustrations[c];

        const active = findLastIndex(stack, (c) => c) === i;

        return !hoverAvailable ? (
          <SwipeableCard
            key={c + i}
            constrained
            className={cn(
              'highlight-transparent pointer-events-none absolute z-1 last:pointer-events-auto',
            )}
            i={i}
            onSwiped={() => {
              setStack((wip) => {
                const w = [...wip];
                w[i] = null;

                return w;
              });
            }}
            style={{ rotate: rotations[c] }}
          >
            <Card
              className={cn(c, 'in-[.bw]:saturate-0', {
                'blur-[1px] grayscale-[0.5]': !active,
                'blur-none grayscale-0': active,
              })}
            >
              {Illustration}
            </Card>
          </SwipeableCard>
        ) : (
          <motion.button
            variants={itemVariants(i)}
            transition={{
              delay: 0.2 * i,
            }}
            className="z-1"
            key={c + i}
          >
            <Card className={cn(c, 'in-[.bw]:saturate-0')}>{Illustration}</Card>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

const cardEffects = ['solitaire'] as const; //, "memory", "house-of-cards"] as const;
type CardEffect = (typeof cardEffects)[number];

export default function Cards() {
  const [effect, setEffect] = useState<CardEffect | undefined>(undefined);
  const availableEffects = useRef([...cardEffects]);

  function pickEffect() {
    if (availableEffects.current.length === 0) {
      availableEffects.current = [...cardEffects];
    }

    const index = randomInt(0, availableEffects.current.length - 1);
    availableEffects.current.splice(index, 1);

    setEffect(cardEffects[index]);
  }

  function closeEffect() {
    setEffect(undefined);
  }
  return (
    <div className="bw cards-container relative h-full w-full transform-gpu overflow-hidden rounded-[20px]">
      <GridBackground
        className="grid-bg pointer-events-none absolute -top-px -left-px h-[calc(100%+2px)] w-[calc(100%+2px)] text-[rgba(0,0,0,0.05)] in-[.theme-dark]:text-[rgba(200,200,200,0.05)]"
        n={400}
      />
      <CardStack effect={effect} />
      <CardEffects onClose={closeEffect} effect={effect} />
      <Button
        onClick={pickEffect}
        aria-label="Pick a card effect"
        iconLeft={<JoystickIcon className="h-6 w-6" />}
        className="text-text-primary absolute right-5 bottom-5 z-1"
      />
    </div>
  );
}

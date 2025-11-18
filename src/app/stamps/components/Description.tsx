'use client';

import { AnimatePresence, motion, MotionProps, Variants } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import FocusLock from 'react-focus-lock';

import { cn } from '~/src/util';

import { useStampStore } from '../store';
import EmptyState from './EmptyState';
import MetadataTable from './MetadataTable';

type TypingAnimationOptions = {
  text: string;
  speed?: number;
  delay?: number;
  splitter?: (t: string) => string[];
  onAnimationEnd?: () => void;
  disabled?: boolean;
};

const useTypingAnimation = ({
  text,
  speed = 50,
  delay = 0,
  splitter = (t) => [...t],
  onAnimationEnd,
  disabled,
}: TypingAnimationOptions) => {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const delayedRef = useRef(false);

  const textParts = useMemo(() => splitter(text), [text, splitter]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    if (currentIndex < textParts.length) {
      const timer = setTimeout(
        () => {
          delayedRef.current = true;

          setDisplayedText((prev) => [...prev, textParts[currentIndex]]);
          setCurrentIndex((prev) => prev + 1);
        },
        (delayedRef.current ? delay : 0) + speed + speed * (Math.random() - 0.5),
      );

      return () => clearTimeout(timer);
    }

    if (currentIndex === textParts.length && textParts.length > 0) {
      onAnimationEnd?.();
    }
  }, [textParts, currentIndex, speed, onAnimationEnd, disabled, delay]);

  return displayedText;
};

const AnimatedText = ({ text, className }: { text: string; className?: string }) => {
  const displayedText = useTypingAnimation({
    text: text || '',
    speed: 50,
  });

  return displayedText.map((text, i) => (
    <motion.span
      key={i}
      initial={{ opacity: 0, filter: 'blur(6px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      className={className}
    >
      {text}
    </motion.span>
  ));
};

const slideInVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5 },
  },
};

const fadeInProps: MotionProps = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.35 },
};

export default function Description({ className }: { className?: string }) {
  const selectedStampId = useStampStore((s) => s.selectedStampId);
  const [animate, setAnimate] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (selectedStampId) {
      setAnimate(true);
      setAnimated(true);
    }
  }, [selectedStampId]);

  return (
    <div className={cn('flex flex-col gap-5 font-libertinus text-stone-700 lg:gap-9', className)}>
      <motion.nav
        {...fadeInProps}
        transition={{ duration: 0.35, delay: 1.5 }}
        className={cn('relative')}
        aria-label="Breadcrumb"
      >
        <ul className="text-s group/nav flex items-center tracking-tight text-stone-600">
          <li>
            <Link
              href="/"
              className="focus-dashed flex items-baseline gap-1 px-1 hover:text-stone-800"
            >
              <span>marijanapav</span>
            </Link>
          </li>
          <li aria-hidden="true" className="text-stone-600 group-focus-within/nav:opacity-0">
            /
          </li>
          <li>
            <Link
              href="/stamps"
              aria-current="page"
              className="focus-dashed flex items-baseline gap-1 px-1 text-stone-600 hover:text-stone-800"
            >
              <span>digital stamp collection</span>
            </Link>
          </li>
        </ul>
      </motion.nav>
      <h1>
        <AnimatedText
          text="The weight of paper"
          className="text-3xl tracking-tight lg:text-[2.5rem]"
        />{' '}
      </h1>
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              when: 'beforeChildren',
              delay: 1.25,
              staggerChildren: 0.15,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5 lg:gap-5"
      >
        <motion.p variants={slideInVariants} className="text-pretty">
          Paying homage to my grandpa&apos;s lifelong passion for philately, by recreating his
          stamps in a digital form, exploring the blend of art, history, and typography and bringing
          it online for a new audience to enjoy.
        </motion.p>

        <motion.p variants={slideInVariants} className="text-prety">
          Each stamp tells a story of a piece of history, a moment in time. Some recreations are
          inspired by the stamps I have in my family&apos;s archive, and some by global finds I
          stumbled upon. Together, they celebrate the enduring craft of stamp design — and the
          stories that linger in a miniature piece of <span className="italic">paper</span>.
        </motion.p>

        <motion.div
          className="lg:hidden"
          variants={slideInVariants}
          onAnimationComplete={() => setAnimate(true)}
        >
          <EmptyState
            className="mx-auto mt-4 max-w-xl md:mt-10"
            animate={animate}
            shouldAnimate={!animated}
            onAnimationComplete={() => setAnimated(true)}
          />
        </motion.div>

        <motion.div
          className="mt-5 hidden lg:grid"
          variants={slideInVariants}
          onAnimationComplete={() => setAnimate(true)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {selectedStampId ? (
              <motion.div key="metadata-table" {...fadeInProps}>
                <FocusLock group={`stamp-${selectedStampId}`}>
                  <MetadataTable />
                </FocusLock>
              </motion.div>
            ) : (
              <motion.div key="empty-state" {...fadeInProps}>
                <EmptyState
                  className="mx-auto max-w-xl transform-gpu"
                  animate={animate}
                  shouldAnimate={!animated}
                  onAnimationComplete={() => setAnimated(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

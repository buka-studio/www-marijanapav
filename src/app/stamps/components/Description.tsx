import { motion, Variants } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '~/src/util';

import { Stamp } from '../models';

import './Description.css';

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

const AnimatedText = ({ text }: { text: string }) => {
  const displayedText = useTypingAnimation({
    text: text || '',
    speed: 50,
  });

  return displayedText.map((text, i) => (
    <motion.span
      key={i}
      initial={{ opacity: 0, filter: 'blur(6px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
    >
      {text}
    </motion.span>
  ));
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5 },
  },
};

export default function Description({
  className,
}: {
  selectedStamp: Stamp | null;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-9 text-stone-700', className)}>
      <h1>
        <AnimatedText text="A Journey Through Stamps:" />{' '}
        <motion.span
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 1.75 }}
        >
          Reimagined
        </motion.span>
      </h1>
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              when: 'beforeChildren',
              delay: 1.85,
              staggerChildren: 0.15,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-9"
      >
        <motion.p variants={fadeInVariants}>
          Paying homage to my grandpa&apos;s lifelong passion for philately, by recreating his
          stamps in a digital form, exploring the blend of art, history, and typography and bringing
          it online for a new audience to enjoy.
        </motion.p>

        <motion.p variants={fadeInVariants}>
          Each stamp tells a story—of a moment in history, a place, or an idea. This collection is
          my way of bridging the past and present, honoring my grandfather’s stamp collection, which
          was later passed down to my mom. Now, I’m adding my own creative twist. Whether it’s a
          direct recreation of an original or a design inspired by a stamp I stumbled upon, every
          piece carries a narrative of exploration and admiration for philately.
        </motion.p>

        <motion.p variants={fadeInVariants}>
          Many of these stamps are rooted in history, recreated from designs found in my
          grandfather’s and moms collection or discovered during my research. Others are purely
          imaginative—a tribute to the art of stamp design.
        </motion.p>
      </motion.div>
    </div>
  );
}

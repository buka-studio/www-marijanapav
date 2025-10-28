'use client';

import { motion } from 'framer-motion';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

function SlideButton({ children, className, ...rest }: ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      className={cn(
        'rounded-full p-2 transition-colors duration-200 hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none disabled:cursor-not-allowed',
        className,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', duration: 0.3 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export default SlideButton;

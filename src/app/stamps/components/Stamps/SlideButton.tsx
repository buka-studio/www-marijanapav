'use client';

import { motion } from 'framer-motion';
import { ComponentProps, forwardRef } from 'react';

const SlideButton = forwardRef<HTMLButtonElement, ComponentProps<typeof motion.button>>(
  function Button({ children, className, ...rest }, ref) {
    return (
      <motion.button
        className="rounded-full p-2 transition-colors duration-200 hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        ref={ref}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);

export default SlideButton;

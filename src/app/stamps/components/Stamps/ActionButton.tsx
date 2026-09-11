import { motion } from 'framer-motion';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

export function DrawnActionButton({
  children,
  className,
  ...props
}: ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      className={cn(
        'focus-dashed text-stone-700 outline-offset-4 [&:disabled>*]:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

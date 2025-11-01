import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ComponentProps } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/src/components/ui/Tooltip';
import { cn } from '~/src/util';

export function ActionButton({
  children,
  tooltipLabel,
  className,
  ...props
}: ComponentProps<typeof motion.button> & { tooltipLabel: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          className={cn(
            'rounded-full p-2 text-stone-800 transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
            className,
          )}
          {...props}
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

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

export function SlideButton({
  children,
  className,
  ...rest
}: ComponentProps<typeof motion.button>) {
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

export function ToggleLoupeButton({
  className,
  pressed,
  onPress,
  disabled,
}: {
  className?: string;
  pressed: boolean;
  onPress: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {pressed ? (
        <SlideButton
          onClick={() => onPress(!pressed)}
          key="zoomed"
          aria-label="Hide loupe"
          className={className}
        >
          <MagnifyingGlassMinusIcon className="h-5 w-5" />
        </SlideButton>
      ) : (
        <SlideButton
          onClick={() => onPress(!pressed)}
          key="zoomed-out"
          disabled={disabled}
          className={cn('group', className)}
          aria-label="Show loupe"
        >
          <MagnifyingGlassPlusIcon className="h-5 w-5 group-disabled:opacity-50" />
        </SlideButton>
      )}
    </AnimatePresence>
  );
}

import {
  CheckCircleIcon,
  PaperPlaneTiltIcon,
  PencilLineIcon,
  SmileyMeltingIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

import { SketchbookState } from './models';

const initialVariants = {
  collapsed: {
    opacity: 0,
    width: 0,
    filter: 'blur(5px)',
  },
  expanded: {
    opacity: 1,
    width: 'auto',
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(5px)',
  },
};

const stateVariants = {
  initial: {
    y: 10,
    opacity: 0,
    filter: 'blur(5px)',
  },
  animate: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: {
    y: -10,
    opacity: 0,
    filter: 'blur(5px)',
  },
};

const StateButtonContent = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => {
  return (
    <motion.span className="flex items-center gap-2" layout="position">
      <motion.span
        layout="position"
        variants={stateVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {icon}
      </motion.span>
      <motion.span
        className="overflow-hidden whitespace-nowrap"
        layout="position"
        variants={stateVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          delay: 0.1,
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
};

export default function SketchbookButton({
  state,
  hasDrawn,
  onClick,
}: {
  state: SketchbookState;
  hasDrawn: boolean;
  onClick: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const expanded = isExpanded || state === 'drawing';

  const disabled = (state === 'drawing' && !hasDrawn) || state === 'sending';

  return (
    <motion.button
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      onFocus={() => setIsExpanded(true)}
      onBlur={() => setIsExpanded(false)}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      layout
      disabled={disabled}
      className="flex items-center gap-2 overflow-hidden rounded-full px-2 text-text-primary disabled:opacity-50"
    >
      <AnimatePresence mode="wait">
        {(state === 'initial' || (state === 'drawing' && !hasDrawn)) && (
          <motion.span className="flex items-center gap-2" layout key="initial">
            <motion.span
              variants={stateVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
            >
              <PencilLineIcon className="h-5 w-5" />
            </motion.span>
            <motion.span
              className="overflow-hidden whitespace-nowrap"
              layout
              initial="collapsed"
              variants={initialVariants}
              animate={expanded ? 'expanded' : 'collapsed'}
              exit="exit"
              transition={{
                delay: 0.1,
              }}
            >
              Draw something
            </motion.span>
          </motion.span>
        )}
        {state === 'drawing' && hasDrawn && (
          <StateButtonContent icon={<PaperPlaneTiltIcon className="h-5 w-5" />} key="drawing">
            Send
          </StateButtonContent>
        )}
        {state === 'sending' && (
          <StateButtonContent
            icon={<SpinnerGapIcon className="h-5 w-5 animate-spin" />}
            key="sending"
          >
            Sending...
          </StateButtonContent>
        )}
        {state === 'sent' && (
          <StateButtonContent icon={<CheckCircleIcon className="h-5 w-5" />} key="sent">
            Sent!
          </StateButtonContent>
        )}
        {state === 'error' && (
          <StateButtonContent icon={<SmileyMeltingIcon className="h-5 w-5" />} key="error">
            Uh-oh, try again!
          </StateButtonContent>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

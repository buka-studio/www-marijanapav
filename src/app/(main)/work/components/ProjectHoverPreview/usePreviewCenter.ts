import { useMotionValue, useReducedMotion, useSpring, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';

import { PREVIEW_SPRING } from './params';

const SNAP_SPRING = { duration: 0 } as const;

export function usePreviewCenter(centerIndex: number): MotionValue<number> {
  const prefersReducedMotion = useReducedMotion();
  const target = useMotionValue(centerIndex);
  const center = useSpring(target, prefersReducedMotion ? SNAP_SPRING : PREVIEW_SPRING);

  useEffect(() => {
    if (prefersReducedMotion) {
      target.jump(centerIndex);
      center.jump(centerIndex);
      return;
    }

    target.set(centerIndex);
  }, [center, centerIndex, prefersReducedMotion, target]);

  return center;
}

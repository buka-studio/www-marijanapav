import { MotionProps } from 'framer-motion';

import useMatchMedia from '~/src/hooks/useMatchMedia';

export const stampFadeInProps: MotionProps = {
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  variants: {
    initial: ({ i = 0 } = {}) => ({
      opacity: 0,
      transform: 'translateY(8px) scale(0.97)',
      transition: { delay: i * 0.04, duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    }),
    animate: ({ i = 0, scale = 1 } = {}) => ({
      opacity: 1,
      transform: `translateY(0px) scale(${scale})`,
      transition: { delay: i * 0.04, duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    }),
    exit: ({ i = 0 } = {}) => ({
      opacity: 0,
      transform: 'translateY(-8px) scale(0.97)',
      transition: { delay: i * 0.04, duration: 0.16, ease: [0.22, 1, 0.36, 1] },
    }),
  },
};

export function getDatasetValue(element: { dataset: DOMStringMap } | null, attribute: string) {
  return element?.dataset[attribute] || null;
}

export function getStampId(element: { dataset: DOMStringMap } | null) {
  return getDatasetValue(element, 'id');
}

export function getStampIdFromEvent(event: { target: EventTarget | null }) {
  const el = (event.target as HTMLElement | null)?.closest?.('[data-id]') as HTMLElement | null;
  return getStampId(el);
}

export function useIsMobile(defaultState?: boolean) {
  const isMobile = useMatchMedia('(max-width: 1023px)', defaultState);

  return isMobile;
}

export async function whenElementSized(element: HTMLElement) {
  if (element.offsetWidth >= 2 && element.offsetHeight >= 2) {
    return { width: element.offsetWidth, height: element.offsetHeight };
  }

  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    let frames = 0;
    const frame = () => {
      if (element.offsetWidth >= 2 && element.offsetHeight >= 2) {
        resolve({ width: element.offsetWidth, height: element.offsetHeight });
        return;
      }
      frames += 1;
      if (frames > 120) {
        reject(new Error('Element never sized'));
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

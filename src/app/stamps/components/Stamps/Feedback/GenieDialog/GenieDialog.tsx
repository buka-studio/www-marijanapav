import { snapdom } from '@zumer/snapdom';
import { Dialog } from 'radix-ui';
import {
  createContext,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import * as THREE from 'three';

import useResizeRef from '~/src/hooks/useResizeRef';
import { cn } from '~/src/util';

import { setupHiDPICtx } from '../../../CanvasGrid/util';
import { useIsMobile } from '../../util';
import Warp, { imageToTexture, WarpController } from './Warp';

const GenieContext = createContext<{
  triggerRef: HTMLButtonElement | null;
  setTriggerRef: (ref: HTMLButtonElement | null) => void;
}>({ triggerRef: null, setTriggerRef: () => {} });

const useGenieDialog = () => {
  return useContext(GenieContext);
};

export function FeedbackDialog({
  children,
  ...props
}: { children: React.ReactNode } & Dialog.DialogProps) {
  const [triggerRef, setTriggerRef] = useState<HTMLButtonElement | null>(null);

  return (
    <Dialog.Root {...props}>
      <GenieContext.Provider value={{ triggerRef, setTriggerRef }}>
        {children}
      </GenieContext.Provider>
    </Dialog.Root>
  );
}

export const FeedbackDialogPortal = Dialog.Portal;

export function FeedbackDialogOverlay({ ...props }: Dialog.DialogOverlayProps) {
  return <Dialog.Overlay {...props} />;
}

export function FeedbackDialogTrigger({ ...props }) {
  const { setTriggerRef } = useGenieDialog();

  return <Dialog.Trigger ref={setTriggerRef} {...props} />;
}

export function FeedbackDialogContent({
  children,
  ...props
}: { children: React.ReactNode } & Dialog.DialogContentProps) {
  return (
    <Dialog.Content data-slot="dialog-content" {...props}>
      {children}
    </Dialog.Content>
  );
}

export interface GenieAnimationController {
  enter: (props?: {
    autoHide?: boolean;
    target?: HTMLElement | null;
    onStart?: () => void;
  }) => Promise<void>;
  exit: (props?: { target?: HTMLElement | null; onStart?: () => void }) => Promise<void>;
  prepare: (props?: { target?: HTMLElement | null }) => Promise<void>;
}

function getElementPositionInParent(element: HTMLElement, parent: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  return {
    x: rect.left - parentRect.left,
    y: rect.top - parentRect.top,
    width: rect.width,
    height: rect.height,
  };
}

interface Snapshot {
  image: HTMLImageElement | HTMLCanvasElement;
  texture: THREE.Texture;
  width: number;
  height: number;
}

export function GenieBackdrop({
  ref,
  className,
  duration = 625,
}: {
  ref: React.RefObject<GenieAnimationController | null>;
  className?: string;
  duration?: number;
}) {
  const { ref: containerRef, dimensions } = useResizeRef<HTMLDivElement>();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const isMobile = useIsMobile();

  const [isActive, setIsActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const targetsCacheRef = useRef<WeakMap<HTMLElement, Snapshot>>(new WeakMap());

  const warpRef = useRef<WarpController>(null);

  const handlePrepareSnapshot = useCallback(
    async (target?: HTMLElement | null) => {
      if (!target) {
        return;
      }

      // const cached = targetsCacheRef.current.get(target);
      // if (cached) {
      //   flushSync(() => {
      //     setSnapshot(cached);
      //   });
      //   return;
      // }

      const snap = await snapdom(target, {
        embedFonts: true,
        // cache: 'disabled',
        excludeFonts: {
          families: [
            'Inter',
            'Inter Fallback',
            'Archivo',
            'Archivo Fallback',
            'IBM Plex Mono',
            'IBM Plex Mono Fallback',
            'Libertinus Serif',
          ],
        },
      });
      const img = await snap.toPng();

      if (!img) {
        return;
      }

      const container = containerRef.current!;

      const canvas = document.createElement('canvas');
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const { ctx } = setupHiDPICtx(
        canvas,
        container.clientWidth,
        container.clientHeight,
        typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      );

      if (!ctx) {
        return;
      }

      const position = getElementPositionInParent(target, containerRef.current!);

      ctx.drawImage(img, position.x, position.y, position.width, position.height);

      const data = {
        image: canvas,
        width: container.clientWidth,
        height: container.clientHeight,
        texture: imageToTexture(canvas),
      };

      targetsCacheRef.current.set(target, data);

      flushSync(() => {
        setSnapshot(data);
      });

      return data;
    },
    [containerRef],
  );

  useImperativeHandle(ref, () => ({
    prepare: async (props?: { target?: HTMLElement | null }) => {
      await handlePrepareSnapshot(props?.target);
    },
    enter: async (props?: {
      autoHide?: boolean;
      target?: HTMLElement | null;
      onStart?: () => void;
    }) => {
      await handlePrepareSnapshot(props?.target);

      setIsVisible(true);
      setIsActive(true);

      props?.onStart?.();
      await warpRef.current?.enter();

      if (props?.autoHide) {
        setIsVisible(false);
      }
    },
    exit: async (props?: { target?: HTMLElement | null; onStart?: () => void }) => {
      await handlePrepareSnapshot(props?.target);

      setIsVisible(true);

      props?.onStart?.();
      await warpRef.current?.exit();

      setIsActive(false);
    },
  }));

  return (
    <div ref={containerRef} className={cn('pointer-events-none absolute inset-0 ', className)}>
      {snapshot && (
        <Warp
          texture={snapshot.texture}
          width={dimensions.width}
          height={dimensions.height}
          warpRange={isMobile ? { left: 90, right: 95 } : { left: 47.5, right: 52.5 }}
          warpRef={warpRef}
          duration={duration}
          motionBlur={1}
          easing={1}
          className={cn('absolute inset-0 transition-all duration-0', {
            'opacity-0 duration-500': !isVisible,
          })}
        />
      )}
    </div>
  );
}

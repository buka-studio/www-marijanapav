'use client';

import { ScreenQuad, shaderMaterial } from '@react-three/drei';
import { Canvas, CanvasProps, extend, ThreeElement, useFrame } from '@react-three/fiber';
import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { cn } from '~/src/util';

import fragmentShaderSource from './Warp.frag';
import vertexShaderSource from './Warp.vert';

export type WarpController = {
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  draw: () => void;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    warpMaterial: ThreeElement<typeof WarpMaterial>;
  }
}

type ImageSource = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas | ImageBitmap;

interface WarpProps {
  texture: THREE.Texture;
  width: number;
  height: number;
  warpRange: { left: number; right: number };
  warpControllerRef: React.Ref<WarpController>;
  motionBlur: number;
  easing: number;
  isReversed: boolean;
  duration: number;
  side?: 'top' | 'bottom';
}

const WarpMaterial = shaderMaterial(
  {
    uProgress: 0,
    uRangeLeft: 0.75,
    uRangeRight: 0.85,
    uMotionBlur: 0.85,
    uEasingFunction: 2,
    uIsReversed: true,
    uTexture: null as THREE.Texture | null,
    uSide: 0,
  },
  vertexShaderSource,
  fragmentShaderSource,
);

extend({ WarpMaterial });

type WarpMatImpl = THREE.ShaderMaterial & {
  uniforms: {
    uDuration: { value: number };
    uProgress: { value: number };
    uRangeLeft: { value: number };
    uRangeRight: { value: number };
    uMotionBlur: { value: number };
    uEasingFunction: { value: number };
    uIsReversed: { value: number };
    uTexture: { value: THREE.Texture | null };
    uSide: { value: number };
  };
};

export function imageToTexture(image: ImageSource) {
  const texture = (image as HTMLCanvasElement).getContext
    ? new THREE.CanvasTexture(image as HTMLCanvasElement)
    : new THREE.Texture(image as any);
  texture.flipY = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

function WarpScene({
  texture,
  durationMs,
  ranges,
  motionBlur,
  easing,
  isReversed,
  playId,
  isStatic,
  side = 'bottom',
}: {
  texture: THREE.Texture;
  durationMs: number;
  ranges: { left: number; right: number };
  motionBlur: number;
  easing: number;
  isReversed: boolean;
  playId: number;
  isStatic: boolean;
  side?: 'top' | 'bottom';
}) {
  const matRef = useRef<WarpMatImpl>(null!);
  const progressRef = useRef(0);
  const playingRef = useRef(false);

  useLayoutEffect(() => {
    if (!matRef.current) {
      return;
    }

    const u = matRef.current.uniforms;
    u.uTexture.value = texture;
    u.uRangeLeft.value = ranges.left / 100;
    u.uRangeRight.value = ranges.right / 100;
    u.uMotionBlur.value = motionBlur / 100;
    u.uEasingFunction.value = easing | 0;
    u.uIsReversed.value = isReversed ? 1 : 0;
    u.uSide.value = side === 'top' ? 1 : 0;
  }, [texture, ranges.left, ranges.right, motionBlur, easing, isReversed, side]);

  useLayoutEffect(() => {
    progressRef.current = 0;
    playingRef.current = !isStatic;
  }, [playId, isStatic]);

  useFrame((_, delta) => {
    if (!matRef.current) {
      return;
    }

    if (playingRef.current) {
      const durationSeconds = durationMs / 1000;
      if (durationSeconds > 0) {
        progressRef.current += delta / durationSeconds;
      }

      if (progressRef.current >= 1) {
        progressRef.current = 1;
        playingRef.current = false;
      }
    }

    matRef.current.uniforms.uProgress.value = progressRef.current;
  });

  return (
    <ScreenQuad>
      <warpMaterial ref={matRef} />
    </ScreenQuad>
  );
}

export default function Warp({
  height,
  width,
  warpRef,
  duration,
  motionBlur,
  easing,
  warpRange,
  texture,
  className,
  side,
  ...props
}: CanvasProps &
  Pick<
    WarpProps,
    'easing' | 'warpRange' | 'motionBlur' | 'height' | 'width' | 'duration' | 'texture' | 'side'
  > & { warpRef: React.Ref<WarpController> }) {
  const [isReversed, setIsReversed] = useState(false);
  const [playId, setPlayId] = useState(0);
  const [isStatic, setIsStatic] = useState(true);

  const isPlayingRef = useRef(false);

  useImperativeHandle(warpRef, () => ({
    exit: () => {
      isPlayingRef.current = true;

      setIsReversed(false);
      setIsStatic(false);
      setPlayId((id) => id + 1);

      return new Promise((resolve) =>
        setTimeout(() => {
          isPlayingRef.current = false;
          resolve();
        }, duration),
      );
    },
    enter: () => {
      isPlayingRef.current = true;

      setIsReversed(true);
      setIsStatic(false);
      setPlayId((id) => id + 1);

      return new Promise((resolve) =>
        setTimeout(() => {
          isPlayingRef.current = false;
          resolve();
        }, duration),
      );
    },
    draw: () => {
      setIsStatic(true);
    },
  }));

  return (
    <Canvas
      className={cn(className)}
      orthographic
      gl={{
        alpha: true,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      }}
      camera={{ position: [0, 0, 1], zoom: 1 }}
      style={{ width, height, pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
      }}
      {...props}
    >
      {texture && (
        <WarpScene
          texture={texture}
          durationMs={duration}
          ranges={warpRange}
          motionBlur={motionBlur}
          easing={easing}
          isReversed={isReversed}
          playId={playId}
          isStatic={isStatic}
          side={side}
        />
      )}
    </Canvas>
  );
}

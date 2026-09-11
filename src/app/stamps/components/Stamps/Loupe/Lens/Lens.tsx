'use client';

import { ScreenQuad, shaderMaterial } from '@react-three/drei';
import { Canvas, extend, ThreeElement, useFrame } from '@react-three/fiber';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useStampStore } from '../../../../store';
import fragmentShader from './Lens.frag';
import vertexShader from './Lens.vert';

declare module '@react-three/fiber' {
  interface ThreeElements {
    lensMaterial: ThreeElement<typeof LensMaterial>;
  }
}

type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

interface Props {
  image: ImageSource;
  width: number;
  height: number;
  sourceWidth?: number;
  sourceHeight?: number;
  magnification?: number;
  ior?: number;
  chromaticAberration?: number;
  lensThickness?: number;
  bevelStart?: number;
  oblateZScale?: number;
  refractionScale?: number;
  className?: string;
  style?: React.CSSProperties;
  live?: boolean;
  onReady?: () => void;
}

const LensMaterial = shaderMaterial(
  {
    uSourceTex: null,
    uSourceSizePx: new THREE.Vector2(1, 1),
    uLensCenterPx: new THREE.Vector2(),

    uLensMagnification: 1.0,
    uLensIOR: 1.52,
    uAberrationAmount: 0.05,
    uLensThickness: 0.9,
    uBevelStartR: 0.9,
    uLensRadiusPx: 64.0,
    uLensOblateness: 0.65,
    uRefractionDisplacementScale: 0.6,
  },
  vertexShader,
  fragmentShader,
);

extend({ LensMaterial });

type LensMatImpl = THREE.ShaderMaterial & {
  uniforms: {
    uSourceTex: { value: THREE.Texture | null };
    uSourceSizePx: { value: THREE.Vector2 };
    uLensCenterPx: { value: THREE.Vector2 };
    uLensMagnification: { value: number };
    uLensIOR: { value: number };
    uAberrationAmount: { value: number };
    uLensThickness: { value: number };
    uBevelStartR: { value: number };
    uLensRadiusPx: { value: number };
    uLensOblateness: { value: number };
    uRefractionDisplacementScale: { value: number };
  };
};

function imageToTexture(image: ImageSource) {
  const isCanvas =
    typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement;
  const texture = isCanvas
    ? new THREE.CanvasTexture(image)
    : new THREE.Texture(image);
  texture.flipY = !(typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function WaitForPaint({ bound, onReady }: { bound: boolean; onReady: () => void }) {
  const frames = useRef(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  if (!bound) {
    frames.current = 0;
  }

  useFrame(() => {
    if (!bound || frames.current >= 2) {
      return;
    }
    frames.current += 1;
    if (frames.current >= 2) {
      onReadyRef.current();
    }
  });

  return null;
}

function LensScene({
  image,
  width,
  height,
  magnification = 1,
  ior = 1.52,
  chromaticAberration = 0.05,
  lensThickness = 0.9,
  bevelStart = 0.9,
  oblateZScale = 0.65,
  refractionScale = 0.6,
  sourceWidth: sourceWidthOverride,
  sourceHeight: sourceHeightOverride,
  texture,
  onBound,
}: Props & { texture: THREE.Texture; onBound?: () => void }) {
  const matRef = useRef<LensMatImpl>(null!);
  const onBoundRef = useRef(onBound);
  onBoundRef.current = onBound;

  useLayoutEffect(() => {
    if (!matRef.current) return;
    const sourceWidth = sourceWidthOverride ?? image.width;
    const sourceHeight = sourceHeightOverride ?? image.height;

    const u = matRef.current.uniforms;
    u.uSourceTex.value = texture;

    u.uSourceSizePx.value.set(sourceWidth, sourceHeight);

    u.uLensMagnification.value = magnification;
    u.uLensIOR.value = ior;
    u.uAberrationAmount.value = Math.max(0, chromaticAberration);
    u.uLensThickness.value = lensThickness;
    u.uBevelStartR.value = bevelStart;
    u.uLensRadiusPx.value = Math.min(width, height) * 0.5;
    u.uLensOblateness.value = oblateZScale;
    u.uRefractionDisplacementScale.value = refractionScale;
    onBoundRef.current?.();
  }, [
    image,
    texture,
    width,
    height,
    magnification,
    ior,
    chromaticAberration,
    lensThickness,
    bevelStart,
    oblateZScale,
    refractionScale,
    sourceWidthOverride,
    sourceHeightOverride,
  ]);

  const scaleRef = useRef(useStampStore.getState().loupeScale);
  const coordsRef = useRef(useStampStore.getState().loupeCoords);

  useEffect(() => {
    const unsub = useStampStore.subscribe((state, prev) => {
      if (state.loupeScale !== prev.loupeScale) {
        scaleRef.current = state.loupeScale;
      }
      if (state.loupeCoords !== prev.loupeCoords) {
        coordsRef.current = state.loupeCoords;
      }
    });

    return unsub;
  }, []);

  useFrame((_, dt) => {
    const u = matRef.current.uniforms;

    u.uLensMagnification.value = THREE.MathUtils.damp(
      u.uLensMagnification.value,
      scaleRef.current,
      35,
      dt,
    );

    const { x, y } = coordsRef.current;
    u.uLensCenterPx.value.set(x, y);
  });

  return (
    <ScreenQuad>
      <lensMaterial ref={matRef} />
    </ScreenQuad>
  );
}

function Lens({
  image,
  width,
  height,
  ior,
  chromaticAberration,
  lensThickness,
  bevelStart,
  oblateZScale = 0.5,
  refractionScale = 0.5,
  sourceWidth,
  sourceHeight,
  className,
  style,
  live = true,
  onReady,
}: Props) {
  const [bound, setBound] = useState(false);
  const [ready, setReady] = useState(false);
  const texture = useMemo(() => (image ? imageToTexture(image) : null), [image]);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useLayoutEffect(() => {
    setBound(false);
    setReady(false);
    if (texture && glRef.current) {
      glRef.current.initTexture(texture);
      texture.needsUpdate = false;
    }
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!image || !texture) {
    return null;
  }

  return (
    <Canvas
      className={className}
      style={{
        width,
        height,
        borderRadius: 9999,
        opacity: ready ? 1 : 0,
        ...style,
      }}
      gl={{ alpha: true, antialias: false, preserveDrawingBuffer: false, premultipliedAlpha: true }}
      frameloop={live || !ready ? 'always' : 'demand'}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      dpr={typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1}
      onCreated={({ gl }) => {
        gl.setClearColor('#f5f5f4', 1);
        glRef.current = gl;
        gl.initTexture(texture);
        texture.needsUpdate = false;
      }}
    >
      <LensScene
        image={image}
        width={width}
        height={height}
        ior={ior}
        chromaticAberration={chromaticAberration}
        lensThickness={lensThickness}
        bevelStart={bevelStart}
        oblateZScale={oblateZScale}
        refractionScale={refractionScale}
        sourceWidth={sourceWidth}
        sourceHeight={sourceHeight}
        texture={texture}
        onBound={() => setBound(true)}
      />
      <WaitForPaint
        bound={bound}
        onReady={() => {
          setReady(true);
          onReadyRef.current?.();
        }}
      />
    </Canvas>
  );
}

export default memo(Lens);

'use client';

import { ScreenQuad, shaderMaterial } from '@react-three/drei';
import { Canvas, extend, ThreeElement, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useLoupeStore } from '../store';
import fragmentShader from './Lens.frag';
import vertexShader from './Lens.vert';

declare module '@react-three/fiber' {
  interface ThreeElements {
    lensMaterial: ThreeElement<typeof LensMaterial>;
  }
}

type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

interface LensProps {
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
}: LensProps & { texture: THREE.Texture }) {
  const matRef = useRef<LensMatImpl>(null!);

  useEffect(() => {
    if (!matRef.current) return;
    const sourceWidth = sourceWidthOverride ?? (image as any).width;
    const sourceHeight = sourceHeightOverride ?? (image as any).height;

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

  const scaleRef = useRef(useLoupeStore.getState().scale);
  const coordsRef = useRef(useLoupeStore.getState().coords);

  useEffect(() => {
    const unsub = useLoupeStore.subscribe((v) => {
      scaleRef.current = v.scale;
      coordsRef.current = v.coords;
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

export default function Lens({
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
  ...props
}: any) {
  const texture = useMemo(() => (image ? imageToTexture(image) : null), [image]);

  return (
    <Canvas
      className={className}
      style={{ width, height, borderRadius: 9999, ...style }}
      gl={{ alpha: true, antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: true }}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
      }}
      {...props}
    >
      {texture && (
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
        />
      )}
    </Canvas>
  );
}

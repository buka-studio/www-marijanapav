'use client';

import { shaderMaterial } from '@react-three/drei/core/shaderMaterial';
import {
  Canvas,
  extend,
  useFrame,
  useLoader,
  useThree,
  type ThreeElement,
} from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { StaticProject } from '../../constants';
import { previewAtlas } from './atlas';
import { bindAtlasRect } from './atlasRect';
import { gridMetrics, projectAt, type HoverPreviewRendererProps } from './grid';
import fragmentShader from './HoverPreview.frag';
import vertexShader from './HoverPreview.vert';
import { defaultMotionBlurParams } from './motionBlur';
import { PREVIEW_CELL_WIDTH, PREVIEW_GAP } from './params';
import { usePreviewCenter } from './usePreviewCenter';

const VISIBLE_SLOTS = 3;
const SLOT_INDICES = [0, 1, 2];
const SLOT_OFFSET = 1;
const MOTION_STOP_PX_PER_S = 10;
const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = {
  alpha: true,
  antialias: false,
  powerPreference: 'high-performance' as const,
};
const CANVAS_CAMERA = { position: [0, 0, 100] as [number, number, number], zoom: 1 };

useLoader.preload(THREE.TextureLoader, previewAtlas.src);

const HoverPreviewMaterial = shaderMaterial(
  {
    uAtlas: null as THREE.Texture | null,
    uHasTexture: 0,
    uHasTexturePrev: 0,
    uHasTextureNext: 0,
    uAtlasRect: new THREE.Vector4(1, 1, 0, 0),
    uAtlasRectPrev: new THREE.Vector4(1, 1, 0, 0),
    uAtlasRectNext: new THREE.Vector4(1, 1, 0, 0),
    uBlur: 0,
    uGap: 0,
  },
  vertexShader,
  fragmentShader,
  (material) => {
    if (!material) {
      return;
    }
    material.transparent = true;
    material.depthWrite = false;
    material.toneMapped = false;
    material.side = THREE.FrontSide;
  },
);

extend({ HoverPreviewMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    hoverPreviewMaterial: ThreeElement<typeof HoverPreviewMaterial>;
  }
}

type HoverPreviewMatImpl = InstanceType<typeof HoverPreviewMaterial>;

function configureAtlasTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 1;
  texture.flipY = true;
  texture.needsUpdate = true;
}

function bindSlotRects(
  material: HoverPreviewMatImpl,
  atlas: THREE.Texture,
  projects: StaticProject[],
  index: number,
) {
  const project = projectAt(projects, index);
  const prev = projectAt(projects, index - 1);
  const next = projectAt(projects, index + 1);

  material.uAtlas = atlas;
  material.uHasTexture = bindAtlasRect(material.uAtlasRect, project?.slug);
  material.uHasTexturePrev = bindAtlasRect(material.uAtlasRectPrev, prev?.slug);
  material.uHasTextureNext = bindAtlasRect(material.uAtlasRectNext, next?.slug);
}

function PreviewScene({ projects, centerIndex, active = true }: HoverPreviewRendererProps) {
  const { cellWidth, cellHeight, strideY, gap } = gridMetrics(PREVIEW_CELL_WIDTH, PREVIEW_GAP);
  const atlas = useLoader(THREE.TextureLoader, previewAtlas.src);
  const center = usePreviewCenter(centerIndex);
  const reduceMotion = Boolean(useReducedMotion());
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const materialRefs = useRef<HoverPreviewMatImpl[]>([]);
  const speedRef = useRef(0);
  const previousCenterRef = useRef(center.get());
  const compiledRef = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(cellWidth, cellHeight),
    [cellWidth, cellHeight],
  );
  const gapUv = cellHeight > 0 ? gap / cellHeight : 0;

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useLayoutEffect(() => {
    configureAtlasTexture(atlas);
    invalidate();
  }, [atlas, invalidate]);

  useFrame((state, delta) => {
    if (!compiledRef.current) {
      compiledRef.current = true;
      state.gl.compile(state.scene, state.camera);
    }

    if (!active) {
      return;
    }

    const dt = Math.max(delta, 1 / 120);
    const centerValue = center.get();
    const origin = Math.round(centerValue);
    const velocity = (Math.abs(centerValue - previousCenterRef.current) * strideY) / dt;
    previousCenterRef.current = centerValue;

    if (reduceMotion || velocity <= MOTION_STOP_PX_PER_S) {
      speedRef.current = 0;
    } else {
      const easing =
        velocity > speedRef.current
          ? defaultMotionBlurParams.attack
          : defaultMotionBlurParams.release;
      speedRef.current += (velocity - speedRef.current) * (1 - Math.exp(-dt * easing));
    }

    if (groupRef.current) {
      groupRef.current.position.y = centerValue * strideY;
    }

    const amount = reduceMotion
      ? 0
      : 1 - Math.exp(-speedRef.current / Math.max(defaultMotionBlurParams.speedRef, 1));
    const blurSpan = Math.max(1 - defaultMotionBlurParams.blurThreshold, 1e-5);
    const blurT = Math.max(0, (amount - defaultMotionBlurParams.blurThreshold) / blurSpan);
    const blur = blurT * blurT * defaultMotionBlurParams.maxBlur;

    for (let slot = 0; slot < VISIBLE_SLOTS; slot += 1) {
      const material = materialRefs.current[slot];
      const mesh = meshRefs.current[slot];
      if (!material || !mesh) {
        continue;
      }

      const index = origin + slot - SLOT_OFFSET;
      const project = projectAt(projects, index);
      mesh.visible = Boolean(project);
      mesh.position.y = -index * strideY;

      if (!project) {
        continue;
      }

      bindSlotRects(material, atlas, projects, index);
      material.uBlur = blur;
      material.uGap = gapUv;
    }
  });

  return (
    <group ref={groupRef}>
      {SLOT_INDICES.map((slot) => (
        <mesh
          key={slot}
          ref={(mesh) => {
            if (mesh) {
              meshRefs.current[slot] = mesh;
            }
          }}
          geometry={geometry}
        >
          <hoverPreviewMaterial
            ref={(material) => {
              if (material) {
                materialRefs.current[slot] = material as HoverPreviewMatImpl;
              }
            }}
            uAtlas={atlas}
            transparent
            depthWrite={false}
            toneMapped={false}
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function WebglGridPreview({
  projects,
  centerIndex,
  active = true,
}: HoverPreviewRendererProps) {
  const { cellWidth, cellHeight } = gridMetrics(PREVIEW_CELL_WIDTH, PREVIEW_GAP);
  const canvasStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      inset: 0,
      width: cellWidth,
      height: cellHeight,
    }),
    [cellHeight, cellWidth],
  );

  return (
    <div className="relative" style={{ width: cellWidth, height: cellHeight }}>
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: cellWidth,
            height: cellHeight,
          }}
        >
          <Canvas
            orthographic
            flat
            frameloop={active ? 'always' : 'demand'}
            dpr={CANVAS_DPR}
            gl={CANVAS_GL}
            camera={CANVAS_CAMERA}
            style={canvasStyle}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
          >
            <Suspense fallback={null}>
              <PreviewScene projects={projects} centerIndex={centerIndex} active={active} />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
}

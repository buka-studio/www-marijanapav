'use client';

import { shaderMaterial } from '@react-three/drei/core/shaderMaterial';
import { Canvas, extend, useFrame, useThree, type ThreeElement } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import ImageTextureLoader from '~/src/lib/three/ImageTextureLoader';

import type { StaticProject } from '../../constants';
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
const SCROLL_IDLE_MS = 140;

function scheduleIdle(callback: IdleRequestCallback, timeout = 800) {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(callback, { timeout });
  }

  return window.setTimeout(() => {
    callback({ didTimeout: true, timeRemaining: () => 8 });
  }, 32);
}

function cancelIdle(handle: number) {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}

const HoverPreviewMaterial = shaderMaterial(
  {
    uTexture: null as THREE.Texture | null,
    uTexturePrev: null as THREE.Texture | null,
    uTextureNext: null as THREE.Texture | null,
    uHasTexture: 0,
    uHasTexturePrev: 0,
    uHasTextureNext: 0,
    uCoverTransform: new THREE.Vector4(1, 1, 0, 0),
    uCoverTransformPrev: new THREE.Vector4(1, 1, 0, 0),
    uCoverTransformNext: new THREE.Vector4(1, 1, 0, 0),
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

function setCoverTransform(
  target: THREE.Vector4,
  image: { width: number; height: number },
  planeWidth: number,
  planeHeight: number,
) {
  const planeAspect = planeWidth / Math.max(planeHeight, 1e-5);
  const imageAspect = image.width / Math.max(image.height, 1e-5);
  const scaleX = Math.min(planeAspect / imageAspect, 1);
  const scaleY = Math.min(imageAspect / planeAspect, 1);
  target.set(scaleX, scaleY, 0.5 * (1 - scaleX), 1 - scaleY);
}

function bindSlotTextures(
  material: HoverPreviewMatImpl,
  loader: ImageTextureLoader,
  projects: StaticProject[],
  index: number,
  cellWidth: number,
  cellHeight: number,
) {
  const dummy = loader.getFallback();
  const project = projectAt(projects, index);
  const prev = projectAt(projects, index - 1);
  const next = projectAt(projects, index + 1);
  const texture = project ? loader.get(index) : null;
  const prevTexture = prev ? loader.get(index - 1) : null;
  const nextTexture = next ? loader.get(index + 1) : null;

  material.uTexture = texture ?? dummy;
  material.uTexturePrev = prevTexture ?? dummy;
  material.uTextureNext = nextTexture ?? dummy;
  material.uHasTexture = texture ? 1 : 0;
  material.uHasTexturePrev = prevTexture ? 1 : 0;
  material.uHasTextureNext = nextTexture ? 1 : 0;

  if (project) {
    setCoverTransform(material.uCoverTransform, project.preview, cellWidth, cellHeight);
  }
  if (prev) {
    setCoverTransform(material.uCoverTransformPrev, prev.preview, cellWidth, cellHeight);
  }
  if (next) {
    setCoverTransform(material.uCoverTransformNext, next.preview, cellWidth, cellHeight);
  }
}

function PreviewScene({
  projects,
  centerIndex,
  loader,
  active = true,
}: HoverPreviewRendererProps & { loader: ImageTextureLoader }) {
  const { cellWidth, cellHeight, strideY, gap } = gridMetrics(PREVIEW_CELL_WIDTH, PREVIEW_GAP);
  const center = usePreviewCenter(centerIndex);
  const reduceMotion = Boolean(useReducedMotion());
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const materialRefs = useRef<HoverPreviewMatImpl[]>([]);
  const speedRef = useRef(0);
  const previousCenterRef = useRef(center.get());
  const slotIndexRef = useRef<number[]>([-1, -1, -1]);
  const boundTextureVersionRef = useRef(-1);
  const requestedOriginRef = useRef<number | null>(null);
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

  useEffect(() => {
    invalidate();
  }, [invalidate]);

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

    loader.requestAround(origin, SLOT_OFFSET);
    if (requestedOriginRef.current !== origin) {
      requestedOriginRef.current = origin;
      loader.prioritizeAround(origin, SLOT_OFFSET);
    }

    const visibleNeedsUpload = SLOT_INDICES.some((slot) => {
      const index = origin + slot - SLOT_OFFSET;
      return Boolean(projectAt(projects, index) && loader.needsGpuUpload(index));
    });
    const uploaded = loader.uploadPending(visibleNeedsUpload ? 1 : 0);

    if (reduceMotion || velocity <= MOTION_STOP_PX_PER_S) {
      speedRef.current = 0;
    } else {
      const easing =
        velocity > speedRef.current ? defaultMotionBlurParams.attack : defaultMotionBlurParams.release;
      speedRef.current += (velocity - speedRef.current) * (1 - Math.exp(-dt * easing));
    }

    if (groupRef.current) {
      groupRef.current.position.y = centerValue * strideY;
    }

    const skipBlur = uploaded > 0;
    const amount =
      reduceMotion || skipBlur
        ? 0
        : 1 - Math.exp(-speedRef.current / Math.max(defaultMotionBlurParams.speedRef, 1));
    const blurSpan = Math.max(1 - defaultMotionBlurParams.blurThreshold, 1e-5);
    const blurT = Math.max(0, (amount - defaultMotionBlurParams.blurThreshold) / blurSpan);
    const blur = blurT * blurT * defaultMotionBlurParams.maxBlur;
    const texturesChanged = boundTextureVersionRef.current !== loader.version;

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

      if (texturesChanged || slotIndexRef.current[slot] !== index) {
        slotIndexRef.current[slot] = index;
        bindSlotTextures(material, loader, projects, index, cellWidth, cellHeight);
      }

      material.uBlur = blur;
      material.uGap = gapUv;
    }

    boundTextureVersionRef.current = loader.version;
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
  const loader = useMemo(
    () =>
      new ImageTextureLoader(
        projects.map((project) => project.preview.src),
        { width: 640, quality: 80 },
      ),
    [projects],
  );
  const canvasStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      inset: 0,
      width: cellWidth,
      height: cellHeight,
    }),
    [cellHeight, cellWidth],
  );

  useEffect(() => {
    loader.retain();
    return () => {
      loader.detachRenderer();
      loader.release();
    };
  }, [loader]);

  useEffect(() => {
    if (active) {
      return;
    }

    let idleHandle = 0;
    let scrollTimeout = 0;
    let scrolling = false;
    let requestedAll = false;

    const pump = () => {
      idleHandle = 0;
      if (scrolling) {
        return;
      }

      if (!requestedAll) {
        requestedAll = true;
        loader.requestAll();
      }

      loader.uploadPending(1);

      if (loader.isWarming) {
        idleHandle = scheduleIdle(pump, 1000);
      }
    };

    const onScroll = () => {
      scrolling = true;
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        scrolling = false;
        if (loader.isWarming) {
          idleHandle = scheduleIdle(pump, 1000);
        }
      }, SCROLL_IDLE_MS);
    };

    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    idleHandle = scheduleIdle(pump, 1200);

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.clearTimeout(scrollTimeout);
      cancelIdle(idleHandle);
    };
  }, [active, loader]);

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
              loader.attachRenderer(gl);
            }}
          >
            <PreviewScene
              projects={projects}
              centerIndex={centerIndex}
              loader={loader}
              active={active}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

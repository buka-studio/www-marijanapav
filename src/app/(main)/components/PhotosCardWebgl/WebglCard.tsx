'use client';

import { shaderMaterial } from '@react-three/drei/core/shaderMaterial';
import { Canvas, extend, ThreeElement, useFrame } from '@react-three/fiber';
import { converter, parse } from 'culori';
import type Lenis from 'lenis';
import { ReactLenis, useLenis } from 'lenis/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import * as THREE from 'three';

import CardTitle from '~/src/components/ui/CardTitle';
import useDidMount from '~/src/hooks/useDidMount';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import useResizeRef from '~/src/hooks/useResizeRef';
import { cn } from '~/src/util';

import Card from '../Card';
import { photos } from '../photos';
import { defaultPhotoDistortParams, type PhotoDistortParams } from './params';
import fragmentShader from './PhotoDistort.frag';
import vertexShader from './PhotoDistort.vert';
import PhotoPlaceholder from './PhotoPlaceholder';

const GAP_PX = 16;
const RADIUS_PX = 6;
const VISIBLE_SLOTS = 5;
const PHOTO_COUNT = photos.length;
const SNAP_SETTLE_MS = 160;
const SNAP_DURATION_S = 0.32;
const FLICK_PX_PER_S = 2600;
const FLICK_DECEL_PX_S2 = 2200;
const FLICK_VELOCITY_PX_S = 900;
const FLICK_MULTI_VELOCITY_PX_S = 2100;
const FLICK_VELOCITY_WINDOW_MS = 72;
const FLICK_MOVE_EPS_PX = 6;
const FLICK_MAX_STEPS = 8;
const SLOT_INDICES = Array.from({ length: VISIBLE_SLOTS }, (_, slot) => slot);
const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = {
  alpha: true,
  antialias: false,
  powerPreference: 'high-performance' as const,
};
const CANVAS_CAMERA = { position: [0, 0, 100] as [number, number, number], zoom: 1 };
const CAPTURE_PASSIVE = { capture: true, passive: true } as const;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

const LENIS_OPTIONS = {
  orientation: 'horizontal' as const,
  gestureOrientation: 'both' as const,
  infinite: true,
  syncTouch: true,
  syncTouchLerp: 1,
  lerp: 0,
  smoothWheel: true,
  overscroll: false,
  autoResize: false,
  autoRaf: false,
  virtualScroll: (data: { deltaX: number; deltaY: number; event: Event }) => {
    if (!data.event.type.includes('touch')) {
      return true;
    }

    // Don't dump leftover velocity as an instant jump on lift — that skips photos.
    if (data.event.type === 'touchend' || data.event.type === 'touchcancel') {
      data.deltaX = 0;
      data.deltaY = 0;
      return true;
    }

    // Vertical-dominant thumb motion should scroll the page, not the roll.
    if (Math.abs(data.deltaX) < Math.abs(data.deltaY)) {
      return false;
    }

    data.deltaY = 0;
    return true;
  },
};

const photoUrls: string[] = [];
const photoImageSizes: THREE.Vector2[] = [];
for (const photo of photos) {
  photoUrls.push(photo.src);
  photoImageSizes.push(new THREE.Vector2(photo.width, photo.height));
}

const PhotoDistortMaterial = shaderMaterial(
  {
    uTexture: null as THREE.Texture | null,
    uImageSize: new THREE.Vector2(1, 1),
    uPlaneSize: new THREE.Vector2(1, 1),
    uSquash: 0,
    uEnvelope: 0,
    uBlur: 0,
    uGap: 0,
    uRadius: 6,
    uOverlay: new THREE.Vector4(0, 0, 0, 0.1),
    uTexturePrev: null as THREE.Texture | null,
    uTextureNext: null as THREE.Texture | null,
    uImageSizePrev: new THREE.Vector2(1, 1),
    uImageSizeNext: new THREE.Vector2(1, 1),
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

extend({ PhotoDistortMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    photoDistortMaterial: ThreeElement<typeof PhotoDistortMaterial>;
  }
}

type PhotoDistortMatImpl = InstanceType<typeof PhotoDistortMaterial>;

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
}

function wrapIndex(index: number) {
  return ((index % PHOTO_COUNT) + PHOTO_COUNT) % PHOTO_COUNT;
}

const toRgb = converter('rgb');

function subscribeRootClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getRootClass() {
  return document.documentElement.className;
}

function usePanelOverlay(overlayRef: React.MutableRefObject<THREE.Vector4>) {
  const rootClass = useSyncExternalStore(subscribeRootClass, getRootClass, () => '');

  useEffect(() => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--panel-overlay').trim();
    const rgb = toRgb(parse(value));
    if (!rgb) {
      return;
    }

    overlayRef.current.set(rgb.r, rgb.g, rgb.b, rgb.alpha ?? 1);
  }, [overlayRef, rootClass]);
}

function loadTexture(url: string) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const texture = new THREE.Texture(image);
      configureTexture(texture);
      resolve(texture);
    };
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

let texturesPromise: Promise<THREE.Texture[]> | undefined;

function loadTextures() {
  texturesPromise ??= Promise.all(photoUrls.map(loadTexture));
  return texturesPromise;
}

if (typeof window !== 'undefined') {
  loadTextures();
}

function PhotoPlane({
  slot,
  width,
  height,
  spacing,
  textures,
  geometry,
  materialRefs,
  meshRefs,
}: {
  slot: number;
  width: number;
  height: number;
  spacing: number;
  textures: THREE.Texture[];
  geometry: THREE.PlaneGeometry;
  materialRefs: React.RefObject<PhotoDistortMatImpl[]>;
  meshRefs: React.RefObject<THREE.Mesh[]>;
}) {
  const worldIndex = slot - Math.floor(VISIBLE_SLOTS / 2);
  const photoIndex = wrapIndex(worldIndex);
  const prevIndex = wrapIndex(photoIndex - 1);
  const nextIndex = wrapIndex(photoIndex + 1);

  return (
    <mesh
      ref={(mesh) => {
        if (mesh) {
          meshRefs.current[slot] = mesh;
        }
      }}
      position={[worldIndex * spacing, 0, 0]}
      geometry={geometry}
    >
      <photoDistortMaterial
        ref={(material) => {
          if (material) {
            materialRefs.current[slot] = material as PhotoDistortMatImpl;
          }
        }}
        uTexture={textures[photoIndex]}
        uTexturePrev={textures[prevIndex]}
        uTextureNext={textures[nextIndex]}
        uImageSize={photoImageSizes[photoIndex]}
        uImageSizePrev={photoImageSizes[prevIndex]}
        uImageSizeNext={photoImageSizes[nextIndex]}
        uPlaneSize={[width, height]}
        uSquash={0}
        uEnvelope={0}
        uBlur={0}
        uGap={width > 0 ? GAP_PX / width : 0}
        uRadius={RADIUS_PX}
        transparent
        depthWrite={false}
        toneMapped={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

const CarouselScene = memo(function CarouselScene({
  textures,
  lenisRef,
  stride,
  loopWidth,
  width,
  height,
  reduceMotion,
  paramsRef,
  overlayRef,
}: {
  textures: THREE.Texture[];
  lenisRef: React.RefObject<Lenis | undefined>;
  stride: number;
  loopWidth: number;
  width: number;
  height: number;
  reduceMotion: boolean;
  paramsRef: React.RefObject<PhotoDistortParams>;
  overlayRef: React.MutableRefObject<THREE.Vector4>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<PhotoDistortMatImpl[]>([]);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const slotPhotoRef = useRef<number[]>(Array.from({ length: VISIBLE_SLOTS }, () => -1));
  const previousScrollRef = useRef(0);
  const speedRef = useRef(0);
  const spacing = stride > 1 ? stride : width + GAP_PX;
  const cycle = loopWidth > 0 ? loopWidth : PHOTO_COUNT * spacing;
  const slotOffset = Math.floor(VISIBLE_SLOTS / 2);
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(width, height, 64, 8),
    [width, height],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.raf(performance.now());
    }

    const dt = Math.max(delta, 1 / 120);
    const params = paramsRef.current;
    const scroll = lenis?.animatedScroll ?? 0;
    const previous = previousScrollRef.current;
    let deltaScroll = scroll - previous;
    if (cycle > 0) {
      while (deltaScroll > cycle / 2) {
        deltaScroll -= cycle;
      }
      while (deltaScroll < -cycle / 2) {
        deltaScroll += cycle;
      }
    }
    previousScrollRef.current = scroll;

    const velocity = Math.abs(deltaScroll) / dt;
    const easing = velocity > speedRef.current ? params.attack : params.release;
    speedRef.current += (velocity - speedRef.current) * (1 - Math.exp(-dt * easing));

    if (groupRef.current) {
      groupRef.current.position.x = -scroll;
    }

    const amount = reduceMotion
      ? 0
      : 1 - Math.exp(-speedRef.current / Math.max(params.speedRef, 1));
    const squashSpan = Math.max(1 - params.squashThreshold, 1e-5);
    const squashT = Math.max(0, (amount - params.squashThreshold) / squashSpan);
    const squash = squashT * squashT * params.maxSquash;
    const blurSpan = Math.max(1 - params.blurThreshold, 1e-5);
    const blurT = Math.max(0, (amount - params.blurThreshold) / blurSpan);
    const blur = blurT * blurT * params.maxBlur;
    const origin = Math.round(scroll / Math.max(spacing, 1));
    const overlay = overlayRef.current;
    const materials = materialRefs.current;
    const meshes = meshRefs.current;
    const slotPhotos = slotPhotoRef.current;

    for (let slot = 0; slot < VISIBLE_SLOTS; slot += 1) {
      const material = materials[slot];
      const mesh = meshes[slot];
      if (!material || !mesh) {
        continue;
      }

      const worldIndex = origin + slot - slotOffset;
      const photoIndex = wrapIndex(worldIndex);
      mesh.position.x = worldIndex * spacing;

      if (slotPhotos[slot] !== photoIndex) {
        const prevIndex = wrapIndex(photoIndex - 1);
        const nextIndex = wrapIndex(photoIndex + 1);
        slotPhotos[slot] = photoIndex;
        material.uTexture = textures[photoIndex];
        material.uTexturePrev = textures[prevIndex];
        material.uTextureNext = textures[nextIndex];
        material.uImageSize.copy(photoImageSizes[photoIndex]);
        material.uImageSizePrev.copy(photoImageSizes[prevIndex]);
        material.uImageSizeNext.copy(photoImageSizes[nextIndex]);
      }

      material.uSquash = squash;
      material.uEnvelope = params.envelope;
      material.uBlur = blur;
      material.uOverlay.copy(overlay);
    }
  });

  return (
    <group ref={groupRef}>
      {SLOT_INDICES.map((slot) => (
        <PhotoPlane
          key={slot}
          slot={slot}
          width={width}
          height={height}
          spacing={spacing}
          textures={textures}
          geometry={geometry}
          materialRefs={materialRefs}
          meshRefs={meshRefs}
        />
      ))}
    </group>
  );
});

function LenisSync({
  lenisRef,
  stride,
  loopWidth,
  reduceMotion,
  onPhotoChange,
}: {
  lenisRef: React.MutableRefObject<Lenis | undefined>;
  stride: number;
  loopWidth: number;
  reduceMotion: boolean;
  onPhotoChange: (index: number) => void;
}) {
  const strideRef = useRef(stride);
  const reduceMotionRef = useRef(reduceMotion);
  strideRef.current = stride;
  reduceMotionRef.current = reduceMotion;
  const hasStride = stride > 1;
  const lenis = useLenis();

  useEffect(() => {
    lenis?.resize();
  }, [lenis, loopWidth]);

  useEffect(() => {
    if (!lenis || !hasStride) {
      return;
    }

    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let stillTimer: ReturnType<typeof setTimeout> | undefined;
    let gestureActive = false;
    let gestureDelta = 0;
    let startIndex = 0;
    let lastEventMs = 0;
    let samples: Array<{ t: number; v: number }> = [];
    let dragging = false;

    const pruneSamples = (now: number) => {
      const cutoff = now - FLICK_VELOCITY_WINDOW_MS;
      while (samples.length > 0 && samples[0].t < cutoff) {
        samples.shift();
      }
    };

    const recentSpeed = (now: number) => {
      pruneSamples(now);
      let peak = 0;
      let last = 0;
      for (const sample of samples) {
        peak = Math.max(peak, Math.abs(sample.v));
        last = sample.v;
      }
      return { peak, last };
    };

    const snapToRest = () => {
      if (!gestureActive) {
        return;
      }
      gestureActive = false;
      window.clearTimeout(stillTimer);

      const scroll = lenis.animatedScroll;
      const stride = Math.max(strideRef.current, 1);
      const reduceMotion = reduceMotionRef.current;
      const { peak: peakSpeed, last: lastVelocity } = recentSpeed(performance.now());
      const releaseSpeed = Math.abs(lastVelocity);
      const direction = Math.sign(gestureDelta) || Math.sign(lastVelocity) || 1;
      const nearest = Math.round(scroll / stride);
      let index = nearest;

      if (reduceMotion) {
        index = nearest;
      } else if (peakSpeed >= FLICK_MULTI_VELOCITY_PX_S) {
        const stopDistance = (peakSpeed * peakSpeed) / (2 * FLICK_DECEL_PX_S2);
        index = Math.round((scroll + direction * stopDistance) / stride);
        index =
          direction > 0 ? Math.max(index, startIndex + 1) : Math.min(index, startIndex - 1);
      } else if (peakSpeed >= FLICK_VELOCITY_PX_S && releaseSpeed >= FLICK_VELOCITY_PX_S * 0.3) {
        index = startIndex + direction;
      }

      const currentIndex = Math.round(scroll / stride);
      const maxIndex = currentIndex + direction * FLICK_MAX_STEPS;
      if (direction > 0) {
        index = Math.min(index, maxIndex);
      } else {
        index = Math.max(index, maxIndex);
      }

      gestureDelta = 0;
      samples = [];

      const target = index * stride;
      const distance = Math.abs(target - scroll);
      onPhotoChange(wrapIndex(index));
      if (distance < 0.5) {
        return;
      }

      const duration = reduceMotion
        ? 0
        : Math.min(0.55, Math.max(SNAP_DURATION_S, distance / FLICK_PX_PER_S));

      // Keep animatedScroll unwrapped so we never take the shorter path
      // around the infinite loop.
      lenis.scrollTo(target, {
        programmatic: false,
        lock: false,
        duration,
        easing: easeOutCubic,
      });
    };

    const beginGesture = () => {
      gestureActive = true;
      gestureDelta = 0;
      samples = [];
      window.clearTimeout(stillTimer);
      startIndex = Math.round(lenis.animatedScroll / Math.max(strideRef.current, 1));
    };

    const applyDelta = (delta: number, now: number) => {
      if (!gestureActive) {
        beginGesture();
      }
      gestureDelta += delta;
      if (Math.abs(delta) < FLICK_MOVE_EPS_PX) {
        return;
      }

      const dt = Math.max(now - (lastEventMs || now), 8);
      lastEventMs = now;
      samples.push({ t: now, v: (delta / dt) * 1000 });
      pruneSamples(now);
      window.clearTimeout(stillTimer);
      stillTimer = setTimeout(() => {
        samples = [];
      }, FLICK_VELOCITY_WINDOW_MS);
    };

    const onVirtualScroll = ({ deltaX, deltaY, event }: { deltaX: number; deltaY: number; event: Event }) => {
      if (dragging) {
        return;
      }

      const touching = event.type === 'touchstart' || event.type === 'touchmove';
      const touchEnded = event.type === 'touchend' || event.type === 'touchcancel';
      if (!touchEnded) {
        const delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
        applyDelta(delta, performance.now());
      }

      window.clearTimeout(settleTimer);
      if (touching) {
        queueMicrotask(() => {
          lenis.raf(performance.now());
        });
        return;
      }

      settleTimer = setTimeout(snapToRest, reduceMotionRef.current || touchEnded ? 0 : SNAP_SETTLE_MS);
    };

    const wrapper = lenis.rootElement;
    let pending = false;
    let lastX = 0;
    let originX = 0;
    let originY = 0;
    let pointerId = 0;

    const stopDrag = () => {
      if (!pending && !dragging) {
        return;
      }
      pending = false;
      const wasDragging = dragging;
      dragging = false;
      wrapper.classList.remove('cursor-grabbing');
      try {
        wrapper.releasePointerCapture(pointerId);
      } catch {
        // already released
      }
      if (wasDragging) {
        snapToRest();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.button !== 0) {
        return;
      }

      pending = true;
      dragging = false;
      pointerId = event.pointerId;
      lastX = event.clientX;
      originX = event.clientX;
      originY = event.clientY;
      window.clearTimeout(settleTimer);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pending && !dragging) {
        return;
      }
      if (event.pointerId !== pointerId) {
        return;
      }

      if (pending) {
        const dx = event.clientX - originX;
        const dy = event.clientY - originY;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
          return;
        }
        if (Math.abs(dy) > Math.abs(dx)) {
          pending = false;
          return;
        }
        pending = false;
        dragging = true;
        lastX = event.clientX;
        beginGesture();
        wrapper.classList.add('cursor-grabbing');
        wrapper.setPointerCapture(event.pointerId);
      }

      const dx = event.clientX - lastX;
      lastX = event.clientX;
      if (dx === 0) {
        return;
      }

      const delta = -dx;
      applyDelta(delta, performance.now());
      lenis.scrollTo(lenis.animatedScroll + delta, {
        programmatic: false,
        lock: false,
        lerp: 0,
      });
      lenis.raf(performance.now());
      event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pending || dragging) {
        if (pointerId !== 0 && event.pointerId !== pointerId) {
          return;
        }
        stopDrag();
        return;
      }

      if (gestureActive) {
        window.clearTimeout(settleTimer);
        snapToRest();
      }
    };

    const onWindowTouchEnd = () => {
      if (pending || dragging) {
        return;
      }
      if (gestureActive) {
        window.clearTimeout(settleTimer);
        snapToRest();
      }
    };

    lenis.on('virtual-scroll', onVirtualScroll);
    wrapper.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, CAPTURE_PASSIVE);
    window.addEventListener('pointercancel', onPointerUp, CAPTURE_PASSIVE);
    window.addEventListener('touchend', onWindowTouchEnd, CAPTURE_PASSIVE);
    window.addEventListener('touchcancel', onWindowTouchEnd, CAPTURE_PASSIVE);

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(stillTimer);
      lenis.off('virtual-scroll', onVirtualScroll);
      wrapper.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp, CAPTURE_PASSIVE);
      window.removeEventListener('pointercancel', onPointerUp, CAPTURE_PASSIVE);
      window.removeEventListener('touchend', onWindowTouchEnd, CAPTURE_PASSIVE);
      window.removeEventListener('touchcancel', onWindowTouchEnd, CAPTURE_PASSIVE);
    };
  }, [hasStride, lenis, onPhotoChange]);

  useLenis((instance) => {
    lenisRef.current = instance;
  });

  return null;
}

const PhotosStage = memo(function PhotosStage({
  textures,
  width,
  height,
  stride,
  loopWidth,
  reduceMotion,
  lenisRef,
  paramsRef,
  overlayRef,
  inView,
  onPhotoChange,
  onReady,
}: {
  textures: THREE.Texture[];
  width: number;
  height: number;
  stride: number;
  loopWidth: number;
  reduceMotion: boolean;
  lenisRef: React.MutableRefObject<Lenis | undefined>;
  paramsRef: React.RefObject<PhotoDistortParams>;
  overlayRef: React.MutableRefObject<THREE.Vector4>;
  inView: boolean;
  onPhotoChange: (index: number) => void;
  onReady: () => void;
}) {
  const canvasStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      inset: 0,
      width,
      height,
      pointerEvents: 'none' as const,
    }),
    [height, width],
  );

  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      gl.setClearColor(0x000000, 0);
      requestAnimationFrame(() => {
        requestAnimationFrame(onReady);
      });
    },
    [onReady],
  );

  return (
    <>
      <Canvas
        orthographic
        flat
        frameloop={inView ? 'always' : 'never'}
        dpr={CANVAS_DPR}
        gl={CANVAS_GL}
        camera={CANVAS_CAMERA}
        style={canvasStyle}
        onCreated={handleCreated}
      >
        <CarouselScene
          textures={textures}
          lenisRef={lenisRef}
          stride={stride}
          loopWidth={loopWidth}
          width={width}
          height={height}
          reduceMotion={reduceMotion}
          paramsRef={paramsRef}
          overlayRef={overlayRef}
        />
      </Canvas>

      <ReactLenis
        className="absolute inset-0 z-10 cursor-grab touch-pan-x overflow-hidden rounded-md select-none [&>div]:h-full [&>div]:w-max"
        options={LENIS_OPTIONS}
        aria-hidden
      >
        <LenisSync
          lenisRef={lenisRef}
          stride={stride}
          loopWidth={loopWidth}
          reduceMotion={reduceMotion}
          onPhotoChange={onPhotoChange}
        />
        <div aria-hidden className="h-full shrink-0" style={{ width: loopWidth + width }} />
      </ReactLenis>
    </>
  );
});

export default function PhotosCardWebgl({
  params = defaultPhotoDistortParams,
}: {
  params?: PhotoDistortParams;
}) {
  const [photo, setPhoto] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [inView, setInView] = useState(true);
  const mounted = useDidMount();
  const { ref: containerRef, dimensions } = useResizeRef<HTMLDivElement>();
  const stageRef = useRef<HTMLDivElement>(null);
  const carouselFocusedRef = useRef(false);
  const lenisRef = useRef<Lenis | undefined>(undefined);
  const photoRef = useRef(0);
  const overlayRef = useRef(new THREE.Vector4(0, 0, 0, 0.1));
  const paramsRef = useRef(params);
  const reduceMotionRef = useRef(false);
  const strideRef = useRef(0);
  paramsRef.current = params;
  const reduceMotion = useMatchMedia('(prefers-reduced-motion: reduce)');
  reduceMotionRef.current = reduceMotion;
  usePanelOverlay(overlayRef);

  const width = Math.round(dimensions.width);
  const height = Math.round(dimensions.height);
  const stride = (width || 0) + GAP_PX;
  strideRef.current = stride;
  const loopWidth = PHOTO_COUNT * stride;
  const canRender = mounted && width > 0 && height > 0 && textures !== null;

  useEffect(() => {
    let cancelled = false;

    loadTextures()
      .then((loaded) => {
        if (!cancelled) {
          setTextures(loaded);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePhotoChange = useCallback((index: number) => {
    if (photoRef.current === index) {
      return;
    }

    photoRef.current = index;
    setPhoto(index);
    if (carouselFocusedRef.current) {
      setLiveText(`Photo ${index + 1} of ${PHOTO_COUNT}`);
    }
  }, []);

  const handleStageReady = useCallback(() => {
    setStageReady(true);
    if (reduceMotionRef.current) {
      setShowPlaceholder(false);
    }
  }, []);

  useEffect(() => {
    if (!stageReady || !showPlaceholder || reduceMotion) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowPlaceholder(false);
    }, 600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [reduceMotion, showPlaceholder, stageReady]);

  const scrollToPhoto = useCallback((index: number) => {
    const lenis = lenisRef.current;
    const nextStride = strideRef.current;
    if (!lenis || nextStride <= 1) {
      return;
    }

    handlePhotoChange(index);
    const prefersReduced = reduceMotionRef.current;
    lenis.scrollTo(index * nextStride, {
      immediate: prefersReduced,
      duration: prefersReduced ? 0 : SNAP_DURATION_S,
      easing: easeOutCubic,
    });
  }, [handlePhotoChange]);

  const handleKeyNavigate = useCallback(
    (delta: number) => {
      scrollToPhoto(wrapIndex(photoRef.current + delta));
    },
    [scrollToPhoto],
  );

  return (
    <Card className="flex flex-col gap-5">
      <div className="xxs:flex-row xxs:items-center flex flex-col items-start justify-between gap-2">
        <CardTitle variant="mono">Camera roll</CardTitle>
        <div className="flex items-center justify-center gap-[6px]" aria-hidden>
          {photos.map((item, index) => (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => scrollToPhoto(index)}
              key={item.src}
              className={cn('h-[10px] rounded-full transition-all duration-150', {
                'bg-panel-overlay w-[10px]': index !== photo,
                'bg-theme-1 h-[6px] w-[30px]': index === photo,
              })}
            />
          ))}
        </div>
      </div>

      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={`Camera roll, photo ${photo + 1} of ${PHOTO_COUNT}`}
        aria-describedby="camera-roll-keys"
        tabIndex={0}
        onFocus={() => {
          carouselFocusedRef.current = true;
        }}
        onBlur={() => {
          carouselFocusedRef.current = false;
          setLiveText('');
        }}
        onMouseDown={(event) => {
          event.currentTarget.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            handleKeyNavigate(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            handleKeyNavigate(-1);
          }
        }}
        className="relative aspect-square w-full rounded-md focus-visible:ring-2 focus-visible:ring-theme-1 focus-visible:outline-none"
      >
        <p id="camera-roll-keys" className="sr-only">
          Use left and right arrow keys to change photos.
        </p>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveText}
        </div>
        {showPlaceholder ? <PhotoPlaceholder /> : null}
        <div
          ref={containerRef}
          className={cn(
            'absolute inset-0 overflow-hidden rounded-md touch-pan-y',
            !reduceMotion && 'transition-opacity duration-500 ease-out',
            stageReady ? 'opacity-100' : 'opacity-0',
            (!stageReady || showPlaceholder) && 'pointer-events-none',
          )}
          onTransitionEnd={(event) => {
            if (event.propertyName === 'opacity' && stageReady) {
              setShowPlaceholder(false);
            }
          }}
        >
          {canRender ? (
            <PhotosStage
              textures={textures}
              width={width}
              height={height}
              stride={stride}
              loopWidth={loopWidth}
              reduceMotion={reduceMotion}
              lenisRef={lenisRef}
              paramsRef={paramsRef}
              overlayRef={overlayRef}
              inView={inView}
              onPhotoChange={handlePhotoChange}
              onReady={handleStageReady}
            />
          ) : null}
        </div>
      </div>
    </Card>
  );
}

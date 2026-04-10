'use client';

import { useDialKit } from 'dialkit';
import { motion, useAnimation, useDragControls } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn } from '~/src/util';

const vertexShaderSource = `
attribute vec2 aPosition;
varying vec2 vQuadUV;

void main() {
  vQuadUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

varying vec2 vQuadUV;

uniform sampler2D uSourceTex;
uniform vec2 uSourceSizePx;
uniform vec2 uLensCenterPx;
uniform float uLensMagnification;
uniform float uLensIOR;
uniform float uAberrationAmount;
uniform float uLensThickness;
uniform float uBevelStartR;
uniform float uLensRadiusPx;
uniform float uLensOblateness;
uniform float uRefractionDisplacementScale;

const float IOR_AIR = 1.0;
const float EPS = 1e-6;

vec2 calcPixelOffsetUV(vec2 unitDiskCoords, vec2 invSourceSizePx) {
  vec2 pixelOffset = unitDiskCoords * uLensRadiusPx;
  return pixelOffset * invSourceSizePx;
}

vec2 calcMagnificationUVOffset(vec2 unitDiskCoords, vec2 invSourceSizePx) {
  return calcPixelOffsetUV(unitDiskCoords, invSourceSizePx) / max(EPS, uLensMagnification);
}

void calcFrontSurfacePointAndNormal(vec2 unitDiskCoords, float zScale, out vec3 frontPoint, out vec3 frontNormal) {
  float radiusSq = dot(unitDiskCoords, unitDiskCoords);
  float zAxisDepth = zScale * sqrt(max(0.0, 1.0 - radiusSq));
  frontPoint = vec3(unitDiskCoords, zAxisDepth);
  frontNormal = normalize(vec3(unitDiskCoords, zAxisDepth / (zScale * zScale)));
}

bool intersectBackEllipsoid(vec3 rayOrigin, vec3 rayDir, float thickness, float zScale, out vec3 hitPoint) {
  vec3 backCenter = vec3(0.0, 0.0, -thickness);
  vec3 originToCenter = rayOrigin - backCenter;

  float zScaleSq = zScale * zScale;
  float quadA = dot(rayDir.xy, rayDir.xy) + (rayDir.z * rayDir.z) / zScaleSq;
  float quadB = 2.0 * (dot(originToCenter.xy, rayDir.xy) + (originToCenter.z * rayDir.z) / zScaleSq);
  float quadC = dot(originToCenter.xy, originToCenter.xy) + (originToCenter.z * originToCenter.z) / zScaleSq - 1.0;

  float discriminant = quadB * quadB - 4.0 * quadA * quadC;
  if (discriminant < 0.0) {
    return false;
  }

  float sqrtDiscriminant = sqrt(max(0.0, discriminant));
  float tNear = (-quadB - sqrtDiscriminant) / (2.0 * quadA);
  float tFar = (-quadB + sqrtDiscriminant) / (2.0 * quadA);

  float hitTime = tNear > EPS ? tNear : tFar;
  if (hitTime <= 0.0) {
    return false;
  }

  hitPoint = rayOrigin + rayDir * hitTime;
  return true;
}

vec3 calcBackEllipsoidNormal(vec3 backPoint, float thickness, float zScale) {
  vec3 backCenter = vec3(0.0, 0.0, -thickness);
  vec3 local = backPoint - backCenter;
  float zScaleSq = zScale * zScale;
  return normalize(vec3(local.xy, local.z / zScaleSq));
}

vec2 traceRefractionDisplInRadii(vec2 unitDiskCoords, float ior, float zScale, float thickness) {
  vec3 frontPoint;
  vec3 frontNormal;
  calcFrontSurfacePointAndNormal(unitDiskCoords, zScale, frontPoint, frontNormal);

  vec3 incomingAirDir = vec3(0.0, 0.0, -1.0);
  vec3 dirInsideGlass = refract(incomingAirDir, frontNormal, IOR_AIR / ior);
  if (length(dirInsideGlass) < EPS) {
    return vec2(0.0);
  }

  vec3 backSurfacePoint;
  bool didHit = intersectBackEllipsoid(frontPoint, dirInsideGlass, thickness, zScale, backSurfacePoint);
  if (!didHit) {
    return vec2(0.0);
  }

  vec3 backSurfaceNormal = calcBackEllipsoidNormal(backSurfacePoint, thickness, zScale);
  vec3 outgoingAirDir = refract(dirInsideGlass, -backSurfaceNormal, ior / IOR_AIR);
  if (length(outgoingAirDir) < EPS) {
    return vec2(0.0);
  }

  float timeToImagePlane = -backSurfacePoint.z / outgoingAirDir.z;
  vec2 projectedXY = backSurfacePoint.xy + outgoingAirDir.xy * timeToImagePlane;
  return (projectedXY - unitDiskCoords) * uRefractionDisplacementScale;
}

vec3 calcShadingNormal(vec2 unitDiskCoords, float zAxisDepth) {
  return normalize(vec3(-unitDiskCoords, zAxisDepth));
}

void main() {
  vec2 invSourceSizePx = 1.0 / uSourceSizePx;
  vec2 sourceCenterUV = uLensCenterPx * invSourceSizePx;
  sourceCenterUV.y = 1.0 - sourceCenterUV.y;

  vec2 unitDiskCoords = vQuadUV * 2.0 - 1.0;
  float radiusSq = dot(unitDiskCoords, unitDiskCoords);
  float radius = sqrt(radiusSq);
  if (radius > 1.0) {
    discard;
  }

  float zScale = clamp(uLensOblateness, 0.2, 1.0);
  vec2 magnificationUVOffset = calcMagnificationUVOffset(unitDiskCoords, invSourceSizePx);

  float iorRed = uLensIOR - uAberrationAmount;
  float iorGreen = uLensIOR;
  float iorBlue = uLensIOR + uAberrationAmount;

  vec2 displRadiiRed = traceRefractionDisplInRadii(unitDiskCoords, iorRed, zScale, uLensThickness);
  vec2 displRadiiGreen = traceRefractionDisplInRadii(unitDiskCoords, iorGreen, zScale, uLensThickness);
  vec2 displRadiiBlue = traceRefractionDisplInRadii(unitDiskCoords, iorBlue, zScale, uLensThickness);

  vec2 displUVRed = calcPixelOffsetUV(displRadiiRed, invSourceSizePx);
  vec2 displUVGreen = calcPixelOffsetUV(displRadiiGreen, invSourceSizePx);
  vec2 displUVBlue = calcPixelOffsetUV(displRadiiBlue, invSourceSizePx);

  float rimFeatherAmount = smoothstep(uBevelStartR, 1.0, radius);
  float edgeDisplAttenuation = 1.0 - rimFeatherAmount * 0.12;

  vec2 uvRed = sourceCenterUV + magnificationUVOffset + displUVRed * edgeDisplAttenuation;
  vec2 uvGreen = sourceCenterUV + magnificationUVOffset + displUVGreen * edgeDisplAttenuation;
  vec2 uvBlue = sourceCenterUV + magnificationUVOffset + displUVBlue * edgeDisplAttenuation;

  uvRed = vec2(uvRed.x, 1.0 - uvRed.y);
  uvGreen = vec2(uvGreen.x, 1.0 - uvGreen.y);
  uvBlue = vec2(uvBlue.x, 1.0 - uvBlue.y);

  vec3 refractedCol = vec3(
    texture2D(uSourceTex, uvRed).r,
    texture2D(uSourceTex, uvGreen).g,
    texture2D(uSourceTex, uvBlue).b
  );

  float zAxisDepth = sqrt(max(0.0, 1.0 - radiusSq));
  vec3 shadingNormal = calcShadingNormal(unitDiskCoords, zAxisDepth);
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 lightDir = normalize(vec3(0.35, 0.55, 1.0));

  float fresnelReflectanceAtNormal = pow((uLensIOR - 1.0) / (uLensIOR + 1.0), 2.0);
  float viewDotNormal = clamp(dot(viewDir, shadingNormal), 0.0, 1.0);
  float fresnel = fresnelReflectanceAtNormal + (1.0 - fresnelReflectanceAtNormal) * pow(1.0 - viewDotNormal, 5.0);

  vec3 halfVec = normalize(viewDir + lightDir);
  float specular = pow(max(dot(shadingNormal, halfVec), 0.0), 80.0) * 0.35;
  float rimBoostAmount = smoothstep(0.78, 0.98, radius) * 0.5;
  float innerDimAmount = smoothstep(0.55, 1.0, radius) * 0.18;

  vec3 highlightCol = vec3(specular * fresnel) + vec3(rimBoostAmount * fresnel);
  vec3 shadedCol = refractedCol * (1.0 - innerDimAmount) + highlightCol;

  gl_FragColor = vec4(shadedCol, 1.0);
}
`;

type HtmlInCanvasCanvas = HTMLCanvasElement & {
  requestPaint: () => void;
  onpaint: ((event: Event) => void) | null;
};

type HtmlInCanvasGL = WebGLRenderingContext & {
  texElementImage2D: (
    target: number,
    level: number,
    internalformat: number,
    format: number,
    type: number,
    element: Element,
  ) => void;
};

type GLState = {
  gl: HtmlInCanvasGL;
  texture: WebGLTexture;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

type CloneSyncState = {
  cloneRoot: HTMLElement | null;
  sourceToClone: WeakMap<Node, Node>;
  rootCustomProperties: string[];
};

type SiteMagnifierStore = {
  coords: { x: number; y: number };
  angle: number;
  scale: number;
  setCoords: (coords: { x: number; y: number }) => void;
  setAngle: (angle: number) => void;
  setScale: (scale: number) => void;
};

const useSiteMagnifierStore = create<SiteMagnifierStore>((set) => ({
  coords: { x: 0, y: 0 },
  angle: 0,
  scale: 2,
  setCoords: (coords) => set({ coords }),
  setAngle: (angle) => set({ angle }),
  setScale: (scale) => set({ scale }),
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Failed to create shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Unknown shader error.');
  }

  return shader;
}

function initGL(canvas: HtmlInCanvasCanvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
  }) as HtmlInCanvasGL | null;

  if (!gl) {
    throw new Error('Failed to create WebGL context.');
  }

  const program = gl.createProgram();
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (!program) {
    throw new Error('Failed to create shader program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const positionLocation = gl.getAttribLocation(program, 'aPosition');

  if (!buffer || !texture) {
    throw new Error('Failed to allocate GL resources.');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, 'uSourceTex'), 0);

  return {
    gl,
    texture,
    uniforms: {
      uSourceSizePx: gl.getUniformLocation(program, 'uSourceSizePx'),
      uLensCenterPx: gl.getUniformLocation(program, 'uLensCenterPx'),
      uLensMagnification: gl.getUniformLocation(program, 'uLensMagnification'),
      uLensIOR: gl.getUniformLocation(program, 'uLensIOR'),
      uAberrationAmount: gl.getUniformLocation(program, 'uAberrationAmount'),
      uLensThickness: gl.getUniformLocation(program, 'uLensThickness'),
      uBevelStartR: gl.getUniformLocation(program, 'uBevelStartR'),
      uLensRadiusPx: gl.getUniformLocation(program, 'uLensRadiusPx'),
      uLensOblateness: gl.getUniformLocation(program, 'uLensOblateness'),
      uRefractionDisplacementScale: gl.getUniformLocation(program, 'uRefractionDisplacementScale'),
    },
  } satisfies GLState;
}

function createEmptyCloneSyncState(): CloneSyncState {
  return {
    cloneRoot: null,
    sourceToClone: new WeakMap(),
    rootCustomProperties: [],
  };
}

function buildCloneMappings(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const sourceNodes: Node[] = [sourceRoot];
  const cloneNodes: Node[] = [cloneRoot];
  const sourceToClone = new WeakMap<Node, Node>();

  while (sourceNodes.length > 0) {
    const sourceNode = sourceNodes.shift()!;
    const cloneNode = cloneNodes.shift();

    if (!cloneNode) {
      break;
    }

    sourceToClone.set(sourceNode, cloneNode);

    sourceNodes.push(...Array.from(sourceNode.childNodes));
    cloneNodes.push(...Array.from(cloneNode.childNodes));
  }

  return {
    cloneRoot,
    sourceToClone,
    rootCustomProperties: [],
  } satisfies CloneSyncState;
}

function syncElementAttribute(
  sourceElement: Element,
  cloneElement: Element,
  attributeName: string,
) {
  const nextValue = sourceElement.getAttribute(attributeName);

  if (nextValue === null) {
    cloneElement.removeAttribute(attributeName);
    return;
  }

  cloneElement.setAttribute(attributeName, nextValue);
}

function syncElementAttributes(sourceElement: Element, cloneElement: Element) {
  const cloneAttributeNames = new Set(cloneElement.getAttributeNames());

  sourceElement.getAttributeNames().forEach((attributeName) => {
    syncElementAttribute(sourceElement, cloneElement, attributeName);
    cloneAttributeNames.delete(attributeName);
  });

  cloneAttributeNames.forEach((attributeName) => {
    cloneElement.removeAttribute(attributeName);
  });
}

function syncSourceThemeStyles(
  sourceRoot: HTMLElement,
  sourceHost: HTMLElement,
  cloneRoot: HTMLElement | null,
  state: CloneSyncState,
) {
  const rootStyles = window.getComputedStyle(document.documentElement);
  const sourceRootStyles = window.getComputedStyle(sourceRoot);
  const resolvedRootBackground = rootStyles.backgroundColor;
  const resolvedSourceBackground = sourceRootStyles.backgroundColor;
  const hostBackground =
    resolvedSourceBackground && resolvedSourceBackground !== 'rgba(0, 0, 0, 0)'
      ? resolvedSourceBackground
      : resolvedRootBackground;

  sourceHost.style.colorScheme = rootStyles.colorScheme;
  sourceHost.style.backgroundColor = hostBackground;
  sourceHost.style.color = sourceRootStyles.color;

  state.rootCustomProperties.forEach((propertyName) => {
    sourceHost.style.removeProperty(propertyName);
  });

  const nextRootCustomProperties: string[] = [];
  for (let index = 0; index < rootStyles.length; index += 1) {
    const propertyName = rootStyles[index];

    if (!propertyName.startsWith('--')) {
      continue;
    }

    nextRootCustomProperties.push(propertyName);
    sourceHost.style.setProperty(propertyName, rootStyles.getPropertyValue(propertyName));
  }

  state.rootCustomProperties = nextRootCustomProperties;

  if (cloneRoot) {
    cloneRoot.style.backgroundColor = hostBackground;
    cloneRoot.style.color = sourceRootStyles.color;
  }
}

function clonePageIntoSource(
  sourceRoot: HTMLElement,
  sourceHost: HTMLElement,
  state: CloneSyncState,
) {
  const clone = sourceRoot.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-magnifier-root');
  clone.setAttribute('aria-hidden', 'true');
  clone.style.margin = '0';
  clone.style.pointerEvents = 'none';
  clone.style.width = '100%';
  clone.style.minHeight = '100%';

  const rect = sourceRoot.getBoundingClientRect();

  sourceHost.style.width = `${rect.width}px`;
  sourceHost.style.height = `${rect.height}px`;
  sourceHost.style.minHeight = `${rect.height}px`;
  sourceHost.replaceChildren(clone);
  const nextState = buildCloneMappings(sourceRoot, clone);
  syncSourceThemeStyles(sourceRoot, sourceHost, clone, nextState);

  state.cloneRoot = nextState.cloneRoot;
  state.sourceToClone = nextState.sourceToClone;
  state.rootCustomProperties = nextState.rootCustomProperties;

  return rect;
}

/**
 * not very optimized, very very spaghetti, proceed carefully! :)
 * quick codex port of `src/app/stamps/components/Stamps/Loupe`.
 * uses the new html-in-canvas proposal, requires chrome canary with the
 * `chrome://flags/#canvas-draw-element` flag enabled.
 * https://github.com/WICG/html-in-canvas
 */
export default function LensClone({
  cloneSelector = '[data-lens-root]',
}: {
  cloneSelector?: string;
}) {
  const [spawnPosition, setSpawnPosition] = useState({ x: 0, y: 0 });
  const [isTextureReady, setIsTextureReady] = useState(false);
  const lensParams = useDialKit('Shop Lens', {
    open: true,
    radius: [180, 72, 220, 1],
    magnification: [1.75, 1, 4, 0.05],
    ior: [1.52, 1, 2.5, 0.001],
    aberration: [0.01, 0, 0.03, 0.0005],
    thickness: [0.9, 0.1, 1.5, 0.01],
    bevelStart: [0.9, 0.5, 0.99, 0.005],
    oblateness: [0.65, 0.2, 1, 0.01],
    refractionDisplacement: [0.6, 0, 1.5, 0.01],
  });
  const open = lensParams.open;
  const isMobile = useMatchMedia('(max-width: 767px)');
  const setCoords = useSiteMagnifierStore((s) => s.setCoords);
  const canvasRef = useRef<HtmlInCanvasCanvas>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const lensFrameRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const glStateRef = useRef<GLState | null>(null);
  const cloneSyncStateRef = useRef<CloneSyncState>(createEmptyCloneSyncState());
  const sourceSizeRef = useRef({ width: 1, height: 1 });
  const coordsRef = useRef(useSiteMagnifierStore.getState().coords);
  const isTextureReadyRef = useRef(false);
  const readyFrameRef = useRef<number | null>(null);
  const warmupFrameRef = useRef<number | null>(null);
  const lensParamsRef = useRef(lensParams);
  const dragControls = useDragControls();
  const lensControls = useAnimation();

  const lensRadius = lensParams.radius;
  const lensSize = lensRadius * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.setAttribute('layoutsubtree', '');
    glStateRef.current = initGL(canvas);
  }, []);

  useEffect(() => {
    return useSiteMagnifierStore.subscribe((state) => {
      coordsRef.current = state.coords;
    });
  }, []);

  useEffect(() => {
    lensParamsRef.current = lensParams;
    canvasRef.current?.requestPaint();
  }, [lensParams]);

  const updateLensCenterFromFrame = useCallback(() => {
    const sourceRoot = document.querySelector<HTMLElement>(cloneSelector);
    const lensRect = lensFrameRef.current?.getBoundingClientRect();

    if (!sourceRoot || !lensRect) {
      return;
    }

    const sourceRect = sourceRoot.getBoundingClientRect();
    setCoords({
      x: clamp(lensRect.left + lensRect.width * 0.5 - sourceRect.left, 0, sourceRect.width),
      y: clamp(lensRect.top + lensRect.height * 0.5 - sourceRect.top, 0, sourceRect.height),
    });
  }, [setCoords]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const canvas = canvasRef.current;
    const sourceHost = sourceRef.current;
    const sourceRoot = document.querySelector<HTMLElement>(cloneSelector);
    const glState = glStateRef.current;

    if (!canvas || !sourceHost || !sourceRoot || !glState) {
      return;
    }

    const cloneSyncState = cloneSyncStateRef.current;

    const syncSource = (preserveLensCenter = true) => {
      const rect = clonePageIntoSource(sourceRoot, sourceHost, cloneSyncState);
      sourceSizeRef.current = {
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      };

      if (preserveLensCenter) {
        updateLensCenterFromFrame();
      } else {
        setCoords({
          x: rect.width * 0.5,
          y: rect.height * 0.35,
        });
      }
    };

    const renderLens = () => {
      const dpr = Math.max(2, Math.min(window.devicePixelRatio || 1, 4));
      const drawSize = Math.round(lensSize * dpr);

      if (canvas.width !== drawSize || canvas.height !== drawSize) {
        canvas.width = drawSize;
        canvas.height = drawSize;
      }

      glState.gl.viewport(0, 0, canvas.width, canvas.height);
      glState.gl.clearColor(0, 0, 0, 0);
      glState.gl.clear(glState.gl.COLOR_BUFFER_BIT);
      glState.gl.bindTexture(glState.gl.TEXTURE_2D, glState.texture);
      try {
        glState.gl.texElementImage2D(
          glState.gl.TEXTURE_2D,
          0,
          glState.gl.RGBA,
          glState.gl.RGBA,
          glState.gl.UNSIGNED_BYTE,
          sourceHost,
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('No cached paint record for element')
        ) {
          if (warmupFrameRef.current !== null) {
            window.cancelAnimationFrame(warmupFrameRef.current);
          }
          warmupFrameRef.current = window.requestAnimationFrame(() => {
            warmupFrameRef.current = null;
            requestRender();
          });
          return;
        }

        throw error;
      }

      glState.gl.uniform2f(
        glState.uniforms.uSourceSizePx,
        sourceSizeRef.current.width,
        sourceSizeRef.current.height,
      );
      glState.gl.uniform2f(
        glState.uniforms.uLensCenterPx,
        coordsRef.current.x,
        coordsRef.current.y,
      );
      glState.gl.uniform1f(
        glState.uniforms.uLensMagnification,
        lensParamsRef.current.magnification,
      );
      glState.gl.uniform1f(glState.uniforms.uLensIOR, lensParamsRef.current.ior);
      glState.gl.uniform1f(glState.uniforms.uAberrationAmount, lensParamsRef.current.aberration);
      glState.gl.uniform1f(glState.uniforms.uLensThickness, lensParamsRef.current.thickness);
      glState.gl.uniform1f(glState.uniforms.uBevelStartR, lensParamsRef.current.bevelStart);
      glState.gl.uniform1f(glState.uniforms.uLensRadiusPx, lensParamsRef.current.radius);
      glState.gl.uniform1f(glState.uniforms.uLensOblateness, lensParamsRef.current.oblateness);
      glState.gl.uniform1f(
        glState.uniforms.uRefractionDisplacementScale,
        lensParamsRef.current.refractionDisplacement,
      );
      glState.gl.drawArrays(glState.gl.TRIANGLE_STRIP, 0, 4);

      if (!isTextureReadyRef.current) {
        isTextureReadyRef.current = true;
        readyFrameRef.current = window.requestAnimationFrame(() => {
          readyFrameRef.current = null;
          setIsTextureReady(true);
        });
      }
    };

    const requestRender = () => {
      canvas.requestPaint();
    };

    let fullSyncScheduled = false;
    let fullSyncTimeoutId: number | null = null;
    let renderScheduled = false;
    let themeSyncScheduled = false;

    const scheduleFullSync = (delayMs = 80) => {
      if (fullSyncTimeoutId !== null) {
        window.clearTimeout(fullSyncTimeoutId);
      }

      fullSyncScheduled = true;
      fullSyncTimeoutId = window.setTimeout(() => {
        fullSyncScheduled = false;
        fullSyncTimeoutId = null;
        syncSource();
        requestRender();
      }, delayMs);
    };

    const scheduleRender = () => {
      if (fullSyncScheduled || renderScheduled) {
        return;
      }

      renderScheduled = true;
      window.requestAnimationFrame(() => {
        renderScheduled = false;
        syncSourceMetrics();
        requestRender();
      });
    };

    const scheduleThemeSync = () => {
      if (fullSyncScheduled || themeSyncScheduled) {
        return;
      }

      themeSyncScheduled = true;
      window.requestAnimationFrame(() => {
        themeSyncScheduled = false;

        if (!cloneSyncState.cloneRoot) {
          scheduleFullSync(0);
          return;
        }

        syncSourceThemeStyles(sourceRoot, sourceHost, cloneSyncState.cloneRoot, cloneSyncState);
        requestRender();
      });
    };

    const syncSourceMetrics = (preserveLensCenter = true) => {
      const cloneRoot = cloneSyncState.cloneRoot;

      if (!cloneRoot) {
        return;
      }

      const rect = sourceRoot.getBoundingClientRect();
      sourceHost.style.width = `${Math.max(1, rect.width)}px`;
      sourceHost.style.height = `${Math.max(1, rect.height)}px`;
      sourceHost.style.minHeight = `${Math.max(1, rect.height)}px`;
      cloneRoot.style.backgroundColor = sourceHost.style.backgroundColor;

      sourceSizeRef.current = {
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      };

      if (preserveLensCenter) {
        updateLensCenterFromFrame();
      }
    };

    canvas.onpaint = () => {
      renderLens();
    };

    syncSource(false);
    warmupFrameRef.current = window.requestAnimationFrame(() => {
      warmupFrameRef.current = null;
      requestRender();
    });

    const resizeObserver = new ResizeObserver(() => {
      scheduleFullSync(0);
    });
    resizeObserver.observe(sourceRoot);

    const mutationObserver = new MutationObserver((records) => {
      let needsFullSync = false;

      records.forEach((record) => {
        if (needsFullSync) {
          return;
        }

        if (record.type === 'childList') {
          needsFullSync = true;
          return;
        }

        if (record.type === 'characterData') {
          const cloneText = cloneSyncState.sourceToClone.get(record.target);
          if (cloneText) {
            cloneText.textContent = record.target.textContent;
            return;
          }

          needsFullSync = true;
          return;
        }

        if (record.type === 'attributes') {
          const sourceElement = record.target as Element;
          const cloneElement = cloneSyncState.sourceToClone.get(sourceElement);

          if (!(cloneElement instanceof Element)) {
            needsFullSync = true;
            return;
          }

          if (record.attributeName) {
            syncElementAttribute(sourceElement, cloneElement, record.attributeName);
          } else {
            syncElementAttributes(sourceElement, cloneElement);
          }
        }
      });

      if (needsFullSync) {
        scheduleFullSync();
        return;
      }

      scheduleRender();
    });
    mutationObserver.observe(sourceRoot, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });

    const rootMutationObserver = new MutationObserver(() => {
      scheduleThemeSync();
    });
    rootMutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    const handleWindowResize = () => {
      scheduleFullSync(0);
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', scheduleRender, {
      passive: true,
    });

    return () => {
      canvas.onpaint = null;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      rootMutationObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', scheduleRender);
      if (fullSyncTimeoutId !== null) {
        window.clearTimeout(fullSyncTimeoutId);
      }
      if (readyFrameRef.current !== null) {
        window.cancelAnimationFrame(readyFrameRef.current);
        readyFrameRef.current = null;
      }
      if (warmupFrameRef.current !== null) {
        window.cancelAnimationFrame(warmupFrameRef.current);
        warmupFrameRef.current = null;
      }
      sourceHost.replaceChildren();
      cloneSyncStateRef.current = createEmptyCloneSyncState();
      isTextureReadyRef.current = false;
      setIsTextureReady(false);
    };
  }, [lensSize, open, setCoords, updateLensCenterFromFrame]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    setSpawnPosition({
      x: Math.max(0, (overlay.clientWidth - lensSize) * 0.5),
      y: Math.max(0, (overlay.clientHeight - lensSize) * 0.5),
    });
  }, [lensSize]);

  useEffect(() => {
    if (!isTextureReady) {
      return;
    }

    if (open) {
      lensControls.start({
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
          duration: 0.2,
        },
      });
      return;
    }

    lensControls.start({
      opacity: 0,
      filter: 'blur(10px)',
      transition: {
        duration: 0.16,
      },
    });
  }, [isTextureReady, lensControls, open]);

  return (
    <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-40">
      <motion.div
        ref={lensFrameRef}
        initial={{
          opacity: 0,
          filter: 'blur(10px)',
        }}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragElastic={0.01}
        dragMomentum={false}
        dragConstraints={overlayRef}
        animate={lensControls}
        onDrag={() => {
          const canvas = canvasRef.current;
          if (!canvas) {
            return;
          }

          updateLensCenterFromFrame();
          canvas.requestPaint();
        }}
        className={cn(
          'absolute aspect-square rounded-full shadow-[0_18px_40px_rgba(0,0,0,0.28)] outline-offset-8',
          !isTextureReady && 'invisible',
          open && isTextureReady
            ? 'pointer-events-auto opacity-100 [filter:blur(0px)]'
            : 'pointer-events-none opacity-0 [filter:blur(10px)]',
        )}
        style={{
          x: spawnPosition.x,
          y: spawnPosition.y,
          width: lensSize,
          height: lensSize,
        }}
      >
        <div
          ref={triggerRef}
          role="button"
          tabIndex={0}
          aria-label="Drag magnifier"
          onPointerDown={(event) => dragControls.start(event)}
          className="absolute top-1/2 left-1/2 z-40 aspect-square -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full active:cursor-grabbing"
          style={{ width: lensSize, height: lensSize }}
        />
        <div
          className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
          style={{
            width: lensSize,
            height: lensSize,
          }}
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full rounded-full"
            style={{ width: lensSize, height: lensSize }}
          >
            <div
              ref={sourceRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 overflow-hidden"
            />
          </canvas>
        </div>
      </motion.div>
    </div>
  );
}

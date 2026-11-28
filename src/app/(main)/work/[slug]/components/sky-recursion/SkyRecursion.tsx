'use client';

import { useEffect, useRef, useState } from 'react';

import { CLOUDS, RECURSION, VERTEX } from './shaders';


const AUTO_MAX = 0.7;
const AUTO_SPEED = 0.06;
const START = 0.25;

type Panel = {
  draw: (time: number, s: number, line: RGB) => void;
  dispose: () => void;
};

type RGB = [number, number, number];

function composite(page: string, overlay: string): RGB {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.canvas.width = ctx.canvas.height = 1;
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function backdropColor(el: HTMLElement): RGB {
  let page = 'rgb(0,0,0)';
  for (let n = el.parentElement; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) {
      page = bg;
      break;
    }
  }
  return composite(page, getComputedStyle(el).backgroundColor);
}

function lightThemeBackdrop(): RGB | null {
  const dark = [...document.documentElement.classList].find((c) => /^theme-.*dark$/.test(c));
  if (!dark) return null;
  const probe = document.createElement('div');
  probe.className = dark.replace(/dark$/, 'light');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;background:var(--main-background)';
  const inner = document.createElement('div');
  inner.style.background = 'var(--panel-overlay)';
  probe.appendChild(inner);
  document.body.appendChild(probe);
  const c = composite(getComputedStyle(probe).backgroundColor, getComputedStyle(inner).backgroundColor);
  probe.remove();
  return c;
}

const luma = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

function lineColors(el: HTMLElement): [RGB, RGB] {
  const base = backdropColor(el);
  if (luma(base) >= 0.5) return [base, base];
  const mid = base.map((v) => v + (1 - v) * 0.33) as RGB;
  return [mid, lightThemeBackdrop() ?? mid];
}

function makePanel(canvas: HTMLCanvasElement, theme: number): Panel {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? '');
    return sh;
  };
  const program = (fs: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? '');
    const u: Record<string, WebGLUniformLocation | null> = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i)!.name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  };

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const clouds = program(CLOUDS);
  const recur = program(RECURSION);
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  let tw = 0;
  let th = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width * dpr));
    const h = Math.max(2, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ntw = Math.min(w, 1152);
    const nth = Math.round((ntw * h) / w);
    if (ntw !== tw || nth !== th) {
      tw = ntw;
      th = nth;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    return dpr;
  };

  return {
    draw(time, s, line) {
      const dpr = resize();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, tw, th);
      gl.useProgram(clouds.p);
      gl.uniform2f(clouds.u.uRes, tw, th);
      gl.uniform1f(clouds.u.uTime, time);
      gl.uniform1f(clouds.u.uTheme, theme);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(recur.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(recur.u.uImg, 0);
      gl.uniform2f(recur.u.uRes, canvas.width, canvas.height);
      gl.uniform2f(recur.u.uTexRes, tw, th);
      gl.uniform1f(recur.u.uS, s);
      gl.uniform1f(recur.u.uTheme, theme);
      gl.uniform1f(recur.u.uDpr, dpr);
      gl.uniform1f(recur.u.uTime, time);
      gl.uniform3f(recur.u.uLineCol, line[0], line[1], line[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(tex);
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(buf);
      gl.deleteProgram(clouds.p);
      gl.deleteProgram(recur.p);
    },
  };
}

export function SkyRecursion() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stormRef = useRef<HTMLCanvasElement>(null);
  const dayRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const level = useRef(START);
  const touched = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let panels: Panel[] = [];
    try {
      panels = [makePanel(stormRef.current!, 0), makePanel(dayRef.current!, 1)];
    } catch (e) {
      console.error(e);
      setFailed(true);
      return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let raf = 0;
    let last = performance.now();
    let dir = 1;
    const t0 = performance.now();
    let lines = lineColors(rootRef.current!);
    let frames = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!touched.current && !reduce.matches) {
        let v = level.current + dir * dt * AUTO_SPEED;
        if (v >= AUTO_MAX) [v, dir] = [AUTO_MAX, -1];
        else if (v <= 0) [v, dir] = [0, 1];
        level.current = v;
        if (sliderRef.current) sliderRef.current.value = String(v);
      }
      const time = reduce.matches ? 0 : (now - t0) / 1000;
      if (++frames % 30 === 0) lines = lineColors(rootRef.current!);
      panels.forEach((p, i) => p.draw(time + 20, level.current, lines[i]));
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(rootRef.current!);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      panels.forEach((p) => p.dispose());
    };
  }, []);

  return (
    <div ref={rootRef} className="skyrec">
      <p className="skyrec-title">Gradation levels of imagery</p>
      <div className="skyrec-row">
        <span className="skyrec-label">Sky</span>
        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={1}
          step={0.001}
          defaultValue={START}
          aria-label="Gradation level from sky to recursion"
          onInput={(e) => {
            touched.current = true;
            level.current = Number(e.currentTarget.value);
          }}
          className="skyrec-slider"
        />
        <span className="skyrec-label">Recursion</span>
      </div>
      {failed ? (
        <p className="skyrec-fallback">This interactive needs WebGL2 to run.</p>
      ) : (
        <div className="skyrec-panels">
          {[stormRef, dayRef].map((ref, i) => (
            <div key={i} className="skyrec-item">
              <div className="skyrec-panel">
                <canvas ref={ref} aria-label={i === 0 ? 'Night sky panel' : 'Daylight sky panel'} />
              </div>
              <p className="skyrec-cap">
                {i === 0 ? 'Dark mode theme / Night sky' : 'Light mode theme / Daylight sky'}
              </p>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .skyrec { container-type: inline-size; width: 100%; box-sizing: border-box; padding: 5%; background: var(--panel-overlay); }
        .skyrec-title { margin: 0 0 2.4cqw; color: var(--text-primary); font-size: clamp(13px, 1.9cqw, 20px); font-weight: 500; letter-spacing: -0.01em; line-height: 1.2; }
        .skyrec-row { display: flex; align-items: center; gap: 1.6cqw; margin-bottom: 2.4cqw; }
        .skyrec-label { flex: none; color: var(--text-secondary); font-family: var(--font-ibm-plex-mono), ui-monospace, monospace; font-size: clamp(9px, 1.05cqw, 11px); letter-spacing: 0.14em; text-transform: uppercase; user-select: none; }
        .skyrec-item { min-width: 0; }
        .skyrec-cap { margin: 1cqw 0 0; color: var(--text-secondary); font-family: inherit; font-size: 12px; line-height: 1.45; }
        @media (max-width: 639px) { .skyrec-cap { font-size: 14px; } }
        .skyrec-fallback { margin: 0; color: var(--text-secondary); font-size: 14px; }
        .skyrec-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6cqw; }
        .skyrec-panel { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: #050a0c; }
        .skyrec-panel canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
        .skyrec-panel::after { content: ""; position: absolute; inset: 0; pointer-events: none; border: 0.5px solid color-mix(in oklab, var(--theme-3) 60%, transparent); }

        .skyrec-slider { flex: 1; min-width: 0; -webkit-appearance: none; appearance: none; height: 20px; margin: 0; background: transparent; cursor: pointer; }
        .skyrec-slider:focus { outline: none; }
        .skyrec-slider::-webkit-slider-runnable-track { height: 1px; background: color-mix(in oklab, var(--text-primary) 20%, transparent); }
        .skyrec-slider::-moz-range-track { height: 1px; background: color-mix(in oklab, var(--text-primary) 20%, transparent); }
        .skyrec-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 9px; height: 9px; margin-top: -4px; background: var(--text-primary); border: 0; border-radius: 50%; transition: transform .15s ease; }
        .skyrec-slider::-moz-range-thumb { width: 9px; height: 9px; background: var(--text-primary); border: 0; border-radius: 50%; }
        .skyrec-slider:hover::-webkit-slider-thumb, .skyrec-slider:active::-webkit-slider-thumb { transform: scale(1.3); }
        .skyrec-slider:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px color-mix(in oklab, var(--text-primary) 25%, transparent); }
        .skyrec-slider:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px color-mix(in oklab, var(--text-primary) 25%, transparent); }
        @container (max-width: 560px) { .skyrec-panels { grid-template-columns: 1fr; gap: 5cqw; } .skyrec-cap { margin-top: 2cqw; } }
      `}</style>
    </div>
  );
}

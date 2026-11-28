import {
  curl,
  EYE,
  layOf,
  overRibbon,
  PLACE,
  type Columns,
  type Curl,
  type Laid,
  type Strip,
  type Turns,
} from '../core';
import { bands, cloth, createMesh, panel, sheet, slab, STRIDE, swing, type Vec3 } from '../gl/mesh';
import { releaseWhenGone } from '../gl/release';
import {
  BOARD_SHADOW_FRAGMENT,
  COVER_FRAGMENT,
  FACE_FRAGMENT,
  FACE_VERTEX,
  SHADOW_FRAGMENT,
  SHADOW_VERTEX,
  STRIP_FRAGMENT,
  STRIP_VERTEX,
} from '../gl/shaders';
import { createFocusRing } from './focus';
import { createPictureSource, type Snap } from './pictures';

interface SnapshotRendererOptions {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  snap: Snap;
  page: (index: number) => HTMLElement | undefined;
  faces: (leaf: number) => { front: number; back: number };
  blanks?: () => readonly HTMLElement[];
  hard?: (leaf: number) => boolean;
  board?: (index: number) => boolean;
  columns: () => Columns;
  drawn?: () => void;
  failed?: () => void;
}

interface Picture {
  texture: WebGLTexture;
  width: number;
  height: number;
  scale: number;
  span: string;
  seen: number;
  taken: boolean;
}

interface Look {
  depth: number;
  reach: number;
  cloth: number;
  leather: number;
  sheen: number;
  foil: number;
  deboss: number;
  tint: Vec3;
  round: number;
}

const LIGHT = unit(-0.32, -0.42, 1);
const SHADOW = 0.24;
const DARK = 0.56;
const BRIGHT = 1.15;
const LAMP = 0.7;
const GLIDE = 70;
const ROAM = 1.5;
const THREAD = 3.2;
const THREADS = [70, 190] as const;
const TOOTH = 1.5;
const RAISED = 1.6;
const TABLE = 0.09;
const PASTED = 0.07;
const GREY: Vec3 = [0.2, 0.2, 0.2];
const GUTTER = { shade: 0.22, width: 0.07 };
const CURVE = { shade: 0.3, width: 0.16, lit: 0.6 };
const VERSO = "[data-face='back'], [data-blank]";
const PAPER: Vec3 = [0.99, 0.99, 0.98];
const STRIP_SHADOW = {
  shift: [0.0035, 0.005] as const,
  soft: 0.0045,
  strength: 0.28,
  thrown: 3.2,
  softer: 3.5,
  clear: 0.09,
};
const STRIP_RISE = 0.06;
const SLANT = 0.45;

const AHEAD = 3;
const KEPT = 16;

function createSnapshotRenderer(options: SnapshotRendererOptions) {
  const { canvas, stage } = options;
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
  });
  if (!context) return undefined;
  const gl = context;

  const mesh = createMesh();
  const pictures = new Map<HTMLElement, Picture>();
  const placed = new Map<HTMLElement, string>();
  let blank: WebGLTexture | null = null;
  let due = false;
  let cleared = false;
  let told = false;
  const standIns = new Map<number, HTMLElement>();
  const seeds = new WeakMap<HTMLElement, number>();
  let sheets = 0;

  let scene: { turns: Turns; h: number; ribbon: Strip | undefined } | undefined;
  let lost = false;
  let box = { width: 0, height: 0 };
  let grid = { width: 0, height: 0 };
  let bleed = { x: 0, y: 0 };
  let density = 1;
  let verso = 0;
  let shade_: [number, number, number] = [0, 0, 0];

  let placing = { x: 0, y: 0, width: 1 };
  let lamp: [number, number, number] | undefined;
  let aim: [number, number, number] | undefined;
  let shiny = false;
  let gliding = 0;
  let glided = 0;

  const face = createFaceProgram(gl);
  const cover = createCoverProgram(gl);
  const shadow = createShadowProgram(gl);
  const boardShadow = createBoardShadowProgram(gl);
  const strip = createStripProgram(gl);
  const lain: Laid = { places: new Float64Array(0), runs: [], width: 0 };
  const buffer = gl.createBuffer();

  const resize = new ResizeObserver(([entry]) => {
    if (!entry) return;
    const content = entry.contentBoxSize[0]!;
    const device = entry.devicePixelContentBoxSize?.[0];
    box = { width: content.inlineSize, height: content.blockSize };
    const style = getComputedStyle(canvas);
    const small = Number.parseFloat(style.getPropertyValue('--book-canvas-scale'));
    density = small > 0 && small < 1 ? small : 1;
    const ratio = (canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1) * density;
    const exact = device !== undefined && Math.abs(device.inlineSize - box.width * ratio) <= 1;
    grid = {
      width: exact ? device.inlineSize : Math.round(box.width * ratio),
      height: exact ? device.blockSize : Math.round(box.height * ratio),
    };
    bleed = {
      x: Number.parseFloat(style.getPropertyValue('--book-bleed-inline')) || 0,
      y: Number.parseFloat(style.getPropertyValue('--book-bleed-block')) || 0,
    };
    verso = Math.min(
      1,
      Math.max(0, Number.parseFloat(style.getPropertyValue('--book-verso')) || 0),
    );
    const channels = style
      .getPropertyValue('--book-shade')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    shade_ = [0, 1, 2].map((index) => (channels[index] ?? 0) / 255) as [number, number, number];
    if (canvas.width !== grid.width) canvas.width = grid.width;
    if (canvas.height !== grid.height) canvas.height = grid.height;
    render();
  });
  try {
    resize.observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    resize.observe(canvas);
  }

  const redraw = () => {
    if (due || cleared) return;
    due = true;
    queueMicrotask(() => {
      due = false;
      if (!cleared) render();
    });
  };

  const landed = (el: HTMLElement, taken: HTMLCanvasElement) => {
    const held = pictures.get(el);
    if (!held || lost || taken.width === 0 || taken.height === 0) return;
    try {
      gl.bindTexture(gl.TEXTURE_2D, held.texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, taken);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
    } catch {
      options.failed?.();
      return;
    }
    held.width = taken.width;
    held.height = taken.height;
    const was = asked.get(el);
    if (was) {
      held.scale = was.scale;
      held.span = was.span;
    }
    held.taken = true;
    redraw();
  };

  const source = createPictureSource({
    stage,
    snap: options.snap,
    landed,
    changed: redraw,
    failed: () => options.failed?.(),
  });
  const focus = createFocusRing(stage);
  const asked = new WeakMap<HTMLElement, { scale: number; span: string }>();
  let frames = 0;

  function picture(
    el: HTMLElement,
    scale: number,
    span: string,
    idle: boolean,
  ): Picture | undefined {
    let held = pictures.get(el);
    if (!held) {
      held = {
        texture: gl.createTexture(),
        width: 0,
        height: 0,
        scale: 0,
        span: '',
        seen: 0,
        taken: false,
      };
      pictures.set(el, held);
      gl.bindTexture(gl.TEXTURE_2D, held.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    held.seen = frames;
    const fresh = held.taken && held.scale === scale && held.span === span && !source.stale(el);
    if (!fresh && !source.coming(el) && (!held.taken || idle)) {
      asked.set(el, { scale, span });
      source.want(el, scale);
    }
    return held.taken ? held : undefined;
  }

  function blankFor(el: HTMLElement): WebGLTexture | null {
    blank ??= gl.createTexture();
    const [r, g, b] = colourOf(getComputedStyle(el).backgroundColor) ?? [1, 1, 1];
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([r * 255, g * 255, b * 255, 255]),
    );
    return blank;
  }

  function standIn(leaf: number): HTMLElement | undefined {
    const held = standIns.get(leaf);
    if (held) return held;
    const taken = new Set(standIns.values());
    const spare = options.blanks?.().find((blank) => !taken.has(blank));
    if (spare) standIns.set(leaf, spare);
    return spare;
  }

  function page(index: number): HTMLElement | undefined {
    const el = index >= 0 ? options.page(index) : undefined;
    return el && stage.contains(el) ? el : undefined;
  }

  function render() {
    if (!scene || lost || grid.width === 0 || grid.height === 0) return;
    const { turns, h, ribbon } = scene;
    const { active, under } = turns;
    const columns = options.columns();

    const lone = columns === 1;
    const beside = lone ? verso : 1;
    const width = box.width / (1 + beside + 2 * bleed.x);
    const scale = grid.width / box.width;
    const size = width * scale;
    const spine = {
      x: Math.round((bleed.x + beside) * size),
      y: Math.round(bleed.y * size),
    };
    const view = {
      origin: [(spine.x / grid.width) * 2 - 1, 1 - (spine.y / grid.height) * 2] as const,
      unit: [(2 * size) / grid.width, (-2 * size) / grid.height] as const,
      h,
    };
    placing = { x: spine.x / scale, y: spine.y / scale, width };
    const edges = [
      -spine.x / size,
      -spine.y / size,
      (grid.width - spine.x) / size,
      (grid.height - spine.y) / size,
    ] as const;
    const eye: Vec3 = [0, h / 2, EYE];
    const light = lamp ?? home();
    const threads = Math.min(THREADS[1], Math.max(THREADS[0], width / THREAD));
    const styled = getComputedStyle(canvas);
    const grain = Math.min(
      1,
      Math.max(0, Number.parseFloat(styled.getPropertyValue('--book-paper-grain')) || 0),
    );
    const round = Math.min(
      0.25,
      Math.max(0, Number.parseFloat(styled.getPropertyValue('--book-page-radius')) || 0),
    );
    const through = Math.min(
      1,
      Math.max(0, Number.parseFloat(styled.getPropertyValue('--book-show-through')) || 0),
    );
    const paper = colourOf(styled.getPropertyValue('--book-paper').trim()) ?? PAPER;
    const curve = Math.min(
      1,
      Math.max(0, Number.parseFloat(styled.getPropertyValue('--book-page-curve')) || 0),
    );
    const dips = {
      verso: { shade: CURVE.shade * curve, width: CURVE.width },
      recto: { shade: CURVE.shade * CURVE.lit * curve, width: CURVE.width * CURVE.lit },
    };
    const thread = colourOf(styled.getPropertyValue('--book-thread').trim());
    const leavesAhead = Number.parseFloat(styled.getPropertyValue('--book-leaves-ahead'));
    const ahead = leavesAhead >= 0 ? leavesAhead : AHEAD;
    shiny = false;
    frames++;
    const span = `${width.toFixed(2)} ${(width * h).toFixed(2)}`;
    const used = new Set<HTMLElement>();
    const drawn = new Set<HTMLElement>();
    let lying = true;
    const take = (el: HTMLElement) => {
      used.add(el);
      const held = picture(el, scale, span, active.length === 0);
      if (held && lying) drawn.add(el);
      return held;
    };
    const fitOf = (held: Picture | undefined) =>
      held
        ? ([
            Math.min(1, (width * held.scale) / held.width),
            Math.min(1, (width * h * held.scale) / held.height),
          ] as const)
        : ([1, 1] as const);

    gl.viewport(0, 0, grid.width, grid.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const paint = (
      el: HTMLElement,
      look: {
        mirror?: boolean;
        dim?: number;
        curl?: Curl;
        side?: 1 | 2;
        veil?: number;
        gutter?: boolean;
      },
    ) => {
      const held = take(el);
      if ((!held && lying) || mesh.count === 0) return;
      let seed = seeds.get(el);
      if (seed === undefined) {
        seed = (sheets++ * 37.31) % 997;
        seeds.set(el, seed);
      }
      gl.useProgram(face.program);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform2fv(face.origin, view.origin);
      gl.uniform2fv(face.unit, view.unit);
      gl.uniform2f(face.centre, 0, h / 2);
      gl.uniform1f(face.eye, EYE);
      gl.uniform2fv(face.fit, fitOf(held));
      gl.uniform1f(face.mirror, look.mirror ? 1 : 0);
      gl.uniform1f(face.dim, look.dim ?? 0);
      gl.uniform1f(face.veil, look.veil ?? 0);
      const verso = el.matches(VERSO);
      const dip = look.gutter ? GUTTER : verso ? dips.verso : dips.recto;
      gl.uniform3f(face.gutter, dip.shade, dip.width, verso ? 1 : 0);
      gl.uniform4f(
        face.thread,
        ...(thread ?? PAPER),
        thread && el.hasAttribute('data-sewn') ? 1 : 0,
      );
      gl.uniform3fv(face.shade, shade_);
      gl.uniform3fv(face.paper, paper);
      gl.uniform1i(face.side, look.side ?? 0);
      gl.uniform1f(face.radius, look.curl?.radius ?? 0);
      gl.uniform2f(face.across, look.curl?.across.x ?? 0, look.curl?.across.y ?? 0);
      gl.uniform3fv(face.light, LIGHT);
      gl.uniform1f(face.height, h);
      gl.uniform1f(face.grain, grain);
      gl.uniform1f(face.tooth, width / TOOTH);
      gl.uniform1f(face.seed, seed);
      gl.bindTexture(gl.TEXTURE_2D, held ? held.texture : blankFor(el));
      triangles();
    };

    const dress = (
      el: HTMLElement | undefined,
      look: Look,
      at: { right: Vec3; out: Vec3; shape: 0 | 1 | 2; mirror?: boolean; stack?: number },
    ) => {
      const held = el ? take(el) : undefined;
      if ((el && !held && lying) || mesh.count === 0) return;
      if (held && (look.sheen > 0 || look.foil > 0)) shiny = true;
      gl.useProgram(cover.program);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform2fv(cover.origin, view.origin);
      gl.uniform2fv(cover.unit, view.unit);
      gl.uniform2f(cover.centre, 0, h / 2);
      gl.uniform1f(cover.eye, EYE);
      gl.uniform2fv(cover.fit, fitOf(held));
      gl.uniform2f(cover.texel, 1 / (held?.width ?? 1), 1 / (held?.height ?? 1));
      gl.uniform1f(cover.density, density);
      gl.uniform1f(cover.mirror, at.mirror ? 1 : 0);
      gl.uniform1f(cover.picture, held ? 1 : 0);
      gl.uniform3fv(cover.tint, look.tint);
      gl.uniform1f(cover.height, h);
      gl.uniform3fv(cover.right, at.right);
      gl.uniform3fv(cover.out, at.out);
      gl.uniform3fv(cover.room, LIGHT);
      gl.uniform3fv(cover.lamp, light);
      gl.uniform3fv(cover.eyeAt, eye);
      gl.uniform1f(cover.cloth, look.cloth);
      gl.uniform1f(cover.leather, look.leather);
      gl.uniform1f(cover.sheen, look.sheen);
      gl.uniform1f(cover.foil, held ? look.foil : 0);
      gl.uniform1f(cover.deboss, held ? look.deboss : 0);
      gl.uniform1f(cover.threads, threads);
      gl.uniform1i(cover.shape, at.shape);
      gl.uniform1f(cover.reach, look.reach);
      gl.uniform1f(cover.deep, Math.min(1, look.depth / 0.02));
      gl.uniform1f(cover.stack, at.stack ?? 0);
      gl.uniform1f(cover.round, look.round);
      if (held) gl.bindTexture(gl.TEXTURE_2D, held.texture);
      triangles();
    };

    const triangles = () => {
      gl.bufferData(gl.ARRAY_BUFFER, mesh.data.subarray(0, mesh.count * STRIDE), gl.DYNAMIC_DRAW);
      const bytes = STRIDE * 4;
      gl.enableVertexAttribArray(0);
      gl.enableVertexAttribArray(1);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, bytes, 0);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, bytes, 12);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, bytes, 20);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    };

    const cast = (c: Curl, strength: number) => {
      if (strength <= 0) return;
      gl.useProgram(shadow.program);
      gl.blendFuncSeparate(gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.uniform2fv(shadow.origin, view.origin);
      gl.uniform2fv(shadow.unit, view.unit);
      gl.uniform2f(shadow.line, c.line.x, c.line.y);
      gl.uniform2f(shadow.across, c.across.x, c.across.y);
      gl.uniform1f(shadow.radius, c.radius);
      gl.uniform2f(shadow.leaf, c.fold.flat.x, h);
      gl.uniform1f(shadow.round, round);
      gl.uniform2f(shadow.lean, LIGHT[0], LIGHT[1]);
      gl.uniform2f(shadow.centre, 0, h / 2);
      gl.uniform1f(shadow.eye, EYE);
      gl.uniform3fv(shadow.shade, shade_);
      gl.uniform1f(shadow.strength, strength);
      everywhere();
    };

    const shade = (look: Look, run: Vec3) => {
      gl.useProgram(boardShadow.program);
      gl.uniform2fv(boardShadow.origin, view.origin);
      gl.uniform2fv(boardShadow.unit, view.unit);
      gl.uniform2f(boardShadow.run, run[0], Math.max(0, run[2] - 0.002));
      gl.uniform2f(boardShadow.size, 1 + look.reach, h);
      gl.uniform1f(boardShadow.reach, look.reach);
      gl.uniform1f(boardShadow.round, look.round > 0 ? look.round + look.reach : 0);
      gl.uniform1f(boardShadow.raised, RAISED * look.depth);
      gl.uniform2f(boardShadow.lean, -LIGHT[0] / LIGHT[2], -LIGHT[1] / LIGHT[2]);
      const room = look.reach + TABLE;
      gl.uniform4f(
        boardShadow.bounds,
        Math.max(edges[0], -1 - room),
        Math.max(edges[1], -room),
        Math.min(edges[2], 1 + room),
        Math.min(edges[3], h + room),
      );
      gl.uniform3fv(boardShadow.shade, shade_);
      gl.uniform1f(boardShadow.strength, SHADOW * (1 - 0.45 * Math.abs(run[2])));
      gl.blendFuncSeparate(gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      everywhere();
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX);
      gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE, gl.ONE);
      everywhere();
      gl.blendEquation(gl.FUNC_ADD);
    };

    const everywhere = () => {
      gl.bufferData(gl.ARRAY_BUFFER, COVER, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.disableVertexAttribArray(1);
      gl.disableVertexAttribArray(2);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const lay = (cloth_: Strip) => {
      if (cloth_.opacity <= 0 || cloth_.count < 2) return;
      layOf(cloth_, { slant: SLANT }, lain);
      const runs = lain.runs.length / 2;
      if (runs === 0) return;
      const { shift, soft, strength, thrown, softer, clear } = STRIP_SHADOW;
      const place = (index: number) => lain.places[lain.runs[index]! * PLACE + 6]!;
      const length = Math.max(1e-6, place(lain.runs.length - 1));
      const deep = 0.9 / length;
      gl.useProgram(strip.program);
      gl.uniform2fv(strip.origin, view.origin);
      gl.uniform2fv(strip.unit, view.unit);
      gl.uniform2f(strip.centre, 0, h / 2);
      gl.uniform1f(strip.eye, EYE);
      gl.uniform1f(strip.width, cloth_.width);
      gl.uniform3fv(strip.light, LIGHT);
      gl.uniform2f(strip.soft, soft, softer);

      const shadows = () => {
        gl.blendFuncSeparate(gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.uniform1i(strip.kind, 2);
        gl.uniform3fv(strip.colour, shade_);
        gl.uniform1f(strip.opacity, strength * cloth_.opacity);
        for (let run = 0; run < runs; run++) {
          cloth(mesh, lain, run, { shift, soft, thrown, softer });
          gl.uniform2f(strip.run, place(run * 2), place(run * 2 + 1));
          triangles();
        }
      };

      gl.uniform2f(strip.deep, 0.05, deep);
      gl.uniform1i(strip.once, 1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clearDepth(1);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.depthFunc(gl.LESS);
      gl.colorMask(false, false, false, false);
      shadows();
      gl.colorMask(true, true, true, true);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(false);
      gl.uniform1i(strip.once, 2);
      shadows();
      gl.uniform1i(strip.once, 0);

      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.depthFunc(gl.ALWAYS);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1i(strip.kind, 0);
      gl.uniform3fv(strip.colour, colourOf(cloth_.colour) ?? GREY);
      gl.uniform1f(strip.opacity, cloth_.opacity);
      for (let run = 0; run < runs; run++) {
        cloth(mesh, lain, run, { rise: STRIP_RISE });
        triangles();
      }

      gl.depthFunc(gl.GREATER);
      gl.depthMask(false);
      gl.uniform2f(strip.deep, 0.05 - clear * deep, deep);
      shadows();
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    };

    const looks = new Map<number, Look>();
    const lookOf = (leaf: number): Look => {
      let held = looks.get(leaf);
      if (!held) {
        const sides = options.faces(leaf);
        const outside = [sides.front, sides.back].find(
          (index) => index >= 0 && options.board?.(index),
        );
        held = readLook(page(outside ?? sides.front) ?? page(sides.back), bleed);
        looks.set(leaf, held);
      }
      return held;
    };

    const side = (
      el: HTMLElement | undefined,
      index: number,
      look: Look,
      at: { right: Vec3; out: Vec3; back: boolean; lift?: number; stack?: number },
    ) => {
      const origin: Vec3 = [at.out[0] * (at.lift ?? 0), 0, at.out[2] * (at.lift ?? 0)];
      const whole = () =>
        panel(mesh, origin, at.right, [0, 1 + look.reach], [-look.reach, h + look.reach], h);
      if (el && options.board?.(index)) {
        whole();
        dress(el, look, { right: at.right, out: at.out, shape: 1, mirror: at.back });
        return;
      }
      whole();
      dress(undefined, look, { right: at.right, out: at.out, shape: 2, stack: at.stack });
      if (!el) return;
      panel(mesh, origin, at.right, [0, 1], [0, h], h);
      paint(el, { mirror: at.back, dim: 1 - lit(at.out) });
    };

    for (const leaf of standIns.keys()) {
      if (!active.some((item) => item.index === leaf)) standIns.delete(leaf);
    }

    const resting = new Map<HTMLElement, number>();
    const last = turns.leafCount - 1;
    const piles = [
      { left: true, top: under.left, lies: under.left >= 0, bottom: 0, count: under.left },
      {
        left: false,
        top: under.right,
        lies: under.right <= last,
        bottom: last,
        count: last - under.right,
      },
    ]
      .filter((pile) => pile.lies && (!lone || !pile.left || verso > 0))
      .map((pile) => {
        const sides = options.faces(pile.top);
        const turned = lone && pile.left;
        const index = pile.left && !lone ? sides.back : sides.front;
        return {
          ...pile,
          turned,
          index,
          el: page(index),
          right: (pile.left ? [-1, 0, 0] : [1, 0, 0]) as Vec3,
          board: options.hard?.(pile.bottom) ? lookOf(pile.bottom) : undefined,
        };
      });
    for (const pile of piles) {
      if (pile.board) shade(pile.board, pile.right);
    }
    let laid = ribbon === undefined;
    for (const pile of piles) {
      const { el, index } = pile;
      if (el && !pile.turned && options.hard?.(pile.top) && options.board?.(index)) {
        if (!laid && overRibbon(ribbon!, pile.top, pile.left ? -1 : 1)) {
          lay(ribbon!);
          laid = true;
        }
        side(el, index, lookOf(pile.top), { right: pile.right, out: UP, back: pile.left });
      } else {
        if (pile.board) {
          const stack = pile.count > 0 ? Math.min(0.28, 0.14 + 0.02 * pile.count) : PASTED;
          side(undefined, -1, pile.board, { right: pile.right, out: UP, back: pile.left, stack });
        }
        if (el && pile.turned) {
          sheet(mesh, -1, h);
          lying = false;
          paint(el, {
            mirror: true,
            veil: options.hard?.(pile.top) ? 1 : 1 - through,
            gutter: true,
          });
          lying = true;
        } else if (el) {
          sheet(mesh, pile.left ? -1 : 0, h);
          paint(el, lone && verso > 0 ? { gutter: true } : {});
        }
      }
      if (el && !pile.turned) resting.set(el, pile.left ? -1 : 0);
    }

    lying = false;
    const steps: { layer: number; leaf: number; lies: -1 | 1; run: () => void }[] = [];
    active.forEach((leaf, index) => {
      const sides = options.faces(leaf.index);
      const front = page(sides.front);
      const far = lone && sides.back < 0 && !options.hard?.(leaf.index) ? front : undefined;
      const back = sides.back >= 0 ? page(sides.back) : far ? undefined : standIn(leaf.index);

      if (options.hard?.(leaf.index)) {
        const look = lookOf(leaf.index);
        const { run, out } = swing(leaf.t);
        const inward: Vec3 = [-out[0], 0, -out[2]];
        const half = look.depth / 2;
        const lifted = leaf.from === 'right' ? leaf.t >= 0.5 : leaf.t <= 0.5;
        const layer =
          leaf.from === 'right'
            ? lifted
              ? 2000 + index
              : 1000 - index
            : lifted
              ? 3000 - index
              : 1000 + index;
        steps.push({
          layer,
          leaf: leaf.index,
          lies: (leaf.from === 'right') === lifted ? -1 : 1,
          run: () => {
            shade(look, run);
            if (EYE * out[2] > half) {
              side(front, sides.front, look, { right: run, out, back: false, lift: half });
            }
            if (EYE * inward[2] > half) {
              side(back, sides.back, look, {
                right: run,
                out: inward,
                back: true,
                lift: half,
                stack: PASTED,
              });
            }
            if (half > 0) {
              const outline = edgeOf(look, h);
              for (let index = 0; index + 1 < outline.length; index++) {
                const a = outline[index]!;
                const b = outline[index + 1]!;
                const nu = (a.nu + b.nu) / 2;
                const nv = (a.nv + b.nv) / 2;
                const faces: Vec3 = [run[0] * nu, nv, run[2] * nu];
                const u = (a.u + b.u) / 2;
                const toEye: Vec3 = [
                  eye[0] - run[0] * u,
                  eye[1] - (a.v + b.v) / 2,
                  eye[2] - run[2] * u,
                ];
                if (faces[0] * toEye[0] + faces[1] * toEye[1] + faces[2] * toEye[2] <= 0) continue;
                slab(
                  mesh,
                  [run[0] * a.u, a.v, run[2] * a.u],
                  [run[0] * b.u, b.v, run[2] * b.u],
                  out,
                  [-half, half],
                  [a.along / h, b.along / h],
                );
                dress(undefined, look, { right: out, out: faces, shape: 0 });
              }
            }
          },
        });
        return;
      }

      const c = curl(leaf.point, leaf.corner, h, leaf.from, { eye: EYE });
      const fromRight = leaf.from === 'right';
      const lower = fromRight ? front : (back ?? far);
      const upper = fromRight ? (back ?? far) : front;
      const veil = far ? 1 - through : 0;
      if (lower) {
        steps.push({
          layer: fromRight ? 1000 - index : 1000 + index,
          leaf: leaf.index,
          lies: fromRight ? 1 : -1,
          run: () => {
            bands(mesh, c, h, 'under');
            paint(
              lower,
              far && !fromRight ? { mirror: true, curl: c, side: 1, veil } : { curl: c, side: 1 },
            );
          },
        });
      }
      steps.push({
        layer: fromRight ? 2000 + index : 3000 - index,
        leaf: leaf.index,
        lies: fromRight ? -1 : 1,
        run: () => {
          cast(c, SHADOW * Math.sqrt(Math.max(0, Math.sin(Math.PI * c.fold.progress))));
          if (!upper) return;
          bands(mesh, c, h, 'over');
          paint(
            upper,
            far && fromRight ? { curl: c, side: 2, veil } : { mirror: true, curl: c, side: 2 },
          );
        },
      });
    });
    steps.sort((a, b) => a.layer - b.layer);
    for (const step of steps) {
      if (!laid && overRibbon(ribbon!, step.leaf, step.lies)) {
        lay(ribbon!);
        laid = true;
      }
      step.run();
    }
    if (!laid) lay(ribbon!);

    for (const [el, x] of resting) {
      const at = `${x < 0 ? 'left' : 'right'}${drawn.has(el) ? ' drawn' : ''}`;
      if (placed.get(el) === at) continue;
      placed.set(el, at);
      const frame = frameOf(el);
      frame?.setAttribute('data-under', '');
      frame?.setAttribute('data-side', x < 0 ? 'left' : 'right');
      frame?.toggleAttribute('data-drawn', drawn.has(el));
    }
    for (const el of placed.keys()) {
      if (resting.has(el)) continue;
      placed.delete(el);
      unplace(el);
    }
    if (!told && Array.from(resting.keys()).every((el) => drawn.has(el))) {
      told = true;
      options.drawn?.();
    }
    if (stage.contains(stage.ownerDocument.activeElement)) focus.place();

    if (active.length === 0) {
      for (let away = 0; away < ahead; away++) {
        const next = [
          options.faces(under.right + away).back,
          options.faces(under.right + away + 1).front,
          options.faces(under.left - away).front,
          options.faces(under.left - away - 1).back,
        ];
        for (const index of next) {
          const el = index < turns.leafCount * 2 ? page(index) : undefined;
          if (el) take(el);
        }
      }
    }
    source.keep(used);
    if (pictures.size > KEPT) {
      const spare = [...pictures]
        .filter(([el]) => !used.has(el))
        .sort((a, b) => a[1].seen - b[1].seen);
      for (const [el, held] of spare.slice(0, pictures.size - KEPT)) {
        gl.deleteTexture(held.texture);
        pictures.delete(el);
      }
    }
  }

  const still = () =>
    canvas.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const home = (): [number, number, number] => [-0.35, 0.3 * (scene?.h ?? 1.4), 1.1];

  const glide = (time: number) => {
    gliding = 0;
    const to = aim ?? home();
    const from = lamp ?? home();
    const step = 1 - Math.exp(-Math.min(64, time - glided) / GLIDE);
    glided = time;
    if (Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]) < 2e-3) {
      lamp = aim;
    } else {
      lamp = [0, 1, 2].map((axis) => from[axis]! + (to[axis]! - from[axis]!) * step) as typeof lamp;
      gliding = requestAnimationFrame(glide);
    }
    redraw();
  };

  const point = (to: [number, number, number] | undefined) => {
    aim = to;
    if (!shiny) {
      lamp = aim;
    } else if (gliding === 0) {
      glided = performance.now();
      gliding = requestAnimationFrame(glide);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || still()) return;
    const rect = canvas.getBoundingClientRect();
    const h = scene?.h ?? 1;
    const zoom = box.width > 0 && rect.width > 0 ? rect.width / box.width : 1;
    const x = ((event.clientX - rect.left) / zoom - placing.x) / placing.width;
    const y = ((event.clientY - rect.top) / zoom - placing.y) / placing.width;
    point([
      Math.min(1 + ROAM, Math.max(-1 - ROAM, x)),
      Math.min(h + ROAM, Math.max(-ROAM, y)),
      LAMP,
    ]);
  };

  const onPointerGone = () => point(undefined);

  const root = canvas.ownerDocument.documentElement;
  root.addEventListener('pointermove', onPointerMove, { passive: true });
  root.addEventListener('pointerleave', onPointerGone);

  const onLost = () => {
    lost = true;
    options.failed?.();
  };

  canvas.addEventListener('webglcontextlost', onLost);

  function draw(turns: Turns, h: number, ribbon?: Strip) {
    scene = { turns, h, ribbon };
    redraw();
  }

  function clear() {
    cleared = true;
    resize.disconnect();
    source.clear();
    focus.clear();
    canvas.removeEventListener('webglcontextlost', onLost);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerleave', onPointerGone);
    cancelAnimationFrame(gliding);
    for (const el of placed.keys()) unplace(el);
    placed.clear();
    gl.deleteTexture(blank);
    for (const held of pictures.values()) gl.deleteTexture(held.texture);
    pictures.clear();
    standIns.clear();
    gl.deleteProgram(face.program);
    gl.deleteProgram(cover.program);
    gl.deleteProgram(shadow.program);
    gl.deleteProgram(boardShadow.program);
    gl.deleteProgram(strip.program);
    gl.deleteBuffer(buffer);
    scene = undefined;
    releaseWhenGone(canvas, gl);
  }

  return { draw, clear };
}

const COVER = new Float32Array([-1, -1, 3, -1, -1, 3]);

function createFaceProgram(gl: WebGL2RenderingContext) {
  const program = link(gl, FACE_VERTEX, FACE_FRAGMENT, ['aPlace', 'aPaper', 'aAlong']);
  const at = (name: string) => gl.getUniformLocation(program, name);
  return {
    program,
    origin: at('uOrigin'),
    unit: at('uUnit'),
    centre: at('uCentre'),
    eye: at('uEye'),
    fit: at('uFit'),
    mirror: at('uMirror'),
    dim: at('uDim'),
    veil: at('uVeil'),
    gutter: at('uGutter'),
    thread: at('uThread'),
    shade: at('uShade'),
    paper: at('uPaper'),
    side: at('uSide'),
    radius: at('uRadius'),
    across: at('uAcross'),
    light: at('uLight'),
    height: at('uHeight'),
    grain: at('uGrain'),
    tooth: at('uTooth'),
    seed: at('uSeed'),
  };
}

function createCoverProgram(gl: WebGL2RenderingContext) {
  const program = link(gl, FACE_VERTEX, COVER_FRAGMENT, ['aPlace', 'aPaper', 'aAlong']);
  const at = (name: string) => gl.getUniformLocation(program, name);
  return {
    program,
    origin: at('uOrigin'),
    unit: at('uUnit'),
    centre: at('uCentre'),
    eye: at('uEye'),
    fit: at('uFit'),
    texel: at('uTexel'),
    density: at('uDensity'),
    mirror: at('uMirror'),
    picture: at('uPicture'),
    tint: at('uTint'),
    height: at('uHeight'),
    right: at('uRight'),
    out: at('uOut'),
    room: at('uRoom'),
    lamp: at('uLamp'),
    eyeAt: at('uEyeAt'),
    cloth: at('uCloth'),
    leather: at('uLeather'),
    sheen: at('uSheen'),
    foil: at('uFoil'),
    deboss: at('uDeboss'),
    threads: at('uThreads'),
    shape: at('uShape'),
    reach: at('uReach'),
    deep: at('uDeep'),
    stack: at('uStack'),
    round: at('uRound'),
  };
}

function createStripProgram(gl: WebGL2RenderingContext) {
  const program = link(gl, STRIP_VERTEX, STRIP_FRAGMENT, ['aPlace', 'aPaper', 'aAlong']);
  const at = (name: string) => gl.getUniformLocation(program, name);
  return {
    program,
    origin: at('uOrigin'),
    unit: at('uUnit'),
    centre: at('uCentre'),
    eye: at('uEye'),
    kind: at('uKind'),
    colour: at('uColour'),
    opacity: at('uOpacity'),
    width: at('uWidth'),
    light: at('uLight'),
    soft: at('uSoft'),
    run: at('uRun'),
    deep: at('uDeep'),
    once: at('uOnce'),
  };
}

function createBoardShadowProgram(gl: WebGL2RenderingContext) {
  const program = link(gl, SHADOW_VERTEX, BOARD_SHADOW_FRAGMENT, ['aCorner']);
  const at = (name: string) => gl.getUniformLocation(program, name);
  return {
    program,
    origin: at('uOrigin'),
    unit: at('uUnit'),
    run: at('uRun'),
    size: at('uSize'),
    reach: at('uReach'),
    round: at('uRound'),
    raised: at('uRaised'),
    lean: at('uLean'),
    bounds: at('uBounds'),
    shade: at('uShade'),
    strength: at('uStrength'),
  };
}

function createShadowProgram(gl: WebGL2RenderingContext) {
  const program = link(gl, SHADOW_VERTEX, SHADOW_FRAGMENT, ['aCorner']);
  const at = (name: string) => gl.getUniformLocation(program, name);
  return {
    program,
    origin: at('uOrigin'),
    unit: at('uUnit'),
    line: at('uLine'),
    across: at('uAcross'),
    radius: at('uRadius'),
    leaf: at('uLeaf'),
    round: at('uRound'),
    lean: at('uLean'),
    centre: at('uCentre'),
    eye: at('uEye'),
    shade: at('uShade'),
    strength: at('uStrength'),
  };
}

function link(gl: WebGL2RenderingContext, vertex: string, fragment: string, attributes: string[]) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
      throw new Error(`page-turner: a shader didn't compile. ${gl.getShaderInfoLog(shader) ?? ''}`);
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(
      `page-turner: a shader program didn't link. ${gl.getProgramInfoLog(program) ?? ''}`,
    );
  }
  return program;
}

const TURNS = 6;

function edgeOf(look: Look, h: number) {
  const corner = look.round > 0 ? look.round + look.reach : 0;
  const far = 1 + look.reach;
  const outline: { u: number; v: number; nu: number; nv: number; along: number }[] = [];
  let along = 0;
  const add = (u: number, v: number, nu: number, nv: number) => {
    const last = outline.at(-1);
    if (last) along += Math.hypot(u - last.u, v - last.v);
    outline.push({ u, v, nu, nv, along });
  };
  for (const [middle, from] of [
    [-look.reach + corner, -Math.PI / 2],
    [h + look.reach - corner, 0],
  ] as const) {
    if (corner === 0) {
      add(far, middle, 1, 0);
      continue;
    }
    for (let step = 0; step <= TURNS; step++) {
      const angle = from + (Math.PI / 2) * (step / TURNS);
      add(
        far - corner + corner * Math.cos(angle),
        middle + corner * Math.sin(angle),
        Math.cos(angle),
        Math.sin(angle),
      );
    }
  }
  return outline;
}

const UP: Vec3 = [0, 0, 1];

function lit(out: Vec3) {
  const square = Math.max(0, out[0] * LIGHT[0] + out[1] * LIGHT[1] + out[2] * LIGHT[2]) / LIGHT[2];
  return DARK + (1 - DARK) * Math.min(square, BRIGHT);
}

function readLook(el: HTMLElement | undefined, bleed: { x: number; y: number }): Look {
  if (!el)
    return {
      depth: 0,
      reach: 0,
      cloth: 0,
      leather: 0,
      sheen: 0,
      foil: 0,
      deboss: 0,
      tint: GREY,
      round: 0,
    };
  const style = getComputedStyle(el);
  const read = (name: string, most: number) => {
    const value = Number.parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) ? Math.min(most, Math.max(0, value)) : 0;
  };
  return {
    depth: read('--book-cover-depth', 0.1),
    reach: read('--book-cover-overhang', Math.min(bleed.x, bleed.y) * 0.6),
    cloth: read('--book-cover-cloth', 1),
    leather: read('--book-cover-leather', 1),
    sheen: read('--book-cover-sheen', 1),
    foil: read('--book-cover-foil', 1),
    deboss: read('--book-cover-deboss', 1),
    tint: colourOf(style.backgroundColor) ?? GREY,
    round: read('--book-page-radius', 0.25),
  };
}

const colours = new Map<string, Vec3 | undefined>();
let scratch: CanvasRenderingContext2D | null | undefined;

function colourOf(text: string): Vec3 | undefined {
  if (colours.has(text)) return colours.get(text);
  let colour: Vec3 | undefined;
  const plain = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/.exec(
    text,
  );
  if (plain) {
    if (plain[4] === undefined || Number(plain[4]) > 0) {
      colour = [Number(plain[1]) / 255, Number(plain[2]) / 255, Number(plain[3]) / 255];
    }
  } else {
    scratch ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (scratch) {
      scratch.clearRect(0, 0, 1, 1);
      scratch.fillStyle = text;
      scratch.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = scratch.getImageData(0, 0, 1, 1).data;
      if (a! > 0) colour = [r! / 255, g! / 255, b! / 255];
    }
  }
  if (colours.size > 64) colours.clear();
  colours.set(text, colour);
  return colour;
}

function unit(x: number, y: number, z: number): [number, number, number] {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

function frameOf(el: HTMLElement) {
  return el.closest<HTMLElement>('[data-slot="book-page-frame"]');
}

function unplace(el: HTMLElement) {
  const frame = frameOf(el);
  frame?.removeAttribute('data-under');
  frame?.removeAttribute('data-side');
  frame?.removeAttribute('data-drawn');
}

type SnapshotRenderer = NonNullable<ReturnType<typeof createSnapshotRenderer>>;

export { createSnapshotRenderer };
export type { SnapshotRenderer, SnapshotRendererOptions };

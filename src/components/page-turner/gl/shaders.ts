/**
 * The shaders for both canvas renderers. Lengths are in page widths from the top of the spine, x across the
 * right-hand page and y down it. `uOrigin` is the top of the spine on the canvas and `uUnit` one page width, both in
 * the canvas's own -1 to 1.
 */

/** Places a corner of a triangle as an eye above the middle of the spine sees it. */
const FACE_VERTEX = `#version 300 es
in vec3 aPlace;
in vec2 aPaper;
in float aAlong;

uniform vec2 uOrigin;
uniform vec2 uUnit;
uniform vec2 uCentre;
uniform float uEye;

out vec2 vPaper;
out float vAlong;
out vec3 vPlace;

void main() {
  // Paper nearer the eye looks larger, about the point the eye is above.
  float depth = 1.0 - aPlace.z / uEye;
  vec2 at = (uOrigin + uCentre * uUnit) * depth + (aPlace.xy - uCentre) * uUnit;
  gl_Position = vec4(at, 0.0, depth);
  vPaper = aPaper;
  vAlong = aAlong;
  vPlace = aPlace;
}
`;

/** Paints a page's picture on the paper, lit by how the paper there faces the light. */
const FACE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vPaper;
in float vAlong;

uniform sampler2D uPage;
// How much of the picture the page fills.
uniform vec2 uFit;
// 1 for the side of the leaf that is seen from behind.
uniform float uMirror;
// How much darker the whole page is.
uniform float uDim;
// How much of the page is hidden by paper of its own, for one seen from
// behind, and the colour of that paper.
uniform float uVeil;
uniform vec3 uPaper;
// The shade of the gutter: how dark at the spine, how far it reaches from
// it in page widths, and which edge of the paper the spine is at, 1 for the
// left and -1 for the right. And the colour of shade.
uniform vec3 uGutter;
uniform vec3 uShade;
// 0 for a page with no curl, 1 for the paper under a roll, 2 for the paper over it.
uniform int uSide;
uniform float uRadius;
uniform vec2 uAcross;
uniform vec3 uLight;
// Page height over page width.
uniform float uHeight;
// How strongly the paper's grain shows, how many of its grains cross a
// page width, and a number that is different for every page.
uniform float uGrain;
uniform float uTooth;
uniform float uSeed;

out vec4 colour;

const float PI = 3.141592653589793;
// How light paper is that the light doesn't reach at all.
const float DARK = 0.68;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Noise that changes smoothly from one whole number to the next.
float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// How much lighter or darker the paper is at a place than on the whole:
// its tooth, the fibres lying in it, and the clouds they settle into.
float grain(vec2 p) {
  float tooth = noise(p) - 0.5;
  float fibres = noise(vec2(p.x * 0.3, p.y * 1.9) + 31.7) + noise(vec2(p.x * 1.7, p.y * 0.27) + 63.1) - 1.0;
  float clouds = noise(p * 0.07 + 11.3) - 0.5;
  return 0.6 * tooth + 0.45 * fibres + 0.22 * clouds;
}

void main() {
  vec2 at = vec2(mix(vPaper.x, 1.0 - vPaper.x, uMirror), vPaper.y) * uFit;
  vec4 ink = texture(uPage, at);
  ink.rgb = mix(ink.rgb, uPaper, uVeil);
  if (uGutter.x > 0.0) {
    float from = uGutter.z > 0.0 ? vPaper.x : 1.0 - vPaper.x;
    ink.rgb = mix(ink.rgb, uShade, uGutter.x * clamp(1.0 - from / uGutter.y, 0.0, 1.0));
  }

  if (uGrain > 0.0) {
    // It is in the paper, so it goes where the paper goes, and it fades out
    // before its grains are too fine to draw.
    vec2 p = vec2(vPaper.x, vPaper.y * uHeight) * uTooth;
    float fine = max(fwidth(p.x), fwidth(p.y));
    float show = uGrain * (1.0 - smoothstep(0.7, 1.6, fine));
    ink.rgb *= 1.0 + 0.05 * show * grain(p + uSeed);
  }

  float light = 1.0;
  if (uSide != 0 && uRadius > 0.0) {
    // How far around the roll this paper is: 0 lying flat, PI level on top.
    float turn = clamp(vAlong / uRadius, 0.0, PI);
    // The way the paper faces. Under the roll its top is seen, over it its underside.
    vec3 facing = vec3(-sin(turn) * uAcross, cos(turn)) * (uSide == 1 ? 1.0 : -1.0);
    // Lit as paper lying flat is where it faces the light as squarely.
    float lit = max(dot(facing, uLight), 0.0) / uLight.z;
    light = min(mix(DARK, 1.0, lit), 1.0);
  }

  // The picture's colours don't have its alpha in them yet.
  colour = vec4(ink.rgb * ink.a * light * (1.0 - uDim), ink.a);
}
`;

/**
 * Paints a face of a board (a stiff leaf, such as a cover), covered in cloth, the page's picture, or both: the picture
 * is the dye and the stamping, and the weave is worked into it. `vPaper` is across from the hinge in page widths, and
 * down the page from 0 to 1. Lit by the room's light, as the pages are, and by a small lamp held over the pointer,
 * which only what shines shows.
 */
const COVER_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vPaper;
in vec3 vPlace;

uniform sampler2D uPage;
// How much of the picture the page fills, and the size of one of its texels.
uniform vec2 uFit;
uniform vec2 uTexel;
// The canvas's share of the screen's pixels: under 1 where a transform draws the book smaller.
uniform float uDensity;
// 1 for a page whose spine edge is on its right.
uniform float uMirror;
// 1 to draw the page's picture, 0 for bare cloth.
uniform float uPicture;
// The colour of the cloth.
uniform vec3 uTint;
// Page height over page width.
uniform float uHeight;
// The way the board runs from its hinge, and the way this face looks.
uniform vec3 uRight;
uniform vec3 uOut;
uniform vec3 uRoom;
uniform vec3 uLamp;
uniform vec3 uEyeAt;
// How strongly the weave of cloth shows, or the grain of leather; how much
// either shines; how much of what is printed on it is foil; and how deeply
// what is printed is pressed in.
uniform float uCloth;
uniform float uLeather;
uniform float uSheen;
uniform float uFoil;
uniform float uDeboss;
// How many threads cross one page width.
uniform float uThreads;
// 0 for an edge, 1 for the outside of a board, 2 for its inside.
uniform int uShape;
// How far the board stands out past the page, and how deeply it is shaped.
uniform float uReach;
uniform float uDeep;
// How much the pages lying on the inside of the board shade its rim.
uniform float uStack;
// How round the corners of the pages are. The board's own are as much rounder as it stands out.
uniform float uRound;

out vec4 colour;

const float PI = 3.141592653589793;
const float DARK = 0.56;
// How far a face turned towards the room's light may brighten.
const float BRIGHT = 1.15;
// How steep the sides of a pebble of leather are.
const float PEBBLE = 0.55;
// How steep the sides of a thread are, and how far it rises to cross another.
const float BUMP = 0.5;
const float RISE = 0.42;
// How wide the rounded edge of a board is, and how steep.
const float EDGE = 0.008;
const float BEVEL = 0.75;
// Where the groove of the joint runs, how wide it is, and how steep.
const float JOINT = 0.05;
const float JOINT_WIDTH = 0.022;
const float JOINT_SLOPE = 0.55;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}

// The page's picture at a place on the board. Past the page it is the page's own edge.
// What is printed at a place on the board. A board is covered from edge to
// edge and is nowhere clear: where the picture of its page is, at the round
// corners of the page or the soft edge of the picture, it is its covering's
// own colour. Past the page, where the board stands out, it is the colour
// at the page's edge.
vec3 inkAt(vec2 board) {
  vec2 at = vec2(mix(board.x, 1.0 - board.x, uMirror), board.y) * uFit;
  vec4 ink = texture(uPage, clamp(at, uTexel, uFit - 1.5 * uTexel));
  return mix(uTint, ink.rgb, ink.a);
}

// How much a colour is stamped on the cover: anything that isn't the colour of what covers it.
float stamp(vec3 ink) {
  return smoothstep(0.03, 0.15, distance(ink, uTint));
}

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// How high leather stands at a place, from 0 to 1: pebbles, each around a
// point of its own, with creases where two of them meet.
float pebbles(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  float nearest = 8.0;
  float next = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 to = vec2(float(x), float(y));
      float away = length(to + hash2(cell + to) - f);
      if (away < nearest) {
        next = nearest;
        nearest = away;
      } else if (away < next) {
        next = away;
      }
    }
  }
  // Round on top, and creased only shallowly: a fine grain, not a crackle.
  return smoothstep(0.0, 0.55, next - nearest) * (1.0 - 0.35 * nearest);
}

// How round a thread is across, from one side of it to the other.
float round_(float f) {
  return pow(sin(PI * f), 0.6);
}

// How high the cloth stands at a place, from 0 to 1. It is a plain weave:
// the warp runs down the cover and the weft across, each thread goes over
// one and under the next, and whichever is on top is the one that shows.
// No two threads are quite as thick.
float weave(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  // Over where the row and column add up even, under where they add up odd.
  vec2 over = 1.0 - 2.0 * mod(cell, 2.0);
  float warp = RISE * over.x * sin(PI * p.y) + round_(f.x) * (0.86 + 0.28 * hash(cell.x));
  float weft = -RISE * over.y * sin(PI * p.x) + round_(f.y) * (0.86 + 0.28 * hash(cell.y + 71.0));
  return max(warp, weft) / (1.14 + RISE);
}

float ramp(float x) {
  float left = 1.0 - clamp(x, 0.0, 1.0);
  return left * left;
}

void main() {
  // The place on the board, in page widths both ways.
  vec2 at = vec2(vPaper.x, vPaper.y * uHeight);

  vec3 base = uTint;
  float alpha = 1.0;
  float stamped = 0.0;
  // How the surface leans, across and down, and how the rim of what is stamped does.
  vec2 lean = vec2(0.0);
  vec2 rim = vec2(0.0);

  if (uPicture > 0.5) {
    vec3 ink = inkAt(vPaper);
    base = ink;
    if (uFoil > 0.0 || uDeboss > 0.0) {
      stamped = stamp(ink);
      // What is stamped is pressed in, and its rim leans into the hollow.
      vec2 step_ = mix(1.5, 2.2, uDeboss) * uDensity * uTexel / uFit;
      float across = stamp(inkAt(vPaper + vec2(step_.x, 0.0))) - stamp(inkAt(vPaper - vec2(step_.x, 0.0)));
      float down = stamp(inkAt(vPaper + vec2(0.0, step_.y))) - stamp(inkAt(vPaper - vec2(0.0, step_.y)));
      rim = (0.6 * uFoil + 1.5 * uDeboss) * vec2(across, down);
      lean += rim;
      // Pressed in with no foil, it is the cover's own colour, a little darker for being pressed.
      base = mix(base, uTint * 0.84, stamped * uDeboss * (1.0 - uFoil));
    }
  }
  // How smooth the stamping has left the surface, and how much of it is metal.
  float flat_ = stamped * max(uFoil, uDeboss);
  float metal = stamped * uFoil;

  // The weave, which fades out before its threads are too fine to draw.
  vec2 p = at * uThreads;
  float fine = max(fwidth(p.x), fwidth(p.y));
  float show = uCloth * (1.0 - smoothstep(0.3, 0.8, fine));
  float amount = show * (1.0 - 0.8 * flat_);
  float height = 0.5;
  if (amount > 0.0) {
    const float E = 0.06;
    height = weave(p);
    vec2 slope = vec2(
      weave(p + vec2(E, 0.0)) - weave(p - vec2(E, 0.0)),
      weave(p + vec2(0.0, E)) - weave(p - vec2(0.0, E))
    ) / (2.0 * E);
    lean -= amount * BUMP * slope;
  }

  // The grain of leather, likewise.
  vec2 q = at * uThreads * 0.9;
  float grained = uLeather * (1.0 - smoothstep(0.3, 0.8, max(fwidth(q.x), fwidth(q.y))));
  float pebbled = grained * (1.0 - 0.85 * flat_);
  float pebble = 0.7;
  if (pebbled > 0.0) {
    const float E = 0.05;
    pebble = pebbles(q);
    vec2 slope = vec2(pebbles(q + vec2(E, 0.0)), pebbles(q + vec2(0.0, E))) - pebble;
    lean -= pebbled * PEBBLE * slope / E * 0.25;
  }

  float shaded = 1.0;
  if (uShape != 0) {
    // How far inside the board's outline this is, and which way its nearest
    // edge lies. The two corners away from the spine are rounded.
    float corner = uRound > 0.0 ? uRound + uReach : 0.0;
    float middle = 0.5 * uHeight;
    vec2 past = vec2(at.x - (1.0 + uReach - corner), abs(at.y - middle) - (middle + uReach - corner));
    float inside;
    vec2 toward;
    if (past.x > 0.0 && past.y > 0.0) {
      float away = length(past);
      inside = corner - away;
      toward = past / away;
    } else if (past.x > past.y) {
      inside = corner - past.x;
      toward = vec2(1.0, 0.0);
    } else {
      inside = corner - past.y;
      toward = vec2(0.0, 1.0);
    }
    toward.y *= sign(at.y - middle);
    if (corner > 0.0) {
      // Soft over a pixel of the screen, measured the way the edge lies there. A board standing
      // on end is squeezed one way on the screen and not the other: measured by the squeezed
      // way, its other edges would fade over a wide band and show what is behind them.
      float soft = max(fwidth(inside), 1e-6);
      alpha *= 1.0 - smoothstep(-soft, soft, -inside);
    }
    // The board's free edges are rounded over.
    lean += uDeep * BEVEL * ramp(inside / EDGE) * toward;
    if (uShape == 1) {
      // The joint: a groove beside the spine, where the cloth lets the board hinge.
      float x = (at.x - JOINT) / JOINT_WIDTH;
      lean.x -= uDeep * JOINT_SLOPE * x * exp(0.5 * (1.0 - x * x));
      // Less of the room's light finds the bottom of it.
      shaded = 1.0 - uDeep * 0.16 * exp(-0.5 * x * x);
    } else {
      // The pages lying on the board keep the light off the rim around them.
      vec2 off = vec2(at.x - (1.0 - uRound), abs(at.y - middle) - (middle - uRound));
      float outside = (off.x > 0.0 && off.y > 0.0 ? length(off) : max(off.x, off.y)) - uRound;
      shaded = 1.0 - uStack * exp(-max(outside, 0.0) / 0.009);
    }
  }

  vec3 facing = normalize(uOut + lean.x * uRight + lean.y * vec3(0.0, 1.0, 0.0));

  // The room's light, as on paper: lying flat is fully lit.
  float room = max(dot(facing, uRoom), 0.0) / uRoom.z;
  float lit = mix(DARK, 1.0, min(room, BRIGHT));

  // The lamp over the pointer. It is brightest beneath itself.
  vec3 toLamp = uLamp - vPlace;
  float far = length(toLamp);
  vec3 lamp = toLamp / far;
  vec3 eye = normalize(uEyeAt - vPlace);
  float near = 1.0 / (1.0 + 1.6 * far * far);
  float lamplit = max(dot(facing, lamp), 0.0) * near;
  float glance = max(dot(facing, normalize(lamp + eye)), 0.0);

  // Cloth: the dye is deeper between the threads, and the threads catch the lamp.
  // Leather: darker in its creases, and smooth enough to throw the lamp back whiter and tighter.
  float hide = uLeather / max(uLeather + uCloth, 1e-4);
  vec3 dyed = base
    * mix(1.0, 0.6 + 0.62 * height, show * (1.0 - flat_))
    * mix(1.0, 0.84 + 0.26 * pebble, pebbled);
  vec3 glint = mix(mix(vec3(1.0), base, 0.55), vec3(1.0), hide);
  float gloss = mix(0.5 * pow(glance, 12.0), 0.5 * pow(glance, 36.0) + 0.1 * pow(glance, 6.0), hide);
  // Leather shows a little of the room's light too, or black leather would show nothing.
  float ambient = hide * 0.07 * pow(max(dot(facing, normalize(uRoom + eye)), 0.0), 18.0);
  vec3 cloth = dyed * (lit + uSheen * 0.9 * lamplit) + uSheen * (near * gloss + ambient) * glint;

  // Foil: dull until it throws the lamp back, and then the colour of the metal.
  vec3 foil = base * (0.72 * lit + 0.5 * lamplit)
    + base * near * (1.1 * pow(glance, 48.0) + 0.5 * pow(glance, 8.0))
    + vec3(near * 0.5 * pow(glance, 200.0));

  // The far rim of a hollow faces the room's light and catches it, which is
  // what shows a hollow in something too dark to show its shading.
  vec2 lightward = normalize(vec2(dot(uRoom, uRight), uRoom.y) + 1e-5);
  float caught = min(max(dot(rim, lightward), 0.0), 1.0);

  vec3 seen = (mix(cloth, foil, metal) + 0.2 * caught * mix(vec3(1.0), base, 0.5)) * shaded;
  colour = vec4(seen * alpha, alpha);
}
`;

/**
 * Places a strip of cloth as a page is placed, at a depth that grows along it: where the strip crosses itself the
 * later part lies on top, and the depth tells its shadow what is under it.
 */
const STRIP_VERTEX = `#version 300 es
in vec3 aPlace;
in vec2 aPaper;
in float aAlong;

uniform vec2 uOrigin;
uniform vec2 uUnit;
uniform vec2 uCentre;
uniform float uEye;
// How deep the strip is where it starts, from 0 to 1, and how much deeper for each page width along it.
uniform vec2 uDeep;

out vec2 vPaper;
out float vAlong;

void main() {
  float depth = 1.0 - aPlace.z / uEye;
  vec2 at = (uOrigin + uCentre * uUnit) * depth + (aPlace.xy - uCentre) * uUnit;
  float deep = clamp(uDeep.x + uDeep.y * aPaper.y, 0.0, 1.0);
  gl_Position = vec4(at, (2.0 * deep - 1.0) * depth, depth);
  vPaper = aPaper;
  vAlong = aAlong;
}
`;

/**
 * Paints a strip of cloth lying flat: a ribbon, or its shadow. `vPaper` is across the strip from 0 to 1, and along it
 * in page widths. With it comes how far the strip has banked over there, or for a shadow how far it is lifted.
 */
const STRIP_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vPaper;
in float vAlong;

// 0 for a ribbon, 2 for the shadow under it.
uniform int uKind;
uniform vec3 uColour;
uniform float uOpacity;
// How wide the strip is, in page widths.
uniform float uWidth;
// For a shadow: how far it fades out over at its edges, in page widths,
// and how many times further again where the strip is lifted; and how far
// along the strip the run it is the shadow of begins and ends.
uniform vec2 uSoft;
uniform vec2 uRun;
// For a shadow, whether its depth is how dark it is: the darker, the nearer.
// A shadow is laid in two goes, so that where two parts of it fall on one
// spot only the darker shows, and it is never darker for being drawn twice:
// 1 for the first go, which only finds how dark each spot is, and 2 for the
// second, which draws what is that dark, to within a hair.
uniform int uOnce;
// The way to the lamp.
uniform vec3 uLight;

out vec4 colour;

const float PI = 3.141592653589793;

void main() {
  float across = vPaper.x;
  float edge = min(across, 1.0 - across);
  float along = vPaper.y / uWidth;

  if (uKind == 2) {
    // Even under the strip, and fading out across its edges and past its
    // ends: half gone at the edge itself. Under cloth that is held up it is
    // fainter and fades over further, so a narrow strip held high throws
    // hardly any.
    float high = clamp(vAlong, 0.0, 1.0);
    float soft = uSoft.x * (1.0 + uSoft.y * high);
    float fade = 2.0 * soft;
    float within = 2.0 * edge * (0.5 * uWidth + soft);
    float sides = smoothstep(0.0, fade, within);
    float ends = smoothstep(0.0, fade, vPaper.y - uRun.x + soft) * smoothstep(0.0, fade, uRun.y + soft - vPaper.y);
    float dark = uOpacity * (1.0 - 0.35 * high) * sides * ends;
    colour = vec4(uColour * dark, dark);
    // Of two parts as dark as each other, the one that comes first along the strip.
    float nearer = 0.94 - 0.9 * dark + 0.05 * gl_FragCoord.z;
    gl_FragDepth = uOnce == 0 ? gl_FragCoord.z : clamp(uOnce == 2 ? nearer - 0.000003 : nearer, 0.0, 1.0);
    return;
  }

  // Which way the strip runs here on the book, where y is down the page; on the screen it is up.
  vec2 slope = vec2(dFdx(vPaper.y), -dFdy(vPaper.y));
  vec2 run = dot(slope, slope) > 0.0 ? normalize(slope) : vec2(0.0, 1.0);
  vec3 up = vec3(0.0, 0.0, 1.0);
  vec3 flat_ = vec3(-run.y, run.x, 0.0);
  // Banked over on its edge, it faces part of the way sideways.
  vec3 normal = cos(vAlong) * up + sin(vAlong) * flat_;
  vec3 weft = cos(vAlong) * flat_ - sin(vAlong) * up;
  vec3 light = normalize(uLight);
  vec3 halfway = normalize(light + up);
  float lit = max(dot(normal, light), 0.0) / light.z;

  // Satin. Its face is long threads lying along it, which shine when the
  // lamp is across them: so the shine comes and goes as the strip turns,
  // and doesn't run down its middle as it would on a cord. The threads
  // across it only show their shine where it banks.
  float down = dot(vec3(run, 0.0), halfway);
  float over = dot(weft, halfway);
  float shine = pow(max(0.0, 1.0 - down * down), 18.0);
  float glint = pow(max(0.0, 1.0 - over * over), 40.0) * smoothstep(0.15, 0.8, abs(vAlong));
  vec3 sheen = mix(uColour, vec3(1.0), 0.4) * (0.2 * shine + 0.22 * glint);

  // A selvedge at each edge, and a fine twill.
  float selvedge = 1.0 - 0.16 * (1.0 - smoothstep(0.0, 0.1, edge));
  float twill = sin((along * 7.0 + across * 3.0) * 2.0 * PI);
  float fine = fwidth(along * 7.0);
  float weave = 1.0 + 0.05 * twill * (1.0 - smoothstep(0.25, 0.6, fine));
  vec3 seen = (uColour * (0.74 + 0.2 * lit) + sheen) * selvedge * weave;

  float cover = smoothstep(0.0, 1.5 * max(fwidth(across), 1e-4), edge) * uOpacity;
  colour = vec4(seen * cover, cover);
  gl_FragDepth = gl_FragCoord.z;
}
`;

/** Covers the canvas, and says where on the book each pixel is. */
const SHADOW_VERTEX = `#version 300 es
in vec2 aCorner;

uniform vec2 uOrigin;
uniform vec2 uUnit;

out vec2 vBook;

void main() {
  gl_Position = vec4(aCorner, 0.0, 1.0);
  vBook = (aCorner - uOrigin) / uUnit;
}
`;

/**
 * The shadow of the paper that has come over a curl, on whatever lies under it. Each point looks towards the light
 * and is dark where paper is in the way, soft where that paper is far above and sharp where it is near: widest
 * under the lifted corner, and nothing at either end of the curl, where the paper comes down to the page.
 */
const SHADOW_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vBook;

uniform vec2 uLine;
uniform vec2 uAcross;
uniform float uRadius;
// The leaf at rest: its left edge, and its height.
uniform vec2 uLeaf;
// How round its two corners away from the spine are.
uniform float uRound;
// The way the light leans, which the shadow leans away from.
uniform vec2 uLean;
// Where the eye is over, and how far above the page.
uniform vec2 uCentre;
uniform float uEye;
uniform vec3 uShade;
uniform float uStrength;

out vec4 colour;

const float PI = 3.141592653589793;

// How far outside the leaf its paper is that lies over ground, along the
// leaf from the line where it lifts. Negative inside it.
float outsideOf(vec2 ground, float along) {
  vec2 paper = ground + (along - dot(ground - uLine, uAcross)) * uAcross;
  vec2 half_ = vec2(0.5, 0.5 * uLeaf.y);
  vec2 from = paper - vec2(uLeaf.x + 0.5, half_.y);
  // Only the corners away from the spine are round.
  float corner = from.x * (uLeaf.x < -0.5 ? -1.0 : 1.0) > 0.0 ? uRound : 0.0;
  vec2 off = abs(from) - half_ + corner;
  return length(max(off, 0.0)) + min(max(off.x, off.y), 0.0) - corner;
}

// How much of the light that paper keeps off what is gap below it: all of
// it well inside the leaf, none well outside. The further off the paper,
// the softer the edge of its shadow.
float shadeOf(vec2 ground, float along, float gap) {
  float soft = 0.008 + 0.3 * gap;
  return 1.0 - smoothstep(-0.35 * soft, soft, outsideOf(ground, along));
}

// How dark the paper in the air makes the point here, which is at across
// the line where the paper lifts and from above the page: on the page, or
// with onRoll on the paper going up the roll.
//
// Across that line the paper in the air is a roll standing on the line,
// then a sheet lying level on top of the roll, back over the paper that
// hasn't lifted. The point is in shadow where the way from it to the light
// meets that paper, at whatever height it does: so low paper shades only
// what is next to it, and high paper throws its shadow further off.
float castOn(vec2 here, float at, float from, float radius, bool onRoll) {
  float lean = dot(uLean, uAcross);
  float dark = 0.0;

  // The sheet on top.
  float rise = 2.0 * radius - from;
  float over = at + lean * rise;
  if (over <= 0.0) dark = shadeOf(here + uLean * rise, PI * radius - over, rise);

  // The roll: where the way to the light goes through it, or how nearly it does.
  float a = lean * lean + 1.0;
  float b = at * lean + from - radius;
  float c = at * at + (from - radius) * (from - radius) - radius * radius;
  float inside = b * b - a * c;
  if (onRoll) {
    // Paper turned from the light is as dark as any of it is, and paper
    // that is turning from it is on its way there: a roll has no edge
    // where its own shade begins.
    dark = max(dark, 1.0 - smoothstep(0.0, 0.5 * radius, -b));
    // Otherwise the way to the light sets out from the roll, and meets it
    // once more further round.
    float gap = -2.0 * b / a;
    float across = at + lean * gap;
    if (gap <= 0.0 || across < 0.0) return dark;
    return max(dark, shadeOf(here + uLean * gap, radius * atan(across, radius - from - gap), gap));
  }
  float least = 1e-4;
  if (inside >= 0.0) {
    float root = sqrt(inside);
    for (int which = 0; which < 2; which++) {
      float gap = (-b + (which == 0 ? -root : root)) / a;
      float across = at + lean * gap;
      if (gap < least || across < 0.0) continue;
      float angle = atan(across, radius - from - gap);
      dark = max(dark, shadeOf(here + uLean * gap, radius * angle, gap));
    }
  } else {
    // Past its side the shadow of the roll fades out: the light isn't a point.
    float gap = -b / a;
    float across = at + lean * gap;
    if (gap > least && across > 0.0) {
      float miss = sqrt(radius * radius - inside / a) - radius;
      float angle = atan(across, radius - from - gap);
      float soft = 0.008 + 0.3 * gap;
      dark = max(dark, (1.0 - smoothstep(0.0, soft, miss)) * shadeOf(here + uLean * gap, radius * angle, gap));
    }
  }
  return dark;
}

void main() {
  float radius = max(uRadius, 1e-5);
  float at = dot(vBook - uLine, uAcross);

  // What is drawn here is the page, or the paper that hasn't lifted.
  float dark = castOn(vBook, at, 0.0, radius, false);
  if (at >= radius) {
    // On the page the paper has left it is darkest against the roll and
    // fades away from it, further on the side the light doesn't reach:
    // little light of any kind gets in under a roll.
    float reach = 0.02 + radius * (0.7 + 2.2 * max(0.0, -dot(uLean, uAcross)));
    float beside = 1.0 - smoothstep(0.0, reach, at - radius);
    // Against the roll it ends where the roll does. Further off, less sharply.
    float end = outsideOf(vBook, 0.5 * PI * radius);
    float soft = 0.008 + 0.3 * radius;
    float along = mix(
      1.0 - smoothstep(-0.004, 0.004, end),
      1.0 - smoothstep(-0.35 * soft, soft, end),
      smoothstep(0.0, 0.5 * reach, at - radius)
    );
    dark = max(dark, beside * along);
  }

  // Or it is the paper on its way up the roll, as far round as the leaf
  // goes. That paper is nearer the eye than the page, so it is seen further
  // from the middle than it is: the line of sight through here meets the
  // roll at some height, and what is there is what is drawn here.
  float slant = -dot(vBook - uCentre, uAcross) / uEye;
  float a = slant * slant + 1.0;
  float b = at * slant - radius;
  float met = b * b - a * at * at;
  if (met >= 0.0) {
    float lift = (-b - sqrt(met)) / a;
    float on = at + slant * lift;
    if (on > 0.0 && lift < radius) {
      vec2 where = uCentre + (vBook - uCentre) * (uEye - lift) / uEye;
      float there = 1.0 - smoothstep(-0.004, 0.004, outsideOf(where, radius * atan(on, radius - lift)));
      if (there > 0.0) dark = mix(dark, castOn(where, on, lift, radius, true), there);
    }
  }

  dark *= uStrength;
  colour = vec4(uShade * dark, dark);
}
`;

/**
 * The shadow of a board on whatever lies under it, and on the table beside the book. For a point on the ground it
 * finds the part of the board, which runs from the spine at an angle, that keeps the room's light off it: soft
 * under a board standing high, sharper under one lying low.
 */
const BOARD_SHADOW_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vBook;

// The way the board runs from the spine: across, and up.
uniform vec2 uRun;
// How far it reaches from the spine, and how tall the page is.
uniform vec2 uSize;
// How far it stands out past the page, how round its two corners away from
// the spine are, and how high it lies when it is flat.
uniform float uReach;
uniform float uRound;
uniform float uRaised;
// The way shadows lean: away from the room's light, for each unit of height.
uniform vec2 uLean;
// The edges of the ground a shadow may fall on: left, top, right, bottom.
uniform vec4 uBounds;
uniform vec3 uShade;
uniform float uStrength;

out vec4 colour;

void main() {
  // A point of the board at u from the spine throws its shadow u * spread across.
  float spread = uRun.x + uLean.x * uRun.y;
  float u = (vBook.x - uLean.x * uRaised) / (abs(spread) < 1e-4 ? 1e-4 : spread);
  float height = clamp(u, 0.0, uSize.x) * uRun.y + uRaised;
  float v = vBook.y - uLean.y * height;

  // How far outside the board's shadow the point is. The shadow starts at
  // the spine and stays on the side the board leans over.
  // Measured on the board, where its corners are round, and then brought
  // down to the ground, where a board that leans throws a narrower shadow.
  float middle = 0.5 * uSize.y;
  vec2 off = vec2(u - uSize.x, abs(v - middle) - middle - uReach) + uRound;
  vec2 past = max(off, 0.0);
  float board = length(past) + min(max(off.x, off.y), 0.0) - uRound;
  float along = past.x + past.y > 0.0 ? past.x / (past.x + past.y) : step(off.y, off.x);
  float outside = board * mix(1.0, abs(spread), along);
  float soft = 0.006 + 0.3 * height;
  float side = step(0.0, vBook.x * spread);

  // It fades out towards the edge of the ground, all the way from the book, rather than
  // being cut off there: a board standing on end throws a long shadow, and most of it is
  // past where the ground ends.
  float margin = min(min(vBook.x - uBounds.x, uBounds.z - vBook.x), min(vBook.y - uBounds.y, uBounds.w - vBook.y));

  float dark = uStrength
    * side
    * (1.0 - smoothstep(-0.35 * soft, soft, outside))
    * smoothstep(0.0, 0.05, abs(spread))
    * smoothstep(0.0, 0.1, margin);
  colour = vec4(uShade * dark, dark);
}
`;

export {
  BOARD_SHADOW_FRAGMENT,
  COVER_FRAGMENT,
  FACE_FRAGMENT,
  FACE_VERTEX,
  SHADOW_FRAGMENT,
  SHADOW_VERTEX,
  STRIP_FRAGMENT,
  STRIP_VERTEX,
};

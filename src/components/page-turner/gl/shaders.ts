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
  float depth = 1.0 - aPlace.z / uEye;
  vec2 at = (uOrigin + uCentre * uUnit) * depth + (aPlace.xy - uCentre) * uUnit;
  gl_Position = vec4(at, 0.0, depth);
  vPaper = aPaper;
  vAlong = aAlong;
  vPlace = aPlace;
}
`;

const FACE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vPaper;
in float vAlong;

uniform sampler2D uPage;
uniform vec2 uFit;
uniform float uMirror;
uniform float uDim;
uniform float uVeil;
uniform vec3 uPaper;
uniform vec3 uGutter;
uniform vec3 uShade;
uniform int uSide;
uniform float uRadius;
uniform vec2 uAcross;
uniform vec3 uLight;
uniform float uHeight;
uniform float uGrain;
uniform float uTooth;
uniform float uSeed;

out vec4 colour;

const float PI = 3.141592653589793;
const float DARK = 0.68;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

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
    vec2 p = vec2(vPaper.x, vPaper.y * uHeight) * uTooth;
    float fine = max(fwidth(p.x), fwidth(p.y));
    float show = uGrain * (1.0 - smoothstep(0.7, 1.6, fine));
    ink.rgb *= 1.0 + 0.05 * show * grain(p + uSeed);
  }

  float light = 1.0;
  if (uSide != 0 && uRadius > 0.0) {
    float turn = clamp(vAlong / uRadius, 0.0, PI);
    vec3 facing = vec3(-sin(turn) * uAcross, cos(turn)) * (uSide == 1 ? 1.0 : -1.0);
    float lit = max(dot(facing, uLight), 0.0) / uLight.z;
    light = min(mix(DARK, 1.0, lit), 1.0);
  }

  colour = vec4(ink.rgb * ink.a * light * (1.0 - uDim), ink.a);
}
`;

const COVER_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vPaper;
in vec3 vPlace;

uniform sampler2D uPage;
uniform vec2 uFit;
uniform vec2 uTexel;
uniform float uDensity;
uniform float uMirror;
uniform float uPicture;
uniform vec3 uTint;
uniform float uHeight;
uniform vec3 uRight;
uniform vec3 uOut;
uniform vec3 uRoom;
uniform vec3 uLamp;
uniform vec3 uEyeAt;
uniform float uCloth;
uniform float uLeather;
uniform float uSheen;
uniform float uFoil;
uniform float uDeboss;
uniform float uThreads;
uniform int uShape;
uniform float uReach;
uniform float uDeep;
uniform float uStack;
uniform float uRound;

out vec4 colour;

const float PI = 3.141592653589793;
const float DARK = 0.56;
const float BRIGHT = 1.15;
const float PEBBLE = 0.55;
const float BUMP = 0.5;
const float RISE = 0.42;
const float EDGE = 0.008;
const float BEVEL = 0.75;
const float JOINT = 0.05;
const float JOINT_WIDTH = 0.022;
const float JOINT_SLOPE = 0.55;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}

vec3 inkAt(vec2 board) {
  vec2 at = vec2(mix(board.x, 1.0 - board.x, uMirror), board.y) * uFit;
  vec4 ink = texture(uPage, clamp(at, uTexel, uFit - 1.5 * uTexel));
  return mix(uTint, ink.rgb, ink.a);
}

float stamp(vec3 ink) {
  return smoothstep(0.03, 0.15, distance(ink, uTint));
}

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

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
  return smoothstep(0.0, 0.55, next - nearest) * (1.0 - 0.35 * nearest);
}

float round_(float f) {
  return pow(sin(PI * f), 0.6);
}

float weave(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
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
  vec2 at = vec2(vPaper.x, vPaper.y * uHeight);

  vec3 base = uTint;
  float alpha = 1.0;
  float stamped = 0.0;
  vec2 lean = vec2(0.0);
  vec2 rim = vec2(0.0);

  if (uPicture > 0.5) {
    vec3 ink = inkAt(vPaper);
    base = ink;
    if (uFoil > 0.0 || uDeboss > 0.0) {
      stamped = stamp(ink);
      vec2 step_ = mix(1.5, 2.2, uDeboss) * uDensity * uTexel / uFit;
      float across = stamp(inkAt(vPaper + vec2(step_.x, 0.0))) - stamp(inkAt(vPaper - vec2(step_.x, 0.0)));
      float down = stamp(inkAt(vPaper + vec2(0.0, step_.y))) - stamp(inkAt(vPaper - vec2(0.0, step_.y)));
      rim = (0.6 * uFoil + 1.5 * uDeboss) * vec2(across, down);
      lean += rim;
      base = mix(base, uTint * 0.84, stamped * uDeboss * (1.0 - uFoil));
    }
  }
  float flat_ = stamped * max(uFoil, uDeboss);
  float metal = stamped * uFoil;

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
      float soft = max(fwidth(inside), 1e-6);
      alpha *= 1.0 - smoothstep(-soft, soft, -inside);
    }
    lean += uDeep * BEVEL * ramp(inside / EDGE) * toward;
    if (uShape == 1) {
      float x = (at.x - JOINT) / JOINT_WIDTH;
      lean.x -= uDeep * JOINT_SLOPE * x * exp(0.5 * (1.0 - x * x));
      shaded = 1.0 - uDeep * 0.16 * exp(-0.5 * x * x);
    } else {
      vec2 off = vec2(at.x - (1.0 - uRound), abs(at.y - middle) - (middle - uRound));
      float outside = (off.x > 0.0 && off.y > 0.0 ? length(off) : max(off.x, off.y)) - uRound;
      shaded = 1.0 - uStack * exp(-max(outside, 0.0) / 0.009);
    }
  }

  vec3 facing = normalize(uOut + lean.x * uRight + lean.y * vec3(0.0, 1.0, 0.0));

  float room = max(dot(facing, uRoom), 0.0) / uRoom.z;
  float lit = mix(DARK, 1.0, min(room, BRIGHT));

  vec3 toLamp = uLamp - vPlace;
  float far = length(toLamp);
  vec3 lamp = toLamp / far;
  vec3 eye = normalize(uEyeAt - vPlace);
  float near = 1.0 / (1.0 + 1.6 * far * far);
  float lamplit = max(dot(facing, lamp), 0.0) * near;
  float glance = max(dot(facing, normalize(lamp + eye)), 0.0);

  float hide = uLeather / max(uLeather + uCloth, 1e-4);
  vec3 dyed = base
    * mix(1.0, 0.6 + 0.62 * height, show * (1.0 - flat_))
    * mix(1.0, 0.84 + 0.26 * pebble, pebbled);
  vec3 glint = mix(mix(vec3(1.0), base, 0.55), vec3(1.0), hide);
  float gloss = mix(0.5 * pow(glance, 12.0), 0.5 * pow(glance, 36.0) + 0.1 * pow(glance, 6.0), hide);
  float ambient = hide * 0.07 * pow(max(dot(facing, normalize(uRoom + eye)), 0.0), 18.0);
  vec3 cloth = dyed * (lit + uSheen * 0.9 * lamplit) + uSheen * (near * gloss + ambient) * glint;

  vec3 foil = base * (0.72 * lit + 0.5 * lamplit)
    + base * near * (1.1 * pow(glance, 48.0) + 0.5 * pow(glance, 8.0))
    + vec3(near * 0.5 * pow(glance, 200.0));

  vec2 lightward = normalize(vec2(dot(uRoom, uRight), uRoom.y) + 1e-5);
  float caught = min(max(dot(rim, lightward), 0.0), 1.0);

  vec3 seen = (mix(cloth, foil, metal) + 0.2 * caught * mix(vec3(1.0), base, 0.5)) * shaded;
  colour = vec4(seen * alpha, alpha);
}
`;

const STRIP_VERTEX = `#version 300 es
in vec3 aPlace;
in vec2 aPaper;
in float aAlong;

uniform vec2 uOrigin;
uniform vec2 uUnit;
uniform vec2 uCentre;
uniform float uEye;
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

const STRIP_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vPaper;
in float vAlong;

uniform int uKind;
uniform vec3 uColour;
uniform float uOpacity;
uniform float uWidth;
uniform vec2 uSoft;
uniform vec2 uRun;
uniform int uOnce;
uniform vec3 uLight;

out vec4 colour;

const float PI = 3.141592653589793;

void main() {
  float across = vPaper.x;
  float edge = min(across, 1.0 - across);
  float along = vPaper.y / uWidth;

  if (uKind == 2) {
    float high = clamp(vAlong, 0.0, 1.0);
    float soft = uSoft.x * (1.0 + uSoft.y * high);
    float fade = 2.0 * soft;
    float within = 2.0 * edge * (0.5 * uWidth + soft);
    float sides = smoothstep(0.0, fade, within);
    float ends = smoothstep(0.0, fade, vPaper.y - uRun.x + soft) * smoothstep(0.0, fade, uRun.y + soft - vPaper.y);
    float dark = uOpacity * (1.0 - 0.35 * high) * sides * ends;
    colour = vec4(uColour * dark, dark);
    float nearer = 0.94 - 0.9 * dark + 0.05 * gl_FragCoord.z;
    gl_FragDepth = uOnce == 0 ? gl_FragCoord.z : clamp(uOnce == 2 ? nearer - 0.000003 : nearer, 0.0, 1.0);
    return;
  }

  vec2 slope = vec2(dFdx(vPaper.y), -dFdy(vPaper.y));
  vec2 run = dot(slope, slope) > 0.0 ? normalize(slope) : vec2(0.0, 1.0);
  vec3 up = vec3(0.0, 0.0, 1.0);
  vec3 flat_ = vec3(-run.y, run.x, 0.0);
  vec3 normal = cos(vAlong) * up + sin(vAlong) * flat_;
  vec3 weft = cos(vAlong) * flat_ - sin(vAlong) * up;
  vec3 light = normalize(uLight);
  vec3 halfway = normalize(light + up);
  float lit = max(dot(normal, light), 0.0) / light.z;

  float down = dot(vec3(run, 0.0), halfway);
  float over = dot(weft, halfway);
  float shine = pow(max(0.0, 1.0 - down * down), 18.0);
  float glint = pow(max(0.0, 1.0 - over * over), 40.0) * smoothstep(0.15, 0.8, abs(vAlong));
  vec3 sheen = mix(uColour, vec3(1.0), 0.4) * (0.2 * shine + 0.22 * glint);

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

const SHADOW_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vBook;

uniform vec2 uLine;
uniform vec2 uAcross;
uniform float uRadius;
uniform vec2 uLeaf;
uniform float uRound;
uniform vec2 uLean;
uniform vec2 uCentre;
uniform float uEye;
uniform vec3 uShade;
uniform float uStrength;

out vec4 colour;

const float PI = 3.141592653589793;

float outsideOf(vec2 ground, float along) {
  vec2 paper = ground + (along - dot(ground - uLine, uAcross)) * uAcross;
  vec2 half_ = vec2(0.5, 0.5 * uLeaf.y);
  vec2 from = paper - vec2(uLeaf.x + 0.5, half_.y);
  float corner = from.x * (uLeaf.x < -0.5 ? -1.0 : 1.0) > 0.0 ? uRound : 0.0;
  vec2 off = abs(from) - half_ + corner;
  return length(max(off, 0.0)) + min(max(off.x, off.y), 0.0) - corner;
}

float shadeOf(vec2 ground, float along, float gap) {
  float soft = 0.008 + 0.3 * gap;
  return 1.0 - smoothstep(-0.35 * soft, soft, outsideOf(ground, along));
}

float castOn(vec2 here, float at, float from, float radius, bool onRoll) {
  float lean = dot(uLean, uAcross);
  float dark = 0.0;

  float rise = 2.0 * radius - from;
  float over = at + lean * rise;
  if (over <= 0.0) dark = shadeOf(here + uLean * rise, PI * radius - over, rise);

  float a = lean * lean + 1.0;
  float b = at * lean + from - radius;
  float c = at * at + (from - radius) * (from - radius) - radius * radius;
  float inside = b * b - a * c;
  if (onRoll) {
    dark = max(dark, 1.0 - smoothstep(0.0, 0.5 * radius, -b));
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

  float dark = castOn(vBook, at, 0.0, radius, false);
  if (at >= radius) {
    float reach = 0.02 + radius * (0.7 + 2.2 * max(0.0, -dot(uLean, uAcross)));
    float beside = 1.0 - smoothstep(0.0, reach, at - radius);
    float end = outsideOf(vBook, 0.5 * PI * radius);
    float soft = 0.008 + 0.3 * radius;
    float along = mix(
      1.0 - smoothstep(-0.004, 0.004, end),
      1.0 - smoothstep(-0.35 * soft, soft, end),
      smoothstep(0.0, 0.5 * reach, at - radius)
    );
    dark = max(dark, beside * along);
  }

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

const BOARD_SHADOW_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vBook;

uniform vec2 uRun;
uniform vec2 uSize;
uniform float uReach;
uniform float uRound;
uniform float uRaised;
uniform vec2 uLean;
uniform vec4 uBounds;
uniform vec3 uShade;
uniform float uStrength;

out vec4 colour;

void main() {
  float spread = uRun.x + uLean.x * uRun.y;
  float u = (vBook.x - uLean.x * uRaised) / (abs(spread) < 1e-4 ? 1e-4 : spread);
  float height = clamp(u, 0.0, uSize.x) * uRun.y + uRaised;
  float v = vBook.y - uLean.y * height;

  float middle = 0.5 * uSize.y;
  vec2 off = vec2(u - uSize.x, abs(v - middle) - middle - uReach) + uRound;
  vec2 past = max(off, 0.0);
  float board = length(past) + min(max(off.x, off.y), 0.0) - uRound;
  float along = past.x + past.y > 0.0 ? past.x / (past.x + past.y) : step(off.y, off.x);
  float outside = board * mix(1.0, abs(spread), along);
  float soft = 0.006 + 0.3 * height;
  float side = step(0.0, vBook.x * spread);

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

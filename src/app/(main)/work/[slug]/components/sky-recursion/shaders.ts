export const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const CLOUDS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uTheme;
out vec4 outColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 R = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p, int oct) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 8; i++) { if (i >= oct) break; s += a * noise(p); p = R * p + 1.7; a *= 0.5; }
  return s;
}
float billow(vec2 p, int oct) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 8; i++) { if (i >= oct) break; s += a * (1.0 - abs(noise(p) * 2.0 - 1.0)); p = R * p + 3.1; a *= 0.5; }
  return s;
}

float uCov;
vec2 gWind;

float density(vec2 p, int oct) {
  vec2 q = p + gWind;
  vec2 warp = vec2(fbm(q * 0.45 + 2.0, 3), fbm(q * 0.45 + 7.3, 3)) - 0.5;
  q += warp * 0.55;
  float shape = fbm(q * 0.55, 4);
  float puff = billow(q * 1.5 + gWind * 0.6, oct);
  float soft = fbm(q * 3.1 - gWind, 3);
  float d = shape * 1.2 + (puff - 0.55) * 0.26 + (soft - 0.5) * 0.10 - uCov;
  return smoothstep(0.0, 0.42, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float elev = 0.45 + uv.y * 0.85;
  vec2 p = vec2((uv.x - 0.5) * aspect / elev, 1.0 / elev) * vec2(1.6, 2.4) + uTheme * vec2(17.3, 5.1);
  float t = uTime;
  gWind = vec2(t * 0.045, t * 0.008);

  vec3 col;
  if (uTheme < 0.5) {
    uCov = 0.30 + 0.24 * (uv.x * 0.7 + uv.y * 0.5 - 0.3);
    float d = density(p, 5);
    vec2 L = normalize(vec2(-0.9, -0.6)) * 0.05;
    float acc = 0.0;
    for (int i = 1; i <= 5; i++) acc += density(p + L * float(i), 4);
    float trans = exp(-acc * 0.35);
    float glow = smoothstep(1.45, 0.0, length((uv - vec2(0.15, 0.05)) * vec2(1.0, 1.3)));
    vec3 sky = mix(vec3(0.030, 0.060, 0.070), vec3(0.010, 0.022, 0.027), uv.y);
    sky = mix(sky, vec3(0.06, 0.12, 0.13), glow * 0.5);
    vec3 base = vec3(0.045, 0.085, 0.098);
    vec3 lit = vec3(0.44, 0.64, 0.68);
    vec3 cloud = mix(base, lit, pow(trans, 1.2) * (0.55 + 0.8 * glow));
    cloud += vec3(0.10, 0.17, 0.18) * pow(1.0 - d, 3.0) * trans * glow;
    col = mix(sky, cloud, smoothstep(0.0, 0.6, d));
    col *= 0.78 + 0.22 * smoothstep(1.3, 0.2, uv.x * 0.7 + uv.y);
    vec2 v = uv - 0.5;
    col *= 1.0 - 0.6 * dot(v, v);
  } else {
    uCov = 0.47 + 0.30 * (uv.x - 0.4) + 0.05 * (uv.y - 0.5);
    float d = density(p, 5);
    vec2 L = normalize(vec2(-0.7, 0.8)) * 0.045;
    float acc = 0.0;
    for (int i = 1; i <= 5; i++) acc += density(p + L * float(i), 4);
    float trans = exp(-acc * 0.28);
    vec3 zenith = vec3(0.07, 0.17, 0.86);
    vec3 horizon = vec3(0.58, 0.74, 0.99);
    float g = smoothstep(-0.15, 1.05, uv.x * 0.75 + uv.y * 0.45);
    float sunGlow = exp(-3.0 * length((uv - vec2(-0.05, 1.05)) * vec2(1.0, 1.2)));
    vec3 sky = mix(horizon, zenith, g);
    sky = mix(sky, vec3(0.88, 0.93, 1.0), sunGlow * 0.55);
    float deep = smoothstep(0.45, 0.0, length((uv - vec2(0.85, 0.12)) * vec2(1.0, 1.5)));
    sky = mix(sky, vec3(0.03, 0.08, 0.62), deep * 0.8);
    vec3 shadow = mix(vec3(0.62, 0.69, 0.86), sky, 0.2);
    vec3 sun = vec3(1.0, 0.995, 0.98);
    vec3 cloud = mix(shadow, sun, smoothstep(0.05, 0.75, trans));
    cloud += vec3(0.10) * pow(1.0 - d, 3.0) * (0.4 + sunGlow);
    cloud = mix(cloud, sky, 0.18 * (1.0 - uv.y));
    float a = smoothstep(0.0, 0.55, d);
    col = mix(sky, cloud, a);
    col = mix(col, vec3(0.85, 0.90, 1.0), 0.12 * (1.0 - uv.x) * (1.0 - uv.y));
    col = min(col, vec3(1.0));
  }
  float Lum = dot(col, vec3(0.299, 0.587, 0.114));
  outColor = vec4(col, Lum * Lum);
}
`;

export const RECURSION = `#version 300 es
precision highp float;
uniform sampler2D uImg;
uniform vec2 uRes;
uniform vec2 uTexRes;
uniform float uS;
uniform float uTheme;
uniform float uDpr;
uniform float uTime;
uniform vec3 uLineCol;
out vec4 outColor;

float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer8(vec2 a) { return bayer2(0.25 * a) * 0.0625 + bayer2(0.5 * a) * 0.25 + bayer2(a); }

float normL(float L) {
  return uTheme < 0.5 ? clamp((L - 0.03) / 0.30, 0.0, 1.0) : clamp((L - 0.20) / 0.80, 0.0, 1.0);
}
vec3 palette(float x) {
  if (uTheme < 0.5) {
    vec3 a = vec3(0.020, 0.065, 0.080), b = vec3(0.050, 0.170, 0.200), c = vec3(0.190, 0.560, 0.500), d = vec3(0.400, 0.900, 0.760);
    return x < 0.40 ? mix(a, b, x / 0.40) : x < 0.75 ? mix(b, c, (x - 0.40) / 0.35) : mix(c, d, (x - 0.75) / 0.25);
  }
  vec3 a = vec3(0.090, 0.150, 0.560), b = vec3(0.200, 0.320, 0.860), c = vec3(0.560, 0.650, 0.970), d = vec3(1.0, 1.0, 1.0);
  return x < 0.40 ? mix(a, b, x / 0.40) : x < 0.75 ? mix(b, c, (x - 0.40) / 0.35) : mix(c, d, (x - 0.75) / 0.25);
}

const int NSEED = 6;
bool covered(vec2 c, vec2 cell, float level) {
  vec2 seeds[NSEED] = vec2[NSEED](vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(0.96, 0.04),
                                  vec2(0.05, 0.92), vec2(0.58, 0.46), vec2(0.28, 0.62));
  float starts[NSEED] = float[NSEED](0.04, 0.10, 0.18, 0.26, 0.14, 0.34);
  float aspect = uRes.x / uRes.y;
  float jitter = (hash(cell * 1.91 + level * 17.3 + uTheme * 31.7) - 0.5) * 0.32;
  float full = smoothstep(0.82, 1.0, uS) * 3.0;
  for (int k = 0; k < NSEED; k++) {
    vec2 sp = seeds[k];
    if (uTheme > 0.5) sp.x = 1.0 - sp.x;
    float r = max(0.0, uS - starts[k]) * 1.25 + full;
    vec2 d = (c - sp) * vec2(aspect, 1.0);
    if (length(d) + jitter < r) return true;
  }
  return false;
}

int presentMask(vec2 p) {
  if (p.x < 0.0 || p.y < 0.0 || p.x >= uRes.x || p.y >= uRes.y) return 0;
  float px = max(1.0, floor(uDpr + 0.5));
  float size = uRes.y * 0.5;
  int mask = 0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 cell = floor(p / size);
    vec2 c = (cell + 0.5) * size / uRes;
    if (i >= 1 && covered(c, cell, fi)) mask |= (1 << i);
    if (i == 5 || size < 8.0 * px) break;
    float h = hash(cell * 1.37 + fi * 11.3 + uTheme * 7.1);
    float pSub = i == 0 ? 1.0 : (i == 1 ? 0.6 : 0.45);
    if (h > pSub) break;
    size *= 0.5;
  }
  return mask;
}

float gridLine(vec2 fc, float px) {
  if (uS < 0.02) return 0.0;
  int mC = presentMask(fc);
  int mL = presentMask(fc - vec2(px, 0.0));
  int mB = presentMask(fc - vec2(0.0, px));
  int mD = presentMask(fc - vec2(px, px));
  float lw = max(1.0, floor(px * 0.5));
  bool atRight = fc.x >= uRes.x - lw;
  bool atTop = fc.y >= uRes.y - lw;
  float size = uRes.y * 0.5;
  for (int i = 0; i < 9; i++) {
    int bit = 1 << i;
    vec2 lp = fc - floor(fc / size) * size;
    bool onV = lp.x < lw, onH = lp.y < lw;
    bool c = (mC & bit) != 0, l = (mL & bit) != 0, b = (mB & bit) != 0, d = (mD & bit) != 0;
    if ((onV && (c || l)) || (onH && (c || b)) || (onV && onH && d)) return 1.0;
    if ((atRight || atTop) && c) return 1.0;
    size *= 0.5;
  }
  return 0.0;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes;
  float s = uS;
  float px = max(1.0, floor(uDpr + 0.5));
  vec2 gp = floor(fc / px);

  vec3 img = texture(uImg, uv).rgb;
  float L = lum(img);
  float Ln = normL(L);

  float grain = hash(gp + 17.0);
  vec3 col = img + (grain - 0.5) * 0.045;

  vec3 lineCol = uLineCol;
  float lineOn = gridLine(fc, px);
  col = mix(col, lineCol, lineOn * min(1.0, px * 0.5));

  outColor = vec4(col, 1.0);
}
`;

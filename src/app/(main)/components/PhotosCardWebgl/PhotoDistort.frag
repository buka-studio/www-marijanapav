precision mediump float;

varying highp vec2 vUv;

uniform sampler2D uAtlas;
uniform float uHasTexture;
uniform float uHasTexturePrev;
uniform float uHasTextureNext;
uniform highp vec4 uAtlasRect;
uniform highp vec4 uAtlasRectPrev;
uniform highp vec4 uAtlasRectNext;
uniform vec2 uPlaneSize;
uniform float uBlur;
uniform float uGap;
uniform float uRadius;
uniform vec4 uOverlay;

const int BLUR_SAMPLES = 7;

highp vec2 toPhotoUv(highp vec2 meshUv) {
  return vec2(meshUv.x * (1.0 + uGap) - 0.5 * uGap, meshUv.y);
}

float interleavedGradientNoise(highp vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}

highp vec2 atlasUv(highp vec2 uv, highp vec4 rect) {
  return uv * rect.xy + rect.zw;
}

float roundedRectAlpha(highp vec2 uv) {
  vec2 size = max(uPlaneSize, vec2(1.0));
  float radius = min(uRadius, min(size.x, size.y) * 0.5);
  vec2 halfSize = size * 0.5;
  vec2 pos = abs((uv - 0.5) * size);
  vec2 q = pos - (halfSize - radius);
  float dist;

  if (q.x <= 0.0 || q.y <= 0.0) {
    dist = max(pos.x - halfSize.x, pos.y - halfSize.y);
  } else {
    dist = length(q) - radius;
  }

  if (dist <= -0.75) {
    return 1.0;
  }
  if (dist >= 0.75) {
    return 0.0;
  }
  return 1.0 - smoothstep(-0.75, 0.75, dist);
}

vec4 samplePhoto(highp vec4 rect, highp vec2 uv, float hasTexture) {
  if (hasTexture < 0.5) {
    return vec4(0.0);
  }

  vec3 rgb = texture2D(uAtlas, atlasUv(uv, rect)).rgb;
  return vec4(rgb, 1.0);
}

vec4 sampleCover(highp vec4 rect, highp vec2 uv, float hasTexture) {
  float alpha = roundedRectAlpha(uv);
  if (alpha <= 0.0) {
    return vec4(0.0);
  }

  vec4 photo = samplePhoto(rect, uv, hasTexture);
  return vec4(photo.rgb, alpha * photo.a);
}

vec4 sampleStrip(highp vec2 uv) {
  float stride = 1.0 + max(uGap, 0.0);

  if (uv.x >= 0.0 && uv.x <= 1.0) {
    return samplePhoto(uAtlasRect, uv, uHasTexture);
  }

  if (uv.x >= stride && uv.x <= stride + 1.0) {
    return samplePhoto(uAtlasRectNext, vec2(uv.x - stride, uv.y), uHasTextureNext);
  }

  if (uv.x >= -stride && uv.x <= -stride + 1.0) {
    return samplePhoto(uAtlasRectPrev, vec2(uv.x + stride, uv.y), uHasTexturePrev);
  }

  return vec4(0.0);
}

void main() {
  highp vec2 photoUv = toPhotoUv(vUv);
  vec4 color;

  if (uBlur < 0.001) {
    if (photoUv.x < 0.0 || photoUv.x > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }
    color = sampleCover(uAtlasRect, photoUv, uHasTexture);
  } else {
    vec3 rgb = vec3(0.0);
    float alpha = 0.0;
    float dither = interleavedGradientNoise(gl_FragCoord.xy);

    for (int i = 0; i < BLUR_SAMPLES; i++) {
      float t = (float(i) + dither) / float(BLUR_SAMPLES);
      float x = (t - 0.5) * 2.0;
      vec4 sampleColor = sampleStrip(vec2(photoUv.x + x * uBlur, photoUv.y));

      rgb += sampleColor.rgb;
      alpha += sampleColor.a;
    }

    color = vec4(rgb / max(alpha, 1.0e-5), step(1.0e-5, alpha));
  }

  gl_FragColor = color;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uOverlay.rgb, uOverlay.a * gl_FragColor.a);
}

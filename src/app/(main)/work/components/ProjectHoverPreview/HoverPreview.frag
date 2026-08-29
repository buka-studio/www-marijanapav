precision mediump float;

varying highp vec2 vUv;

uniform sampler2D uAtlas;
uniform float uHasTexture;
uniform float uHasTexturePrev;
uniform float uHasTextureNext;
uniform highp vec4 uAtlasRect;
uniform highp vec4 uAtlasRectPrev;
uniform highp vec4 uAtlasRectNext;
uniform float uBlur;
uniform float uGap;

const int BLUR_SAMPLES = 7;

float interleavedGradientNoise(highp vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}

highp vec2 atlasUv(highp vec2 uv, highp vec4 rect) {
  return uv * rect.xy + rect.zw;
}

vec4 samplePhoto(highp vec4 rect, highp vec2 uv, float hasTexture) {
  if (hasTexture < 0.5) {
    return vec4(0.0);
  }

  vec3 rgb = texture2D(uAtlas, atlasUv(uv, rect)).rgb;
  return vec4(rgb, 1.0);
}

vec4 sampleStrip(highp vec2 uv) {
  float stride = 1.0 + max(uGap, 0.0);

  if (uv.y >= 0.0 && uv.y <= 1.0) {
    return samplePhoto(uAtlasRect, uv, uHasTexture);
  }

  if (uv.y >= stride && uv.y <= stride + 1.0) {
    return samplePhoto(uAtlasRectPrev, vec2(uv.x, uv.y - stride), uHasTexturePrev);
  }

  if (uv.y >= -stride && uv.y <= -stride + 1.0) {
    return samplePhoto(uAtlasRectNext, vec2(uv.x, uv.y + stride), uHasTextureNext);
  }

  return vec4(0.0);
}

void main() {
  vec4 color;

  if (uBlur < 0.001) {
    color = samplePhoto(uAtlasRect, vUv, uHasTexture);
  } else {
    vec3 rgb = vec3(0.0);
    float alpha = 0.0;
    float dither = interleavedGradientNoise(gl_FragCoord.xy);

    for (int i = 0; i < BLUR_SAMPLES; i++) {
      float t = (float(i) + dither) / float(BLUR_SAMPLES);
      float y = (t - 0.5) * 2.0;
      vec4 sampleColor = sampleStrip(vec2(vUv.x, vUv.y + y * uBlur));

      rgb += sampleColor.rgb;
      alpha += sampleColor.a;
    }

    color = vec4(rgb / max(alpha, 1.0e-5), step(1.0e-5, alpha));
  }

  gl_FragColor = color;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}

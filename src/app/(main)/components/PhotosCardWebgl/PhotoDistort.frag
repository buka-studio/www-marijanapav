precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform sampler2D uTexturePrev;
uniform sampler2D uTextureNext;
uniform vec2 uImageSize;
uniform vec2 uImageSizePrev;
uniform vec2 uImageSizeNext;
uniform vec2 uPlaneSize;
uniform float uBlur;
uniform float uGap;
uniform float uRadius;
uniform vec4 uOverlay;

const int BLUR_SAMPLES = 17;

vec2 objectCoverUv(vec2 uv, vec2 imageSize) {
  float planeAspect = uPlaneSize.x / max(uPlaneSize.y, 1.0e-5);
  float imageAspect = imageSize.x / max(imageSize.y, 1.0e-5);
  vec2 ratio = vec2(min(planeAspect / imageAspect, 1.0), min(imageAspect / planeAspect, 1.0));
  return uv * ratio + 0.5 * (1.0 - ratio);
}

vec4 sampleCover(sampler2D tex, vec2 imageSize, vec2 uv) {
  vec2 size = max(uPlaneSize, vec2(1.0));
  float radius = min(uRadius, min(size.x, size.y) * 0.5);
  vec2 pos = (uv - 0.5) * size;
  vec2 q = abs(pos) - (size * 0.5 - radius);
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float alpha = 1.0 - smoothstep(-0.75, 0.75, dist);

  if (alpha <= 0.0) {
    return vec4(0.0);
  }

  return vec4(texture2D(tex, objectCoverUv(clamp(uv, 0.0, 1.0), imageSize)).rgb, alpha);
}

vec4 sampleStrip(vec2 uv) {
  float gap = max(uGap, 0.0);

  if (uv.x >= 0.0 && uv.x <= 1.0) {
    return sampleCover(uTexture, uImageSize, uv);
  }

  if (uv.x > 1.0 && uv.x < 1.0 + gap) {
    return vec4(0.0);
  }

  if (uv.x >= 1.0 + gap && uv.x <= 2.0 + gap) {
    return sampleCover(uTextureNext, uImageSizeNext, vec2(uv.x - 1.0 - gap, uv.y));
  }

  if (uv.x < 0.0 && uv.x > -gap) {
    return vec4(0.0);
  }

  if (uv.x >= -1.0 - gap && uv.x <= -gap) {
    return sampleCover(uTexturePrev, uImageSizePrev, vec2(uv.x + 1.0 + gap, uv.y));
  }

  return vec4(0.0);
}

void main() {
  vec4 color;

  if (uBlur < 0.001) {
    color = sampleCover(uTexture, uImageSize, vUv);
  } else {
    vec3 rgb = vec3(0.0);
    float alpha = 0.0;
    float weightSum = 0.0;

    for (int i = 0; i < BLUR_SAMPLES; i++) {
      float t = float(i) / float(BLUR_SAMPLES - 1);
      float x = (t - 0.5) * 2.0;
      float weight = exp(-x * x * 2.4);
      vec4 sampleColor = sampleStrip(vec2(vUv.x + x * uBlur, vUv.y));

      rgb += sampleColor.rgb * sampleColor.a * weight;
      alpha += sampleColor.a * weight;
      weightSum += weight;
    }

    color = vec4(rgb / max(alpha, 1.0e-5), alpha / max(weightSum, 1.0e-5));
  }

  gl_FragColor = color;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uOverlay.rgb, uOverlay.a * gl_FragColor.a);
}

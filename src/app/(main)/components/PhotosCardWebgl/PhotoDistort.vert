varying vec2 vUv;

uniform float uSquash;
uniform float uEnvelope;

void main() {
  vUv = uv;

  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  float nx = clamp(clip.x / max(clip.w, 1.0e-5), -1.0, 1.0);
  float center = cos(nx * 1.57079632679);
  float envelope = mix(1.0, center, uEnvelope);

  vec3 pos = position;
  pos.y *= 1.0 - uSquash * envelope;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
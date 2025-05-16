export const vertexShader = `
attribute vec2 aVertexPosition;
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

varying vec2 vUvs;

void main() {
    vec3 pos = translationMatrix * vec3(aVertexPosition, 1.0);
    vUvs = aVertexPosition + 0.5;
    gl_Position = vec4((projectionMatrix * pos).xy, 0.0, 1.0);
}`;

export const defaultIlluminationShader = `
precision mediump float;
varying vec2 vUvs;
uniform float colorIntensity;
uniform float pulse;
uniform float maxAlpha;
uniform vec3 color;

void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUvs, center);

    float outerRadius = 0.4;
    float pulseRange = 0.56;
    float innerRadius = outerRadius - pulseRange * pulse;
    float blendWidth = 0.04;

    float outerBaseAlpha = maxAlpha * 0.5;
    float outerAtInner = pow(smoothstep(outerRadius, innerRadius, innerRadius), 1.0) * outerBaseAlpha;

    float alpha = 0.0;

    if (dist <= innerRadius - blendWidth) {
        alpha = maxAlpha;
    } else if (dist <= innerRadius) {
        float t = smoothstep(innerRadius - blendWidth, innerRadius, dist);
        float outerAlphaAtDist = pow(smoothstep(outerRadius, innerRadius, dist), 1.0) * outerBaseAlpha;
        alpha = mix(maxAlpha, outerAlphaAtDist, t);
    } else if (dist <= outerRadius) {
        alpha = pow(smoothstep(outerRadius, innerRadius, dist), 1.2) * outerBaseAlpha;
    } else {
        discard;
    }

    // Apply both coloration and alpha
    vec3 finalColor = color * colorIntensity * alpha;
    gl_FragColor = vec4(finalColor, alpha);
}
`;
/**
 * Pulse animation illumination shader (Foundry style)
 */
export const smokePatchColorationShader = `
precision mediump float;

varying vec2 vUvs;

uniform float time;
uniform float maxAlpha;
uniform vec3 color;
uniform float colorIntensity;

float hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(dot(p, vec2(1.0))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; ++i) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.55;
  }
  return v;
}

void main() {
  vec2 uv = vUvs;

  // More aggressive turbulence
  vec2 q = uv + vec2(sin(time * 0.05), cos(time * 0.05)) * 0.3;
  float smoke = fbm(q * 4.0 + time * 0.03);

  vec2 center = vec2(0.5, 0.5);
  float dist = distance(uv, center);
  float falloff = smoothstep(0.55, 0.15, dist);

  float alpha = smoke * falloff * maxAlpha;

  gl_FragColor = vec4(color * colorIntensity * alpha, alpha);
}
`;

export const sunburstColorationShader = `
precision mediump float;

varying vec2 vUvs;

uniform float time;
uniform float maxAlpha;
uniform vec3 color;
uniform float colorIntensity;

void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = vUvs - center;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Create radial rays
    float rays = sin(angle * 12.0 + time * 2.0); // 12 rays rotating
    float rayMask = smoothstep(0.3, 0.8, rays);

    // Combine with distance falloff
    float radialFalloff = smoothstep(0.5, 0.0, dist);

    float alpha = rayMask * radialFalloff * maxAlpha;
    vec3 finalColor = color * colorIntensity * alpha;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export const torchIlluminationShader = `
precision mediump float;
varying vec2 vUvs;
uniform float colorIntensity;
uniform float pulse;
uniform float maxAlpha;
uniform vec3 color;
uniform float time;

float flicker(vec2 uv, float t) {
    return 0.97 + 0.03 * sin(t * 10.0 + uv.x * 3.0 + uv.y * 5.0);
}

void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUvs, center);

    float flick = clamp(flicker(vUvs, time), 0.9, 1.1);

    float outerRadius = 0.4;
    float pulseRange = 0.56;
    float innerRadius = outerRadius - pulseRange * pulse;
    float blendWidth = 0.04;

    float outerBaseAlpha = maxAlpha * 0.5;
    float alpha = 0.0;

    if (dist <= innerRadius - blendWidth) {
        alpha = maxAlpha;
    } else if (dist <= innerRadius) {
        float t = smoothstep(innerRadius - blendWidth, innerRadius, dist);
        float outerAlphaAtDist = pow(smoothstep(outerRadius, innerRadius, dist), 1.0) * outerBaseAlpha;
        alpha = mix(maxAlpha, outerAlphaAtDist, t);
    } else if (dist <= outerRadius) {
        alpha = pow(smoothstep(outerRadius, innerRadius, dist), 2.0) * outerBaseAlpha;
    } else {
        discard;
    }

    if (alpha < 0.01) discard;

    vec3 finalColor = color * colorIntensity * alpha * flick;
    gl_FragColor = vec4(finalColor, alpha * flick);
}`;
export const torchColorationShader = `
precision mediump float;

varying vec2 vUvs;

uniform float time;
uniform float maxAlpha;
uniform vec3 color;
uniform float colorIntensity;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float flicker(vec2 uv, float t) {
    float base = 0.9 + 0.1 * sin(t * 3.5 + uv.x * 2.0 + uv.y * 2.5);
    return clamp(base, 0.85, 1.15);
}

void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 flameUv = vUvs;

    flameUv.y += 0.01 * sin(time * 2.0 + flameUv.x * 6.0); // gentle vertical shimmer

    float dist = distance(flameUv, center);
    float flick = flicker(flameUv, time);

    // Glowing core blend
    float coreGlow = smoothstep(0.0, 0.15, 0.15 - dist);
    float falloff = smoothstep(0.5, 0.0, dist);

    float alpha = (coreGlow + falloff * 0.8) * flick * maxAlpha;

    vec3 flameColor = color * colorIntensity;
    flameColor.r += 0.15;
    flameColor.g += 0.05;

    gl_FragColor = vec4(flameColor * alpha, alpha);
}`;

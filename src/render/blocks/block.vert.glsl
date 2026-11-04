precision highp float;

attribute vec3 aPos0;
attribute vec3 aPos1;
attribute float aGrade;
attribute float aMaterial;
attribute float aSize;

uniform float uT;

varying float vGrade;
varying float vMaterial;
varying vec3 vWorld;
varying vec3 vNormal;

mat3 rotX(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

mat3 rotY(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotZ(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
}

float hash31(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

void main() {
  float t = clamp(uT, 0.0, 1.0);
  vec3 center = mix(aPos0, aPos1, t);

  vec3 seed = vec3(
    hash31(aPos0 + vec3(1.7)),
    hash31(aPos0 + vec3(9.2)),
    hash31(aPos0 + vec3(4.4))
  ) - 0.5;
  mat3 spin = rotY(seed.x * 3.6 * t) * rotX(seed.y * 3.0 * t) * rotZ(seed.z * 2.6 * t);
  vec3 local = spin * (position * aSize);

  float arc = length((aPos1 - aPos0).xz) * 0.22 * 4.0 * t * (1.0 - t);
  vec3 world = center + local + vec3(0.0, arc, 0.0);

  vWorld = world;
  vNormal = spin * normal;
  vGrade = aGrade;
  vMaterial = aMaterial;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
}

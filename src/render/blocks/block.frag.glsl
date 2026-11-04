precision highp float;

uniform sampler2D uRamp;
uniform int uColorMode;
uniform float uCutoff;
uniform float uGradeMax;
uniform float uOpacity;
uniform float uClipEnabled;
uniform vec4 uClipPlane;

varying float vGrade;
varying float vMaterial;
varying vec3 vWorld;
varying vec3 vNormal;

vec3 materialColor(float id) {
  int m = int(id + 0.5);
  if (m == 1) return vec3(0.96, 0.72, 0.20);
  if (m == 2) return vec3(0.56, 0.73, 0.48);
  return vec3(0.42, 0.46, 0.52);
}

void main() {
  if (uClipEnabled > 0.5) {
    if (dot(vWorld, uClipPlane.xyz) + uClipPlane.w < 0.0) discard;
  }

  float visible = step(uCutoff, vGrade);
  if (visible < 0.01) discard;

  vec3 color;
  if (uColorMode == 0) {
    float u = clamp(vGrade / max(uGradeMax, 0.0001), 0.0, 1.0);
    color = texture2D(uRamp, vec2(u, 0.5)).rgb;
  } else if (uColorMode == 1) {
    color = materialColor(vMaterial);
  } else {
    color = vec3(0.48, 0.62, 0.72);
  }

  vec3 lightDir = normalize(vec3(0.35, 0.9, 0.45));
  float shade = 0.58 + 0.42 * max(dot(normalize(vNormal), lightDir), 0.0);
  gl_FragColor = vec4(color * shade, uOpacity);
}

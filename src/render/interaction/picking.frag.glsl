precision highp float;

flat in int vInstance;
out vec4 fragColor;

void main() {
  float id = float(vInstance + 1);
  float r = mod(id, 256.0);
  float g = mod(floor(id / 256.0), 256.0);
  float b = mod(floor(id / 65536.0), 256.0);
  fragColor = vec4(r, g, b, 255.0) / 255.0;
}

# Task 05.03 — Colour ramp

A 1D `DataTexture` for the colour ramp (viridis by default), a mode switch (grade / material / neutral), and the uniforms to plumb it through the shader.

> Inherits from `docs/modules/05-render-blocks.md`.

---

## 1. What this task is
Replace the shader's hard-coded colour with a texture lookup on `vGrade`, add a material-id branch, and expose a mode selector.

## 2. What this task is not
Not the UI control. The React toggle in `ui/Toolbar.tsx` writes to the store; this task adds the shader side and the API.

## 3. Scope

### In
- `color-ramp.ts`:
  - `makeRamp(name: 'viridis' | 'magma' | 'neutral') → DataTexture` with 256 RGBA entries.
  - Viridis and magma hard-coded from the matplotlib reference values.
  - Neutral: dark grey to light grey.
- Shader:
  - Uniform `uRamp: sampler2D`.
  - Uniform `uColorMode: int` (0 = grade, 1 = material, 2 = neutral).
  - For `uColorMode == 0`: `texture2D(uRamp, vec2(vGrade / uGradeMax, 0.5))`.
  - For `uColorMode == 1`: palette indexed by `vMaterial` (small `const vec3[4]` in shader).
  - For `uColorMode == 2`: single accent colour.
- `blockField.setRamp(name)` and `blockField.setColorMode(mode)` and `blockField.setGradeMax(g)`.
- Ramp texture uses `LinearFilter`, no mipmaps, clamp-to-edge.

### Out
- Colour-blindness checks beyond choosing viridis/magma which are already perceptually uniform.
- Legend rendering (lives in `ui/`).

## 4. Tools and technology
`THREE.DataTexture`, `RGBAFormat`, `UnsignedByteType`.

## 5. Code structure delta
```
+ src/render/blocks/color-ramp.ts
+ src/render/blocks/block.frag.glsl   (updated)
+ src/render/blocks/instanced-blocks.ts (updated)
+ tests/unit/render/blocks/color-ramp.test.ts
```

## 6. Design patterns
- **Lookup via texture** — avoids branching chains in the shader.
- **Enum uniform** — `uColorMode` keeps the switch small and reduces shader variants.

## 7. Best practices and references
- Perceptually uniform ramps — Nathaniel Smith & Stéfan van der Walt on viridis.
- 1D ramp texture pattern — Fernando Serrano's blog post on data textures.
- Avoiding mipmaps on data textures — Three.js docs.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | `makeRamp('viridis')` returns a `DataTexture` with 256 × 1 pixels | Vitest |
| T02 | First pixel is dark (sum of RGB ≤ 150), last pixel is light (sum ≥ 500) | Vitest |
| T03 | `setRamp('magma')` swaps the texture reference on the uniform | Vitest |
| T04 | `setColorMode(2)` makes all rendered pixels the accent colour (off-screen render + readPixels) | Vitest |
| T05 | `setGradeMax(2.0)` halves the effective ramp coordinate for a block with `vGrade = 1.0` | Vitest, readback |
| T06 | A material id out of range (e.g. 99) falls back to the neutral colour, not a crash | Vitest |

## 9. Done means
- Switching modes in the UI shows the field re-coloured instantly, no re-upload.
- Legend (added later) matches the ramp pixel-for-pixel.

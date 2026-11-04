# Task 08.02 — Band rendering and toggle

Render the ensemble outlines as a translucent band, one draw call via an instanced `Line2`. UI toggle, member-count and sigma sliders.

> Inherits from `docs/modules/08-uncertainty.md`.

---

## 1. What this task is
`createEnsembleBand({ viewer, store, model }) → EnsembleBand` and the Radix controls that write to the store.

## 2. What this task is not
Not Playwright.

## 3. Scope

### In
- `ensemble-band.ts`:
  - One `Line2` per member in the first version (acceptable at `size ≤ 32`); upgrade to instanced-line later if needed.
  - Each outline is drawn at low opacity (configurable, default 0.12).
  - Shader reads the same `uT` and vector-field uniforms as the main polygon; per-member RNG state is encoded as `aMemberSeed`.
  - Rebuilds on polygon vertex change or `size`/`sigma` change.
- UI controls (`uncertainty/toggle.tsx`):
  - Radix `Switch` to enable/disable.
  - Slider for `size` (1..32).
  - Slider for `sigma` (0..5 m).
  - Collapsed disclosure panel in the right strip.
- Clean dispose chain.

### Out
- Statistical summary (quantiles, etc.).
- Automated performance benchmarking.

## 4. Tools and technology
Three.js `Line2`, Radix `Switch` and `Slider`, Zustand slice.

## 5. Code structure delta
```
+ src/render/uncertainty/ensemble-band.ts
+ src/render/uncertainty/band.vert.glsl
+ src/render/uncertainty/band.frag.glsl
+ src/uncertainty/toggle.tsx
+ src/state/slices/uncertainty.slice.ts
+ tests/unit/render/uncertainty/band.test.ts
+ tests/unit/uncertainty/toggle.test.tsx
```

## 6. Design patterns
- **Observer** — the band subscribes to the uncertainty slice.
- **Composition** — the band shader includes the same `displacement.inc.glsl` used by blocks and the main polygon.
- **Decoupled visibility** — toggling off hides and disposes GPU resources; toggling on recreates them lazily.

## 7. Best practices and references
- Instanced line techniques — Garrett Johnson's `three-mesh-bvh` and `Line2` discussion.
- Shared GLSL includes — `vite-plugin-glsl` docs.
- Radix accessibility defaults — Radix UI docs.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | Toggling on creates N line objects where N = `size` | Vitest |
| T02 | Toggling off removes and disposes them | Vitest |
| T03 | Changing `sigma` does not change line count; it updates uniforms | Vitest |
| T04 | Each member outline shows a different displacement at `t > 0` (readback test) | Vitest |
| T05 | Lines share the same `uT` uniform object identity as the main polygon | Vitest |
| T06 | Switch is keyboard-accessible (space toggles) | RTL |
| T07 | Slider ARIA attributes present (role, aria-valuemin/max/now) | RTL |

## 9. Done means
- Toggling uncertainty in `pnpm dev` shows a visible band; sigma slider widens/narrows it; member slider thickens/thins it.
- Band disposes cleanly on toggle-off; `renderer.info.memory.geometries` returns to pre-toggle value.

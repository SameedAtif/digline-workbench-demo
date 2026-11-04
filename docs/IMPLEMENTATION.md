# Final implementation notes

This is the as-built reference for the deployed app. It supersedes the original task documents where the two disagree. The original `docs/PROJECT.md` and `docs/modules/*` files remain as the design specification that drove the build.

- **Live demo:** https://digline-workbench-demo.vercel.app/
- **Stack:** TypeScript 5.7, React 19, Vite 6, Three.js r170, Zustand 5, Tailwind v4, Radix, PapaParse, Zod, Vitest, Playwright.
- **Deployment:** static Vite build on Vercel with an SPA rewrite.

## As-built architecture

```
src/
├── domain/                  # pure TypeScript, no React/Three/DOM
│   ├── block.ts             # columnar BlockModel + smart constructor
│   ├── polygon.ts           # polygon ops + example polygon
│   ├── vector-field.ts      # Uniform/FreeFace/Perturbed strategies
│   ├── apply.ts             # applyField / deformPolygon
│   ├── muckpile.ts          # deterministic post-blast settle pass
│   ├── metrics.ts           # tonnes/grade/dilution/ore-loss
│   ├── calibration.ts       # synthetic monitors, residuals, parameter fit
│   └── ...
├── data/                    # generator + worker CSV importer
├── render/
│   ├── core/                # viewer, camera, controls, loop, resize
│   ├── blocks/              # InstancedMesh + GLSL + colour ramps
│   ├── interaction/         # GPU picker, slice plane, trace line
│   ├── polygon/             # ribbon outline, fill, handles
│   ├── uncertainty/         # ensemble outlines
│   ├── field-arrows.ts      # sampled vector-field arrow overlay
│   └── monitor-layer.ts     # predicted/measured monitor markers + residuals
├── state/                   # Zustand slices, including calibration.slice.ts
├── polygon/                 # drawer, history, keyboard, metrics panel
├── uncertainty/             # ensemble construction + Radix controls
├── ui/                      # Viewport, Toolbar, Stats, Inspector, Calibration, HUD
└── workbench.ts             # store ↔ renderer runtime wiring
```

## Delivered capabilities

- Seeded synthetic bench with selectable size: 11.5k, 100k, 250k, 500k blocks.
- One-draw-call instanced block field with a custom vertex shader.
- Pre/post-blast scrub via `uT`; shader adds a ballistic arc, deterministic tumble and face shading.
- Columnar post-blast positions, then a deterministic muckpile settle pass.
- Preloaded example ore polygon, draw/close/edit/delete, drag-to-place, drag-to-move, undo/redo.
- Deformed polygon and live tonnes, mean grade, dilution and ore loss.
- Grade/material/neutral colour modes, grade cutoff, X slice, GPU picking, trace line, inspector.
- Toggleable surface field arrows sampled from the active 3D field.
- Deterministic uncertainty ensemble with member/sigma controls.
- Synthetic surface monitors: hidden ground truth + seeded noise, predicted vs measured residuals, and calibration of max throw and decay. Calibration sets uncertainty sigma from residual RMS.
- Worker CSV import with fail-closed validation, sample CSV and drag-and-drop.
- Render HUD on `D`.
- 56 unit tests and 6 Playwright smoke/flow tests.

## Intentional deviations from the original plan

| Original plan | Final implementation |
|---|---|
| Polygon/ensemble rendered with `Line2` | Polygon uses a world-space ribbon `Mesh`; ensemble uses one `THREE.Line` per member |
| Polygon deforms in a shared GLSL include | Polygon vertices are deformed CPU-side; blocks deform in the vertex shader |
| Draggable slice gizmo with axis snapping | X-axis-aligned slice controlled by a slider, with a plane helper |
| GPU picking plus `three-mesh-bvh` fallback | GPU id-buffer picking only |
| Below-cutoff blocks fade | Below-cutoff blocks are discarded with `step()` |
| Atomic old/new block-field swap | Old field is disposed before the new field is added |
| Dilution against baseline ore only | Dilution compares against all blocks inside the baseline polygon so `dilution = 0` at `t = 0` |
| Vitest node/jsdom project split | Single jsdom test environment |
| PostCSS Tailwind config | `@tailwindcss/vite` plugin |
| `Line2` trace line | Dashed `THREE.Line` |
| No calibration module in the plan | Added `domain/calibration.ts`, Calibration panel, monitor layer and field arrows |

Additional deliberate additions: preloaded example polygon, drag-to-place/move, muckpile settle, ballistic arc/tumble/shading, monitor points, calibration, field arrows, bench-size selector, sample CSV and full-flow tests.

## Verification

Run locally:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
```

Last verified state:

- `pnpm typecheck` — clean
- `pnpm lint` — clean
- `pnpm format:check` — clean
- `pnpm test` — 56 passing
- `pnpm build` — succeeds
- `pnpm test:e2e` — 6 passing
- GitHub Actions `ci` and `e2e` — passing on `main`

Measured uncapped render performance on an Apple Silicon Mac (headed Chrome, 5-second sample, vsync off): 753 fps @ 100k, 472 fps @ 250k, 349 fps @ 500k.

## Synthetic calibration model

The monitor workflow is intentionally transparent:

- A hidden free-face field (`trueMaxThrow = 18 m`, `trueDecay = 4e-5`) generates measured displacement at seeded surface points.
- Measured values add deterministic Gaussian noise (sigma `0.7 m`).
- “Predicted” values come from the active field.
- Calibration performs a deterministic coarse-to-fine search over max throw and decay, then sets ensemble sigma from the residual RMS.
- The UI shows predicted RMS, max residual, per-monitor predicted/measured/residual values, and the before/after fit.

This is a demonstration of model improvement, not real survey calibration.

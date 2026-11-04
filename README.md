# Dig-Line Workbench

A browser-based 3D workbench for an open-pit bench: load a synthetic block model, draw the ore polygon, scrub a simulated blast, and read tonnes, mean grade, dilution and ore loss where the dig line lands on the muckpile.

**Live demo:** https://digline-workbench-demo.vercel.app/

> This is a portfolio demo. The displacement is a plausible parameterised field, not a rigid-body physics simulation or a prediction. The data is entirely synthetic. Not for operational use.

## What it does

1. A seeded synthetic bench loads automatically and frames itself in an orbitable Three.js view.
2. Blocks are rendered as one `InstancedMesh` draw call, coloured by grade, material or neutral.
3. A demo ore polygon is preloaded so the metrics make sense immediately. Press **Draw polygon** to replace it: click or click-drag corners, close it, drag handles to reshape, drag inside it to move the whole polygon, and undo/redo.
4. Play or scrub the blast from `t = 0` to `t = 1`; blocks arc, tumble, spread laterally and settle into a muckpile while the polygon follows.
5. The stats panel reports tonnes in polygon, mean grade, dilution and ore loss against the pre-blast baseline.
6. Click a block to trace its pre-blast → post-blast path and inspect its grade and material.
7. Toggle an ensemble of perturbed fields to draw a confidence band around the dig line.
8. Toggle field arrows to visualise the active 3D blast field.
9. Use the synthetic monitor points to compare predicted vs measured movement, then **Calibrate field** to fit max throw and decay. Calibration also sets uncertainty sigma from the residual RMS.
10. Switch between 11.5k / 100k / 250k / 500k block benches from the Model panel.
11. Import a CSV block model in a worker; a sample is at [`public/sample-blocks.csv`](public/sample-blocks.csv) (also linked from the toolbar). Bad files are rejected with a row-level summary.
12. Press `D` for a render HUD with FPS, frame time, draw calls, instance count and GPU memory counters.

## Tech stack

- TypeScript 5.7, React 19, Vite 6
- Three.js r170 with raw `InstancedMesh` + custom GLSL shaders
- Zustand slices for scene, blast, polygon, UI, metrics, uncertainty and calibration
- PapaParse + Zod in a module worker for CSV import
- Vitest + fast-check for domain tests, React Testing Library for UI, Playwright for the smoke and flow tests
- Tailwind CSS v4 + Radix primitives

## Measured performance

Measured locally on an Apple Silicon Mac in headed Chrome, using `pnpm measure:fps` (5-second sample per size, vsync disabled to measure GPU headroom):

| Blocks  | Uncapped FPS | p95 frame (ms) |
| ------- | ------------ | -------------- |
| 100,000 | 753          | 3.2            |
| 250,000 | 472          | 5.6            |
| 500,000 | 349          | 10.5           |

With vsync enabled the same run sat at the test display's refresh cap, so there is ample headroom above the 60 fps budget. The block field is one instanced draw call; per-frame CPU work is a handful of uniform writes.

## Run locally

```bash
corepack enable
pnpm install
pnpm dev
```

Open http://localhost:5173.

Quality gates:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test        # 56 unit tests
pnpm build
pnpm test:e2e    # 6 Playwright smoke/flow tests; run `pnpm exec playwright install chromium` once
```

URL parameters can size the bench too, e.g. `/?seed=1&nx=100&ny=10&nz=100`.

## How it is put together

- `src/domain` — pure TypeScript: branded units, seeded PRNG, columnar `BlockModel`, polygon geometry, 3D vector-field strategies, blast application, muckpile settling, dig-line metrics and synthetic monitor/calibration algorithms.
- `src/data` — deterministic bench generator, PapaParse + Zod CSV schema, module worker and main-thread importer facade.
- `src/render` — Three.js viewer, instanced block shader (interpolation, arc, tumble, shading), GPU id-buffer picker, slice plane, trace line, polygon ribbon, uncertainty band, field arrows and monitor layer.
- `src/state` — Zustand slices for scene, blast, polygon, UI, metrics, uncertainty and calibration.
- `src/polygon` — drawing state, drag/handle interaction, command history and metrics panel.
- `src/uncertainty` — seeded ensemble construction and controls.
- `src/ui` — viewport lifecycle, toolbar, stats, inspector, calibration panel and HUD.
- `src/workbench.ts` — the runtime that wires store state to the Three.js scene.

See [`docs/PROJECT.md`](docs/PROJECT.md) for scope and [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) for the final as-built architecture and deviations from the original plan.

## Deployment

The app is a static Vite build deployed to Vercel. `vercel.json` rewrites all routes to `index.html`. Live URL: https://digline-workbench-demo.vercel.app/

## Known limits

- One bench, one ore polygon, one slice plane.
- No persistence beyond the current tab.
- Desktop Chrome/Firefox only.
- Monitor points and calibration are synthetic and deterministic; they are not real measurements.
- Calibration currently fits the free-face model only (`maxThrow` and decay).
- Not a rigid-body physics engine: blocks do not collide with each other.

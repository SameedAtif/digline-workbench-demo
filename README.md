# Dig-Line Workbench

A browser-based 3D workbench for an open-pit bench: load a synthetic block model, draw the ore polygon, scrub a simulated blast, and read tonnes, mean grade, dilution and ore loss where the dig line lands on the muckpile.

**Live demo:** _add the Vercel URL here after deploying._

> This is a portfolio demo. The displacement is a plausible parameterised field, not a physics prediction, and the data is entirely synthetic. Not for operational use.

## What it does

1. A seeded synthetic bench loads automatically and frames itself in an orbitable Three.js view.
2. Blocks are drawn as one instanced draw call, coloured by grade, material or neutral.
3. A demo ore polygon is preloaded so the metrics make sense immediately. Press Draw polygon to replace it: click or click-drag corners, close it, drag handles to reshape, drag inside it to move the whole polygon, and undo/redo.
4. Play or scrub the blast from `t = 0` to `t = 1`; blocks arc, tumble, spread laterally and settle into a muckpile while the polygon follows.
5. The stats panel reports tonnes in polygon, mean grade, dilution and ore loss against the pre-blast baseline.
6. Click a block to trace its pre-blast → post-blast path and inspect its grade.
7. Toggle an ensemble of perturbed fields to see the uncertainty band around the dig line.
8. Toggle field arrows to see the active 3D blast vectors, and use the synthetic monitor points to compare predicted vs measured movement, then calibrate max throw and decay.
9. Import a CSV block model in a worker; a sample is at [`public/sample-blocks.csv`](public/sample-blocks.csv) (also linked from the toolbar). Bad files are rejected with a row-level summary.
10. Press `D` for a render HUD with FPS, draw calls, instance count and GPU memory counters.

## Measured performance

Measured locally on an Apple M-series Mac in Chrome, using `pnpm measure:fps` (600-frame sample per size):

| Blocks  | Mean FPS  | p95 frame (ms) |
| ------- | --------- | -------------- |
| 100,000 | _measure_ | _measure_      |
| 250,000 | _measure_ | _measure_      |
| 500,000 | _measure_ | _measure_      |

The renderer uses `InstancedMesh` plus a custom `ShaderMaterial`, so the block field is **one draw call** and the per-frame CPU cost is one uniform write (`uT`).

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
pnpm test
pnpm build
pnpm test:e2e   # smoke + full-flow tests; needs `pnpm exec playwright install chromium` once
```

The Model panel also has a bench-size selector (11.5k demo, 100k, 250k, 500k). URL parameters work too, e.g. `/?seed=1&nx=100&ny=10&nz=100`.

## How it is put together

- `src/domain` — pure TypeScript: branded units, seeded PRNG, columnar block model, polygon geometry, vector-field strategies, blast application and dig-line metrics.
- `src/data` — deterministic bench generator and a PapaParse + Zod CSV importer running in a module worker.
- `src/render` — Three.js viewer, instanced block shader, GPU id-buffer picker, slice plane, trace line, polygon layer and uncertainty band.
- `src/state` — Zustand slices for scene, blast, polygon, UI, metrics and uncertainty.
- `src/ui`, `src/polygon`, `src/uncertainty` — React chrome, drawing tool, command history and ensemble controls.

See `docs/PROJECT.md` for the full scope and `AGENTS.md` for how the implementation was orchestrated.

## Known limits

- One bench, one ore polygon, one slice plane.
- No persistence beyond the tab.
- Desktop Chrome/Firefox only.

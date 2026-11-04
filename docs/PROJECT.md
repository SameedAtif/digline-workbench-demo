# Dig-Line Workbench — Master Project File

A browser-based 3D workbench for viewing a mine bench's block model, simulating blast-induced displacement, and seeing where a geologist's ore polygon ends up on the muckpile. Built as a portfolio piece for a role whose essential work is a 3D web front end (React, Three.js, TypeScript) over a physics-driven mining AI product.

> This file is the single source of truth for scope, stack, architecture, patterns and conventions. Every module file and task file inherits from it. If a module file disagrees with this file, this file wins.
>
> **Status:** implemented and deployed. **Live demo:** https://digline-workbench-demo.vercel.app/
> See [`docs/IMPLEMENTATION.md`](IMPLEMENTATION.md) for the final as-built architecture, feature inventory and intentional deviations from this plan.

---

## 1. What the project is

A single-page web application that lets a user:

1. Load a synthetic open-pit bench block model (CSV or generated).
2. See it rendered in 3D at interactive frame rates, coloured by grade or material.
3. Draw an ore polygon on the pre-blast bench.
4. Press "simulate blast" and watch each block move along a displacement vector field into a muckpile.
5. See where the ore polygon ends up after the blast, and how tonnes, grade and dilution changed.
6. Inspect uncertainty by toggling an ensemble of perturbed vector fields.

The app has one purpose: show, in a browser, the geologist's dig-line decision after a blast.

## 2. What the project is not

- Not a physics engine. The displacement model is a plausible stand-in, not a prediction. The README states this plainly.
- Not a product. No auth, no multi-tenant storage, no billing, no admin panels.
- Not a backend showcase. A tiny optional service only serves chunked block data. No ORM, no migrations, no queue, no infra-as-code.
- Not a design system. Minimal, legible UI chrome built with Tailwind and headless primitives.
- Not a mobile app. Desktop Chrome and Firefox only, latest two versions.
- Not a port of any Augment, Hexagon or Orica product. No trademarks, no logos, no copied screenshots. Synthetic data only.

## 3. Scope

### In scope
- Instanced rendering of up to 500,000 blocks, selectable from the Model panel, at a documented frame rate.
- Shader-driven interpolation between pre-blast and post-blast positions on a scrub timeline, plus ballistic arc, deterministic tumble and face shading.
- Polygon drawing on a bench plane with click/drag placement, vertex edit, whole-polygon move, undo and redo.
- Deterministic post-blast muckpile settle pass.
- Polygon deformation under the vector field, with before/after tonnage, mean grade, dilution and ore loss.
- Slice plane, grade cutoff slider, click-to-trace block from origin to destination.
- Toggleable vector-field arrows sampled over the bench surface.
- Seeded uncertainty ensemble with confidence bands and member/sigma controls.
- Synthetic monitor points, predicted-vs-measured residuals, and calibration of max throw and decay.
- CSV import for block models, with a worker-based parser and a downloadable sample.
- Deterministic synthetic data generator (seeded).
- Live-deployed demo and a one-page README with performance numbers.

### Out of scope
- Real mine data of any kind.
- Multi-bench pits, open pit shells, haul road geometry.
- Any form of persistence beyond the current browser tab.
- Collaborative editing or presence.
- Export to mining software formats (Datamine, Vulcan, Micromine).
- Accessibility beyond basic keyboard focus and sensible contrast.

### Explicit non-goals that could tempt scope creep
- No "AI" training or ML. The vector field is a parameterised function.
- No cloud deployment pipeline. Static hosting on Vercel or Netlify is enough.
- No authentication. The demo is a public link.
- No analytics or telemetry.

## 4. Tools and technology

Chosen to match the job description. No substitutions from the CV's familiar stack unless the posting named them.

| Layer | Choice | Why it is in this project |
|---|---|---|
| Language | TypeScript 5.x, strict mode | Posting lists TypeScript/JavaScript. |
| UI framework | React 19 | Posting lists React. |
| 3D | Three.js (r170+) via raw API, not react-three-fiber | Posting lists Three.js and "WebGL-based libraries". Using the raw API shows you understand the engine, not just a wrapper. |
| Build tool | Vite 6 | Fast, modern, standard for this stack. |
| State | Zustand with slice pattern | Lightweight, keeps 3D state out of React re-renders. |
| Styling | Tailwind CSS v4 + Radix primitives | Minimal UI chrome, no custom design system. |
| Geometry utilities | earcut | Polygon triangulation for the dig-line fill. |
| CSV parsing | PapaParse in a Web Worker | Non-blocking parse for large files. |
| Testing | Vitest, React Testing Library, Playwright (one smoke test) | Standard, fast. |
| Lint and format | ESLint flat config, Prettier | Standard. |
| Package manager | pnpm | Fast, deterministic. |
| Hosting | Vercel static | Zero infra effort. |
| Agentic engineering | Claude Code with a documented AGENTS.md | Posting lists agent orchestration. |

Deliberately not used: react-three-fiber (wraps the engine the posting named), Next.js (no server rendering need), tRPC, Prisma, Terraform, Docker, Cloud Run, Playwright suites beyond the small smoke/flow set. These would be effort spent off-target.

## 5. Features the user will experience

Ordered by what the user sees first.

1. **Open the app and see a bench.** A seeded synthetic bench loads automatically, with a demo ore polygon already placed so the metrics are immediately meaningful.
2. **Orbit, pan, zoom.** Standard orbit controls, with a reset-view button.
3. **Colour mode toggle.** Grade, material type, or neutral.
4. **Grade cutoff slider.** Hides blocks below the cutoff.
5. **Slice plane.** An X-axis slice controlled by a slider, with a visible plane helper.
6. **Draw an ore polygon.** Click or click-drag points on the bench top to add vertices, close it from the toolbar or by double-clicking. Drag a handle to reshape, drag inside the polygon to move it, Alt-click a handle to delete it, Ctrl-Z to undo.
7. **Simulate blast.** A scrubber from t=0 (pre-blast) to t=1 (post-blast). Play, pause, reset.
8. **See the polygon deform.** The polygon's outline moves with the blocks; the fill updates each frame. Blocks arc, tumble and settle into a deterministic muckpile.
9. **Stats panel.** Live tonnes inside polygon, mean grade, dilution percentage and ore loss percentage, measured against the pre-blast baseline.
10. **Click a block.** A dashed line is drawn from its pre-blast to post-blast position; a side panel shows the block's grade and material.
11. **Field arrows.** Toggle a sampled arrow grid showing the active 3D displacement field.
12. **Toggle uncertainty.** Shows an ensemble of perturbed vector fields as a translucent band around the polygon, with member and sigma controls.
13. **Calibration.** Synthetic monitor points show predicted vs measured displacement; a button fits max throw and decay and sets ensemble sigma from the residual RMS.
14. **Bench-size selector.** Switch between 11.5k, 100k, 250k and 500k blocks.
15. **Import CSV.** Drag a CSV of blocks onto the viewport or use the toolbar. The worker parses, validates and swaps the model in. A sample CSV is included.
16. **Performance HUD.** Toggleable FPS, frame time, draw calls, instance count and memory. Off by default.

## 6. Main modules in the codebase

Modules are implemented in this order. Each module has its own file (`docs/modules/01-...md` to `docs/modules/08-...md`). Each is a bounded unit with explicit inputs and outputs so the next module can be built on top without rework.

1. **`platform`** — project scaffold, tooling, lint, test setup, CI, app shell.
2. **`domain`** — pure TypeScript types and functions for blocks, polygons, vector fields, metrics. No React, no Three.js. Fully unit tested.
3. **`data`** — synthetic generator (seeded) and CSV importer (worker). Produces `BlockModel` instances for `domain`.
4. **`render-core`** — Three.js scene, camera, renderer, orbit controls, resize handling, animation loop. No business logic.
5. **`render-blocks`** — `InstancedMesh` of blocks with a custom shader that interpolates between pre-blast and post-blast positions.
6. **`interaction`** — picking (GPU readback or BVH raycast), slice plane, grade cutoff, click-to-trace.
7. **`polygon`** — polygon drawing tool, vertex edit, undo/redo, deformation under the vector field, metrics computation (tonnes, grade, dilution).
8. **`uncertainty`** — ensemble of perturbed vector fields and the uncertainty band visualisation.
9. **`calibration`** — synthetic monitor points, predicted-vs-measured residuals, deterministic field calibration and field-arrow visualisation. Added after the original plan; see `docs/modules/09-calibration.md`.

Everything above is front end. If time allows, a stretch module `service` adds a tiny Node + Fastify endpoint that streams block chunks. It is strictly optional; the posting says backend is a plus, not required.

## 7. Code structure

```
dig-line-workbench/
├── AGENTS.md
├── README.md
├── docs/
│   ├── PROJECT.md
│   ├── IMPLEMENTATION.md          # as-built reference
│   ├── modules/                   # 01-platform … 09-calibration
│   └── tasks/                     # original implementation prompts
├── public/
│   ├── favicon.svg
│   └── sample-blocks.csv
├── scripts/
│   └── measure-fps.mjs
├── src/
│   ├── main.tsx / App.tsx / workbench.ts
│   ├── types/
│   ├── domain/                    # block, polygon, vector-field, apply, muckpile,
│   │                              # metrics, calibration, prng, units
│   ├── data/                      # generator, schema, protocol, csv-parse,
│   │                              # csv.worker.ts, csv.ts
│   ├── state/                     # store + scene/blast/polygon/ui/metrics/
│   │                              # uncertainty/calibration slices
│   ├── render/
│   │   ├── core/                  # viewer, camera, controls, loop, resize
│   │   ├── blocks/                # instanced-blocks, GLSL, color-ramp
│   │   ├── interaction/           # picker, slice-plane, trace-line
│   │   ├── polygon/               # ribbon/fill/handles layer
│   │   ├── uncertainty/           # ensemble-band
│   │   ├── field-arrows.ts
│   │   └── monitor-layer.ts
│   ├── polygon/                   # drawer, history, keyboard, metrics-panel
│   ├── uncertainty/               # ensemble + toggle controls
│   └── ui/                        # Viewport, Toolbar, StatsPanel, Inspector,
│                                  # CalibrationPanel, HUD
├── tests/
│   ├── unit/                      # domain, data, uncertainty, ui
│   ├── e2e/                       # smoke + flow specs
│   └── fixtures/
├── index.html
├── vite.config.ts / vitest.config.ts / playwright.config.ts
├── tsconfig.json / eslint.config.js / .prettierrc
└── package.json / pnpm-lock.yaml / vercel.json
```

Rules:
- Every folder under `src/` has an `index.ts` barrel that defines its public surface.
- `domain/` imports from nothing but `types/`.
- `render/` imports from `domain/` but never from `ui/` or `state/`.
- `ui/` imports from `state/` and reads derived values; it does not touch Three.js directly except through `Viewport`.
- Tests live beside the folder structure they mirror, not next to source files, so the production bundle stays clean.

## 8. Design patterns

A small, deliberate set. Each one earns its place.

| Pattern | Where it is used | Why |
|---|---|---|
| Hexagonal / ports and adapters | `domain` is the core; `render`, `data` and `ui` are adapters | Keeps the geometry and metrics pure and testable without a browser. |
| Entity–Component style | `render/blocks` keeps instanced data in parallel typed arrays, not objects | Required for 500k blocks. One `Float32Array` per attribute. |
| Flux-style unidirectional data flow | React reads from Zustand, actions mutate store, store notifies renderer | Keeps the 3D scene a function of state. |
| Command pattern | `polygon/history.ts` wraps every polygon edit as a command with `do` and `undo` | Clean undo/redo. |
| Observer (via Zustand `subscribe`) | Renderer subscribes to slices it cares about and skips React re-renders | Avoids re-rendering React trees on every frame. |
| Strategy | `vector-field.ts` exports a `VectorField` interface with `UniformField`, `FreeFaceField`, `PerturbedField` | Lets the uncertainty ensemble swap fields cleanly. |
| Object pool | `trace-line` and polygon handle meshes are pooled | Avoids GC pauses while scrubbing. |
| Factory | `data/generator.ts` and `csv.worker.ts` both return `BlockModel` through one factory | Downstream code treats both sources identically. |

Patterns deliberately not used: dependency injection containers, decorators, RxJS, event buses, repository abstractions, mediator. They would add indirection without buying anything at this size.

## 9. Best practices and references

Each practice is linked to someone who contributed to the specific tool or domain, not a generic blog. The project cites them in the README and in the module files where the practice shows up.

### 9.1 TypeScript
- Strict mode on, `noUncheckedIndexedAccess` on, `exactOptionalPropertyTypes` on.
  - Reference: Daniel Rosenwasser, "Announcing TypeScript 5.0" and the compiler team's option guidance.
- Discriminated unions for anything with variants (`VectorField`, `PolygonTool` state).
  - Reference: Anders Hejlsberg's design talks on structural typing in TypeScript.
- No `any`, no non-null assertions except at engine boundaries.
  - Reference: Basarat Ali Syed, *TypeScript Deep Dive*, section on soundness vs practicality.

### 9.2 React 19
- Server-free, client-only app. Co-locate state with usage; lift only when shared.
  - Reference: Dan Abramov, "Before You memo()" and "A (Mostly) Complete Guide to React Rendering Behavior" (Mark Erikson).
- `useSyncExternalStore` via Zustand for subscribing to the renderer-adjacent store so React does not tear during animation.
  - Reference: Andrew Clark on `useSyncExternalStore` design notes.
- No `useEffect` for derived data; compute in render or in a selector.
  - Reference: "You Might Not Need an Effect", React docs by the React team.

### 9.3 Three.js
- `InstancedMesh` for the block field, with per-instance attributes in `InstancedBufferAttribute` typed arrays.
  - Reference: Ricardo Cabello (mrdoob) and Fernando Serrano on instancing patterns in the Three.js examples repo.
- Custom `ShaderMaterial` for the pre/post interpolation; keep JS off the per-frame path.
  - Reference: Three.js fundamentals by Gregg Tavares, chapter on custom shaders.
- Dispose geometries, materials and textures explicitly when swapping models.
  - Reference: Three.js memory management guidance by Michał Iwańczuk (prisoner849) in the Three.js forum.
- One `requestAnimationFrame` loop, one renderer, resize via `ResizeObserver`.
  - Reference: Paul Lewis and Jake Archibald on `requestAnimationFrame` discipline.

### 9.4 WebGL and GPU
- Interpolate positions in the vertex shader using a `uniform float uT` and two per-instance position attributes.
  - Reference: Patrick Cozzi, *WebGL Insights*, chapter on instanced rendering.
- Avoid branching in shaders; use `mix()` and `step()`.
  - Reference: Inigo Quilez's shader articles (iquilezles.org) on shader performance.
- Use `float16` where precision allows; otherwise `float32`.
  - Reference: Khronos WebGL extension notes maintained by Ken Russell.

### 9.5 State and architecture
- Zustand slice pattern, with selectors memoised at the hook boundary.
  - Reference: Daishi Kato (author of Zustand and Jotai), posts on avoiding over-rendering with external stores.
- Separate the "scene state" (pure data) from "renderer state" (GPU handles). The renderer is a projection of the scene state.
  - Reference: Carmack-era data-oriented design, popularised for the web by Mike Acton's "Data-Oriented Design and C++" talk. Applied here to JS typed arrays.

### 9.6 Testing
- Vitest for unit tests of `domain`, with property-based tests for geometry via `fast-check`.
  - Reference: Nicolas Dubien (author of `fast-check`) on property-based testing in TypeScript.
- A small Playwright suite: one smoke test plus full-flow tests for drawing, scrubbing, uncertainty, picking, CSV import, field arrows, calibration and bench-size switching.
  - Reference: Playwright team's own guidance (Andrey Lushnikov) on using a small, robust end-to-end suite rather than a brittle one.

### 9.7 Performance
- Measure before optimising. `performance.now()` around the hot paths, Chrome DevTools performance panel for frame breakdowns.
  - Reference: Addy Osmani, *Image Optimization* and his writing on measuring real user performance.
- Budget: 500k blocks, 60fps, under 150ms time-to-first-frame on a mid-range laptop. Stated in README; enforced manually, not in CI.
  - Reference: Alex Russell's RAIL and performance-budget posts.

### 9.8 Agentic engineering
- Short, scoped prompts; one module at a time; the human reviews every PR.
  - Reference: Anthropic's Claude Code documentation and Boris Cherny's talks on effective agent workflows.
- `AGENTS.md` records which subagents handled which modules, what was delegated and what was reviewed by hand.
  - Reference: the posting itself, which asks for demonstrated agent orchestration.

## 10. Delivery

- Deployed to Vercel at https://digline-workbench-demo.vercel.app/ and linked from the README.
- README fits on one scroll on a laptop: what, why, live link, numbers, how to run.
- The as-built architecture and deviations are recorded in `docs/IMPLEMENTATION.md`.
- A screen recording is optional and not included in the final repository.

## 11. Risks and how they're handled

| Risk | Mitigation |
|---|---|
| Shader performance is off on a reviewer's machine | HUD can be turned on; README states tested hardware. |
| CSV import crashes on a bad file | Zod schema in the worker; invalid rows summarised, not thrown. |
| Scope creep into "real physics" | This file's non-goals section is the stop sign. |
| Over-engineering backend | No backend by default; stretch endpoint is one file. |
| Visuals look amateur | A short style pass at the end: dark theme, one accent colour, Inter font, Radix primitives. No custom components. |

## 12. Done means

- 500k blocks render above the 60 fps budget on the stated hardware (measured uncapped: 349 fps).
- A user can draw, move and edit a polygon, scrub a blast, and read tonnes/grade/dilution/ore-loss before and after.
- The uncertainty toggle produces a visibly different band.
- Field arrows render the active 3D field.
- The calibration panel shows monitor residuals and reduces RMS after fitting max throw and decay.
- The CSV importer accepts a valid file and refuses a bad one with a clear message.
- The live link works and shows all of the above without a reload.
- README has the link, the numbers, and the AGENTS.md pointer.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` and `pnpm test:e2e` pass.

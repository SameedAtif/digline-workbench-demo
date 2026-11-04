# Module 07 — `polygon`

The feature a geologist is actually hired to do: draw an ore polygon, see where it ends up after the blast, read the tonnes and dilution. This is the module that justifies the whole app.

> Inherits from `PROJECT.md`.

---

## 1. What this module is

Three cooperating parts:

- **Drawer** — a state machine for drawing a polygon on the bench's top plane: `idle → placing → closed → editing`.
- **History** — command-pattern undo/redo over polygon edits.
- **Render + metrics** — a Three.js `Line2` outline and a `Mesh` fill (triangulated with `earcut`), both deformed under the active `VectorField` as `uT` changes; a React `StatsPanel` reads live tonnes, mean grade, dilution and ore loss from the store.

## 2. What this module is not

- Not multi-polygon. One ore polygon at a time. Multi-polygon is a stretch; out of scope.
- Not a GIS tool. No reprojection, no CRS, no coordinate systems beyond the bench's local frame.
- Not an editor for the vector field. The user edits polygons; they tweak the field via existing sliders only.

## 3. Scope

### In scope
- Pointer tooling on the bench top plane: click to add vertex, double-click to close, drag a vertex to edit, Alt-click a vertex to delete.
- Keyboard: `Ctrl/Cmd + Z` undo, `Shift + Ctrl/Cmd + Z` redo, `Esc` cancel current draw.
- Polygon rendered as `Line2` with constant screen-space width (so it reads at any zoom), and a translucent fill.
- Shader-side deformation of the polygon in sync with the blocks: both read from the same `uT` and the same vector-field uniforms, so they never drift.
- Live metrics panel: tonnes inside polygon (now), mean grade, dilution %, ore-loss %, all relative to the t=0 ore classification.

### Out of scope
- Snapping to blocks.
- Measuring tools inside the polygon.
- Polygon-to-polygon boolean ops.

## 4. Tools and technology

| Thing | Choice |
|---|---|
| Line rendering | `three/examples/jsm/lines/Line2` for proper width |
| Triangulation | `earcut` for the fill |
| State | Zustand slice `polygon.slice.ts` |
| UI | React + Radix number inputs for showing stats |
| Hit test | Ray on the bench's top plane; vertex handles via BVH on a small `InstancedMesh` |

## 5. Features the rest of the app will consume

```ts
import { usePolygonStore } from '@/state';
import { createPolygonLayer, PolygonLayer } from '@/render/polygon';
import { MetricsPanel } from '@/polygon/metrics-panel';
```

## 6. Code structure

```
src/polygon/
├── store.ts            # Zustand slice: vertices, mode, history
├── drawer.ts           # state machine; wires pointer events to store actions
├── history.ts          # command stack (AddVertex, MoveVertex, DeleteVertex, Close)
└── metrics-panel.tsx   # React, reads selectors

src/render/polygon/
├── polygon-mesh.ts     # Line2 + triangulated Mesh; vertex shader deforms via field
├── polygon-handles.ts  # draggable vertex handles (small InstancedMesh)
└── polygon.vert.glsl   # shared with block.vert.glsl's displacement function via GLSL include
```

## 7. Design patterns

- **Finite state machine** — the drawer is `idle | placing | closed | editingVertex(i)`. Pointer events only matter per state.
- **Command pattern** — every edit is a command with `do()`/`undo()`. History is a stack of commands plus a redo stack.
- **Observer** — the renderer subscribes to the polygon slice; React subscribes to selectors; neither re-renders the other.
- **Single source of truth** — polygon vertices live in the store, not in the mesh. The mesh is a projection of the store.

## 8. Best practices and references

- **State machines over booleans for tool state** — David Khourshid's XState writing (we don't bring XState; we hand-roll the machine, but the discipline is his).
- **`Line2` for consistent screen-space width** — WestLangley on the Three.js forum.
- **`earcut` triangulation** — Vladimir Agafonkin's `earcut` paper, which it why Mapbox GL uses it.
- **Command pattern for undo/redo** — the GoF book, chapter on behavioural patterns; still the clearest treatment.
- **Keep React off the per-frame path** — Daishi Kato's Zustand selectors + `useSyncExternalStore` guidance.

## 9. Done means

- Drawing a 20-vertex polygon, closing it, and scrubbing `uT` from 0 to 1 shows the polygon smoothly deform in sync with the blocks.
- Tonnes/grade/dilution numbers update at the UI's natural 60 Hz without re-rendering the viewport.
- `Ctrl+Z` reverses the last five edits in order; `Shift+Ctrl+Z` redoes them.
- Switching the vector field (uniform → free-face) does not require redrawing the polygon.

## 10. Tasks (ordered)

1. `docs/tasks/07-polygon/01-store-and-machine.md` — store slice, state machine, pointer wiring.
2. `docs/tasks/07-polygon/02-render.md` — `Line2` outline, `earcut` fill, shared displacement shader.
3. `docs/tasks/07-polygon/03-history.md` — command classes, undo/redo stack, keyboard shortcuts.
4. `docs/tasks/07-polygon/04-metrics-panel.md` — stats computation on main thread, panel UI, selectors.

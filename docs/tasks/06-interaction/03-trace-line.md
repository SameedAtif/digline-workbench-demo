# Task 06.03 — Trace line + inspector panel

On block click, draw a dashed line from the block's pre-blast to post-blast centroid, scrubbing with `uT`. Show the block's grade and material in a side panel.

> Inherits from `docs/modules/06-interaction.md`.

---

## 1. What this task is
Hook `Picker.pick()` into the store (`ui.setSelectedBlock(index | null)`), render a pooled `Line2` segment driven by `uT`, and bind a small React side panel.

## 2. What this task is not
Not multi-block comparisons.

## 3. Scope

### In
- Store action `ui.setSelectedBlock(i | null)`.
- `createTraceLine({ viewer, blockField, model }) → TraceLine`:
  - A single `Line2` pooled across selections.
  - On selection change, read `(x0, y0, z0)` and `(x1, y1, z1)` from the model's buffers and the current post-blast buffer, then write to the line's geometry.
  - Vertex shader samples the same `uT` as the block shader so the "live" end of the trace follows the moving block.
- `ui/InspectorPanel.tsx`:
  - Shows selected block index, grade, material, pre/post centroid.
  - Hidden when no block is selected.

### Out
- Click-to-select on polygon handles (that is module 07).

## 4. Tools and technology
`Line2` from `three/examples/jsm/lines/Line2`, pooled.

## 5. Code structure delta
```
+ src/render/interaction/trace-line.ts
+ src/ui/InspectorPanel.tsx
+ src/state/slices/ui.slice.ts   (updated)
+ tests/unit/render/interaction/trace-line.test.ts
+ tests/unit/ui/InspectorPanel.test.tsx
```

## 6. Design patterns
- **Object pool** — one `Line2`, reused.
- **Observer** — the line subscribes to `ui.selectedBlock` via the store, not React.

## 7. Best practices and references
- `Line2` width behaviour — WestLangley's forum answers.
- Avoiding React in the per-frame path — Daishi Kato on Zustand external stores.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | Selecting block `i` sets the line's endpoints to `(x0_i, y0_i, z0_i)` and `(x1_i, y1_i, z1_i)` | Vitest |
| T02 | Selecting `null` hides the line (visible = false) | Vitest |
| T03 | Reselecting a different block reuses the same `Line2` object (identity check) | Vitest |
| T04 | Scrubbing `uT` moves the "live" endpoint along the interpolation (readback) | Vitest |
| T05 | `InspectorPanel` shows block info when a block is selected, nothing when `null` | RTL |
| T06 | `InspectorPanel` does not re-render when `uT` changes (it reads static data) | RTL + render counter |

## 9. Done means
- Clicking any block in `pnpm dev` draws a dashed line + opens the inspector.
- Scrubbing the blast moves the line's muckpile end live.

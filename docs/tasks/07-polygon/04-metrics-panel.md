# Task 07.04 — Metrics panel

Live tonnes / mean grade / dilution / ore-loss, bound to the polygon and the scrub, surfaced in a React panel on the right strip.

> Inherits from `docs/modules/07-polygon.md`.

---

## 1. What this task is
A derived selector that calls `baselineOre` once per polygon change and `polygonTonnes`/`polygonMeanGrade`/`dilution`/`oreLoss` on each `uT` tick, plus the React panel that displays them.

## 2. What this task is not
Not a new metric. Not a chart. Not an export.

## 3. Scope

### In
- Memoised `baseline` selector in the store: recomputed only when `polygon.vertices`, `polygon.planeY`, `cutoff`, or `model` identity changes.
- Live-metrics subscription in `Viewport`:
  - Hooked to the viewer's `onFrame`.
  - Reads the current `uT`.
  - Calls the four domain functions.
  - Writes results into a lightweight `metrics.slice.ts` throttled to 15 Hz (not every frame, to avoid React re-render thrash — numbers do not need 60fps precision).
- `MetricsPanel.tsx`:
  - Four big numbers with labels.
  - Trend arrow (↑ ↓) against the previous reading.
  - Hidden when the polygon is not closed.

### Out
- Time-series charting of metrics.
- CSV export of metrics.

## 4. Tools and technology
Zustand selectors, `requestAnimationFrame`-driven throttle, Radix number primitive for display.

## 5. Code structure delta
```
+ src/state/slices/metrics.slice.ts
+ src/polygon/metrics-panel.tsx
+ src/ui/StatsPanel.tsx                (hosts MetricsPanel)
+ tests/unit/state/metrics.slice.test.ts
+ tests/unit/polygon/metrics-panel.test.tsx
```

## 6. Design patterns
- **Memoised selector** — baseline is heavy; recompute it only when its inputs change.
- **Decoupled frequency** — render runs at 60 Hz; metrics display at 15 Hz; both read the same `uT`.
- **Observer** — the metrics writer is a `viewer.onFrame` subscriber, not a React effect.

## 7. Best practices and references
- Decoupled render and UI rates — Carmack-era double-buffer thinking; Jake Archibald on "animations should be as cheap as possible per frame".
- Zustand selector equality — Daishi Kato's docs on `shallow` and `useShallow`.
- Avoiding `useEffect` for derived data — React docs ("You Might Not Need an Effect").

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | Baseline is computed exactly once when polygon closes | Vitest, spy count |
| T02 | Baseline is not recomputed when only `uT` changes | Vitest |
| T03 | Baseline is recomputed when `cutoff` changes | Vitest |
| T04 | Metrics slice updates at ~15 Hz under a 60fps feed (±2 Hz) | Vitest with fake timers |
| T05 | Panel displays four numbers once polygon is closed | RTL |
| T06 | Panel is hidden before polygon close | RTL |
| T07 | Trend arrow is `↑` when the current reading exceeds the previous by ≥ 1% | RTL |
| T08 | Panel does not re-render on every frame (counter asserts ≤ 20 renders in 1s) | RTL + render counter |

## 9. Done means
- Drawing a polygon in `pnpm dev` and scrubbing shows the four numbers updating smoothly.
- `baseline` function spy confirms single evaluation per polygon.

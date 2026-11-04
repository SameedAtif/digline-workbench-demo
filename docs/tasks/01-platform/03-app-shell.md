# Task 01.03 — App shell and CI

Minimal visible layout, Tailwind baseline, Zustand root store with empty slices, GitHub Actions pipeline.

> Inherits from `docs/modules/01-platform.md`.

---

## 1. What this task is
Give the app a shape so later modules have a clear place to plug in: a left toolbar strip, a central viewport, a right stats strip. All empty. Plus CI.

## 2. What this task is not
Any 3D content. Any domain logic. Any real UI components beyond the shell.

## 3. Scope

### In
- Tailwind v4 configured via Vite's PostCSS plugin and `src/styles.css`.
- `src/App.tsx`: three-column CSS grid, `Toolbar`, `Viewport`, `StatsPanel`.
- `src/ui/Viewport.tsx`: a sized `<div ref>` placeholder, no canvas yet.
- `src/state/store.ts`: Zustand root with empty slices (`scene`, `blast`, `polygon`, `ui`).
- `.github/workflows/ci.yml`: `pnpm install` (frozen), `typecheck`, `lint`, `test`, in that order.
- Dependabot config file for pnpm (weekly).
- `README.md` placeholder with: project name, one-line pitch, live link slot, "run locally" section.

### Out
- Any styling beyond spacing and a dark palette.
- Any state logic (slices are typed shells only).
- Deployment config.

## 4. Tools and technology
Tailwind v4, Radix primitives (dependency added, not yet used), Zustand 5, GitHub Actions.

## 5. Features (user-facing)
- Opening the app shows a three-pane layout: narrow left bar, big empty centre, narrow right bar — all dark grey.
- Resizing the window keeps the proportions.

## 6. Code structure delta
```
+ src/App.tsx                     (updated)
+ src/ui/Viewport.tsx
+ src/ui/Toolbar.tsx
+ src/ui/StatsPanel.tsx
+ src/ui/index.ts
+ src/state/store.ts
+ src/state/slices/scene.slice.ts
+ src/state/slices/blast.slice.ts
+ src/state/slices/polygon.slice.ts
+ src/state/slices/ui.slice.ts
+ src/styles.css
+ postcss.config.js
+ tailwind.config.ts
+ .github/workflows/ci.yml
+ .github/dependabot.yml
+ README.md
```

## 7. Design patterns
- **Slice pattern (Zustand)** — each slice is a factory `(set, get) => ({...})`; combined in `store.ts`.
- **Layout as a function of state** — toolbar/stats visibility toggled from `ui.slice`; useful later for a "focus mode".

## 8. Best practices and references
- Zustand slice pattern — Daishi Kato's docs.
- Tailwind v4 PostCSS pipeline — Adam Wathan's release notes.
- `pnpm install --frozen-lockfile` in CI — pnpm docs on reproducible installs.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `<App/>` renders three regions with `data-testid` of `toolbar`, `viewport`, `stats-panel` | RTL |
| T02 | Hiding the stats panel via a `ui.setStatsVisible(false)` call removes it from the DOM | RTL + Zustand store, no React re-render leak |
| T03 | Resizing the window to 800×600 does not horizontally scroll | jsdom cannot test real layout; a manual check documented in CI output |
| T04 | GitHub Actions workflow has three dependent jobs, all required for merge | Verified by reading the YAML + branch protection in README |
| T05 | A failing test in any Vitest project fails CI | Manual probe once, then revert |

## 10. Done means
- CI badge green on `main`.
- The shell loads in under 1s cold on a mid-range laptop.
- `pnpm build` emits a bundle under 100 KB gzipped for this task's scope.

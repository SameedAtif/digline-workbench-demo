# Module 01 — `platform`

> **As-built:** this module is implemented. See `docs/IMPLEMENTATION.md` for final architecture and deviations from this plan.

The scaffold the whole app sits on: Vite, TypeScript, React, lint, format, test runner, path aliases, and an empty app shell that boots to a dark viewport. Nothing more.

> Inherits from `PROJECT.md`. If this file disagrees with the master, the master wins.

---

## 1. What this module is

A production-quality TypeScript + React 19 project that:

- Boots in under a second with Vite 6.
- Renders an `App` component into a single `<canvas>`-ready layout.
- Has strict TypeScript, ESLint flat config, Prettier, and Vitest wired and green.
- Exposes path aliases (`@/domain`, `@/render`, …) that match the folder plan in the master file.
- Compiles cleanly in CI via GitHub Actions (type-check, lint, test).

## 2. What this module is not

- Not any 3D code. No Three.js import anywhere yet.
- Not any domain code. No block, polygon or vector-field types.
- Not any styling beyond a dark `html, body` baseline and Tailwind preflight.
- Not Terraform, Docker, Cloud Run, Vercel config beyond the default `vercel.json` for SPA routing.
- Not a design system. No components beyond the shell.

## 3. Scope

### In scope
- `package.json` with pinned major versions.
- `tsconfig.json` with strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.
- `vite.config.ts` with React plugin, GLSL plugin for later shader imports, path aliases.
- `eslint.config.js` (flat) with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`.
- `.prettierrc` with 2-space indent, no semi-less, single quotes.
- `vitest.config.ts` with a jsdom environment and a single test run.
- `index.html` with `<div id="root">` and dark background.
- `src/main.tsx`, `src/App.tsx`, `src/ui/Viewport.tsx` as a stub.
- `.github/workflows/ci.yml` running `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test --run`.
- `README.md` placeholder with the live-link slot.

### Out of scope
- Any `src/domain`, `src/data`, `src/render` content beyond empty barrels.
- Playwright config. That lands with module `uncertainty` when the app is worth smoke-testing.
- GitHub Actions caching beyond pnpm's default.

## 4. Tools and technology

| Layer | Choice | Notes |
|---|---|---|
| Node | 20 LTS (22-compatible) | Pinned via `.nvmrc` and `engines`. |
| Package manager | pnpm 9 | `packageManager` field in `package.json`. |
| Bundler | Vite 6 + `@vitejs/plugin-react` | `vite-plugin-glsl` added here, used from module 05. |
| TypeScript | 5.6+ | Strict + extra flags per master file. |
| Lint | ESLint 9 flat config | `@typescript-eslint`, React, React Hooks, import. |
| Format | Prettier 3 | Shared config, pre-commit optional. |
| Test runner | Vitest 2 | One jsdom environment; domain tests remain browser-free. |
| CSS | Tailwind v4, PostCSS | Dark baseline only in this module. |
| CI | GitHub Actions | One workflow file, three jobs: typecheck, lint, test. |

## 5. Features the user will experience (as a developer)

1. `pnpm install && pnpm dev` boots the app on `http://localhost:5173` with a dark background.
2. `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass on a fresh clone.
3. Importing from `@/domain` resolves without a relative path.
4. Pushing to `main` runs CI and goes green.

## 6. Public surface (what the rest of the app can import)

```ts
// @/ui
export { Viewport } from './Viewport';

// nothing else is public yet
```

## 7. Code structure

```
src/
├── main.tsx
├── App.tsx
├── ui/
│   ├── Viewport.tsx     # empty <div ref={…}> placeholder
│   └── index.ts
├── domain/              # empty barrel
│   └── index.ts
├── data/                # empty barrel
│   └── index.ts
├── render/              # empty barrel
│   └── index.ts
├── state/               # empty barrel
│   └── index.ts
├── types/
│   └── index.ts         # branded primitives: Metres, Tonnes, etc.
└── styles.css           # Tailwind preflight only
```

## 8. Design patterns

- **Barrel exports** per folder. Keeps the public surface explicit.
- **Branded primitive types** (`type Metres = number & { readonly __brand: 'Metres' }`). Cheap, no runtime cost, catches unit mistakes forever after.

## 9. Best practices and references

- **Flat ESLint config**, matching the ESLint 9 default from Nicholas C. Zakas's migration guide.
- **Vite project layout** per Evan You's "Vite 6 Release Notes".
- **TypeScript strict flags**: Daniel Rosenwasser's option guide; Matt Pocock's advocacy for `noUncheckedIndexedAccess`.
- **Branded types**: pattern from the TypeScript handbook, popularised by Michał Mikołajczyk ("branded types in TypeScript").
- **Vitest project split** (node vs jsdom): Anthony Fu's own recipe in the Vitest docs.
- **Pin major versions, allow minor**: Jess Frazelle's guidance on reproducible installs.

## 10. Done means

- Fresh clone + `pnpm install && pnpm dev` shows a full-viewport dark page in under 1s on an M-series Mac.
- All three CI jobs green on `main`.
- `grep -R "any" src` returns zero matches except in `types/index.ts` branding helpers (ignored by lint rule exception).
- `tsc --noEmit` exits 0 with no files containing business logic yet.

## 11. Tasks (ordered)

1. `docs/tasks/01-platform/01-scaffold.md` — bootstrap Vite, TypeScript, React.
2. `docs/tasks/01-platform/02-tooling.md` — ESLint, Prettier, Vitest, path aliases.
3. `docs/tasks/01-platform/03-app-shell.md` — `App`, `Viewport` stub, Tailwind baseline, CI.

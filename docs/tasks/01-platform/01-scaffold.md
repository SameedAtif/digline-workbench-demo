# Task 01.01 — Scaffold the project

The first commit. Bring up a Vite + React + TypeScript project that runs `pnpm dev` and shows a blank page. Nothing else.

> Inherits from `docs/modules/01-platform.md` and `PROJECT.md`.

---

## 1. What this task is
Creating the folder, the `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx` and `src/App.tsx`, with pinned versions.

## 2. What this task is not
Not ESLint, Prettier, Vitest, Tailwind, or CI. Those are the next two tasks.

## 3. Scope

### In
- `package.json` with `name`, `type: module`, `packageManager: pnpm@9.x`, `engines: { node: '>=22' }`.
- `tsconfig.json` extending `@tsconfig/strictest` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- `vite.config.ts` with `@vitejs/plugin-react` and the path aliases.
- `index.html` with a dark `<body>` and `<div id="root">`.
- `src/main.tsx` with `createRoot`.
- `src/App.tsx` rendering a single heading.

### Out
- CSS beyond a plain `<body>` background.
- Any custom component.

## 4. Tools and technology
Vite 6, React 19, TypeScript 5.6, pnpm 9, Node 22.

## 5. Features (dev-facing)
- `pnpm install && pnpm dev` opens on port 5173 with "Dig-Line Workbench" text on a dark background.
- Editing `App.tsx` hot-reloads in under 200ms.

## 6. Code structure delta
```
+ package.json
+ pnpm-lock.yaml
+ tsconfig.json
+ vite.config.ts
+ index.html
+ src/main.tsx
+ src/App.tsx
+ .nvmrc
+ .gitignore
```

## 7. Design patterns
None at this size. Single React tree, single Vite config.

## 8. Best practices and references
- `@tsconfig/strictest` — Matt Pocock's recommended base.
- Vite path aliases via `resolve.alias`, matching the TS `paths` — Evan You's docs.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `pnpm install` succeeds on a clean machine | CI step on a fresh runner |
| T02 | `pnpm dev` boots and serves on 5173 | Playwright-free check: curl 127.0.0.1:5173 returns 200 in a `vite --port 5173 &` child process script |
| T03 | `tsc --noEmit` exits 0 | CI step |
| T04 | Importing `@/types` from `src/App.tsx` resolves | Add a dummy export and import; `tsc --noEmit` is the assertion |
| T05 | HMR updates `<App>` text in under 300ms | Manual, documented in `AGENTS.md` for the agent run; not in CI |

## 10. Done means
- Repo on `main` with the files above, zero warnings on `pnpm dev` and `pnpm build`.
- A screenshot of the blank dark page committed in `docs/screenshots/01-scaffold.png`.

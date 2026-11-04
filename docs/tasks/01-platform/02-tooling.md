# Task 01.02 — Tooling

ESLint, Prettier, Vitest with two projects (node + jsdom), path aliases working across all three. Zero warnings on a fresh clone.

> Inherits from `docs/modules/01-platform.md`.

---

## 1. What this task is
Wiring up every tool that runs over the code: lint, format, test, type-check scripts.

## 2. What this task is not
Not writing actual tests of business logic. One trivial smoke test per Vitest project only.

## 3. Scope

### In
- `eslint.config.js` (flat) with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`.
- `.prettierrc` (2 spaces, single quotes, trailing commas, 100-col).
- `vitest.config.ts` using Vitest "projects" — one `node` env for `src/domain/**`, one `jsdom` env for everything else.
- `package.json` scripts: `dev`, `build`, `typecheck`, `lint`, `format`, `test`, `test:watch`.
- `.editorconfig` and `.vscode/settings.json` (format on save, ESLint flat enabled).

### Out
- Pre-commit hooks (husky / lint-staged). Not worth the overhead for a solo project.
- Coverage reporting beyond `--coverage` on demand.

## 4. Tools and technology
ESLint 9 flat, Prettier 3, Vitest 2, `jsdom` 25, `@testing-library/react` 16.

## 5. Features (dev-facing)
- `pnpm lint` reports zero issues.
- `pnpm format` is idempotent on a fresh checkout.
- `pnpm test` runs two projects: `domain` (node) and `app` (jsdom). Both pass with their one smoke test each.
- `pnpm typecheck` is strict and clean.

## 6. Code structure delta
```
+ eslint.config.js
+ .prettierrc
+ .editorconfig
+ vitest.config.ts
+ vitest.setup.ts            # jsdom-only setup
+ src/domain/_smoke.test.ts  # trivial
+ src/_smoke.test.tsx        # trivial render test
+ .vscode/settings.json
```

## 7. Design patterns
- **Project-split testing** — isolates browser-free domain tests so they run in Node without jsdom overhead.

## 8. Best practices and references
- ESLint 9 flat config — Nicholas C. Zakas's migration guide.
- Vitest projects — Anthony Fu's docs on multi-environment configs.
- `@typescript-eslint` strict + stylistic — Josh Goldberg's maintainer notes.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `pnpm lint` exits 0 on a fresh clone | CI |
| T02 | `pnpm format --check` exits 0 | CI |
| T03 | `pnpm typecheck` exits 0 with `noUncheckedIndexedAccess` on | CI |
| T04 | `src/domain/_smoke.test.ts` runs under node, not jsdom (asserts `typeof window === 'undefined'`) | Vitest |
| T05 | `src/_smoke.test.tsx` renders `<App/>` and finds the heading | Vitest + RTL |
| T06 | Introducing a rule violation (an unused var) fails CI | Manual, verified once |
| T07 | Importing from `@/domain` works in both test environments | Add a cross-import in the smoke tests |

## 10. Done means
- All scripts green; `AGENTS.md` records which steps the agent did unassisted.
- `eslint.config.js` has an explanatory comment per block of rules so a reviewer can read it top-to-bottom.

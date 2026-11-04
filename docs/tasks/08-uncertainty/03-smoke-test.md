# Task 08.03 — Playwright smoke, performance numbers, polish

The last task. One E2E smoke test proves the full flow boots. Measure and record FPS on three model sizes. Deploy. Polish the README.

> Inherits from `docs/modules/08-uncertainty.md`.

---

## 1. What this task is
End-to-end smoke, measured numbers, deployment, polished README. The project becomes shareable to a CTO.

## 2. What this task is not
Not a brittle E2E suite; one smoke test only.

## 3. Scope

### In
- `tests/e2e/smoke.spec.ts` (Playwright):
  - Boots the dev server (`vite preview`), loads `/`.
  - Asserts a `<canvas>` is present with non-zero pixel data.
  - Draws a 4-vertex polygon via scripted pointer events.
  - Scrubs the blast to `t = 1`.
  - Toggles the uncertainty switch.
  - Reads a known-coordinate pixel and asserts it changed between `t=0` and `t=1`.
- Playwright config: single project, headless Chromium only, 20s timeout.
- A `scripts/measure-fps.ts` that boots a headless Chromium page, loads the app with `?seed=1&nx=50&ny=50&nz=1` through `?seed=1&nx=80&ny=80&nz=8`, measures 10s of `requestAnimationFrame` deltas, prints a markdown row.
- `README.md` final:
  - One-paragraph pitch (geologist draws polygon → sees deformed dig line).
  - Live link.
  - Measured FPS table for 100k / 250k / 500k on the tested hardware (and the hardware specified).
  - "Not real physics" note.
  - Three screenshots.
  - A link to the 90s screen recording.
  - "How I built it with agents" — a two-paragraph pointer to `AGENTS.md`.
- `AGENTS.md`:
  - Which subagents handled which modules.
  - What was delegated vs reviewed by hand.
  - Example prompts.
  - A commit-history snapshot.
- Deploy to Vercel; stable URL in `README.md`.

### Out
- CI performance gates. Numbers are reported, not enforced.
- Lighthouse. Not relevant to a canvas app.

## 4. Tools and technology
Playwright 1.49, headless Chromium, Vercel static deploy, `vite preview`.

## 5. Code structure delta
```
+ playwright.config.ts
+ tests/e2e/smoke.spec.ts
+ scripts/measure-fps.ts
+ .github/workflows/e2e.yml          # separate job: pnpm build, pnpm preview &, playwright test
+ README.md                          (final)
+ AGENTS.md                          (final)
+ docs/screenshots/
+ vercel.json
```

## 6. Design patterns
- **Smoke over suite** — one test that proves the whole pipeline.
- **Measurement over prediction** — numbers in the README are measured and dated.

## 7. Best practices and references
- Playwright "one smoke" philosophy — Andrey Lushnikov's talks.
- RAIL and performance budgets — Alex Russell.
- README-as-pitch — Tom Preston-Werner's "README-driven development".

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | Smoke: canvas present with non-zero pixels within 2s of load | Playwright |
| T02 | Smoke: scripted polygon drawing closes successfully (reads a store devtool exposed only in test build) | Playwright + a tiny `window.__test__` hook |
| T03 | Smoke: scrubbing `uT` changes the sampled centre-pixel colour | Playwright |
| T04 | Smoke: uncertainty toggle shows at least one additional outline (change in a sampled off-polygon pixel) | Playwright |
| T05 | `scripts/measure-fps.ts` prints a 3-row markdown table and exits 0 on tested hardware | Manual verification; output committed under `docs/measurements.md` |
| T06 | Live link resolves and loads the deployed build; a cold load shows the canvas within 2s | Manual, dated |
| T07 | README fits on one scroll on a 1440×900 display with default font | Manual |
| T08 | `AGENTS.md` names ≥ 1 example prompt per module | Manual review |

## 9. Done means
- `pnpm test:e2e` green locally and in CI.
- Live link reachable; recording linked.
- FPS table committed with the testing hardware named.
- A reviewer who opens the live link, scrubs once, draws a polygon, and reads the README should understand what the project is in under two minutes.

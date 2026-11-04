# Agent notes

Live demo: https://digline-workbench-demo.vercel.app/

This project was built from the specifications in `docs/` with a small number of scoped agent runs. The human reviewed every module boundary and ran the quality gates locally.

## Delegation map

| Module           | Delegated work                                                                                      | Reviewed by hand                                |
| ---------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 01 platform      | Vite/React/TS scaffold, ESLint flat config, Vitest setup, Tailwind pipeline, state shell            | package versions, CI YAML, path aliases         |
| 02 domain        | branded units, seeded PRNG, `BlockModel`, polygon geometry, vector fields, metrics + property tests | metric definitions, dilution/ore-loss semantics |
| 03 data          | seeded bench generator, Zod CSV schema, worker protocol, main-thread facade                         | fail-closed behaviour and transfer handoff      |
| 04 render-core   | viewer facade, camera framing, orbit controls, resize observer, dispose chain                       | dispose order and DPR cap                       |
| 05 render-blocks | instanced attributes, vertex/fragment shaders, ramp textures, picking shader                        | shader interpolation and cutoff semantics       |
| 06 interaction   | GPU picker, slice plane, trace line, inspector                                                      | picking coordinate mapping                      |
| 07 polygon       | state machine, command history, drawer, render layer, metrics panel                                 | undo batching per drag                          |
| 08 uncertainty   | deterministic ensemble, band render, Radix controls, smoke test                                     | per-member noise stability                      |

## Example prompts

- _"Implement module 02 exactly as written in `docs/modules/02-domain.md` and its three task files. Add the listed tests. Stop before module 03."_
- _"Implement the CSV worker task, including the pure `parseCsvText` seam, transferable handoff and the fail-closed summary."_
- _"Build the block field with one `InstancedMesh` and a `ShaderMaterial`. Positions interpolate in the vertex shader from `aPos0`/`aPos1` via `uT`; no per-frame CPU writes."_
- _"Implement the polygon drawer state machine, then the command-pattern history, keeping one `MoveVertex` command per drag."_
- _"Add the uncertainty ensemble from `PerturbedField`, make it reproducible from a seed, and render one outline per member."_

## Verification

Every module was verified with `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build`. The final flow was exercised in headless Chrome with `pnpm test:e2e`: load, draw a four-point polygon, close it, undo/redo, play the blast to `t = 1`, toggle the ensemble, pick a block, import the sample CSV, exercise the slice/colour controls, toggle field arrows, calibrate against synthetic monitors and switch to a 100k-block bench.

# Module 09 — `calibration`

> **As-built:** this module is implemented. See `docs/IMPLEMENTATION.md` for final architecture and deviations from this plan.

Added after the original eight modules. It turns the demo from a pure forward model into a small,
honest closed loop: synthetic measurements expose model error, and calibration reduces it.

> As built. See `docs/IMPLEMENTATION.md` for the authoritative final architecture.

## What this module is

- Synthetic surface displacement monitors generated from a hidden ground-truth free-face field plus seeded Gaussian noise.
- Predicted vs measured residuals for the active field.
- A deterministic coarse-to-fine fit of `maxThrow` and throw decay.
- A calibration panel that shows RMS before/after, per-monitor residuals and the fitted values.
- Coupling to uncertainty: after calibration, ensemble sigma is derived from the residual RMS (the manual sigma slider remains available).
- 3D monitor markers and residual lines through `src/render/monitor-layer.ts`.
- A toggleable sampled vector-field arrow overlay through `src/render/field-arrows.ts`.

## What this module is not

- Real survey data or survey adjustment.
- A statistical calibration with covariance, identifiability analysis or confidence intervals.
- A fit of every field parameter: only `maxThrow` and `decay` are fitted.
- A physics engine.

## Public surface

```ts
import {
  DEFAULT_MONITOR_PARAMS,
  generateMonitors,
  evaluateMonitors,
  calibrateField,
  type MonitorPoint,
  type MonitorResidual,
  type MonitorEvaluation,
  type CalibrationFit,
} from '@/domain'
```

## Code structure

```
src/domain/calibration.ts          # monitors, residuals, parameter fit
src/ui/CalibrationPanel.tsx        # RMS, table, calibrate/resample controls
src/render/monitor-layer.ts        # predicted/measured markers + residual lines
src/render/field-arrows.ts         # active-field arrow overlay
src/state/slices/calibration.slice.ts
```

## Behaviour

- Monitor points are seeded and deterministic; changing the seed via **Resample** changes the measurements.
- The hidden truth uses `trueMaxThrow = 18 m` and `trueDecay = 4e-5`.
- The starting demo field (`24 m`, `1.2e-4`) produces an RMS around `3.15 m`; calibration typically lands near `18 m` / `4.1e-5` and an RMS around `1.09 m`.
- Calibration sets `maxThrow`, `decay`, and uncertainty `sigma` in the store; the block field, polygon, arrows and monitor layer update from those values.
- Calibration resets when the bench model changes or monitors are resampled.

## Verification

- Unit tests in `tests/unit/domain/calibration.test.ts`.
- Playwright flow test “showpiece flow: field arrows, calibration and a 100k model”.

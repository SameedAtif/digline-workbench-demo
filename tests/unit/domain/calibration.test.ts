import { describe, expect, it } from 'vitest'

import { defaultBenchParams, generateBench } from '@/data'
import {
  benchField,
  calibrateField,
  DEFAULT_MONITOR_PARAMS,
  evaluateMonitors,
  generateMonitors,
} from '@/domain'

const model = generateBench(defaultBenchParams(4242))

describe('synthetic monitors', () => {
  it('generates the requested number of points deterministically', () => {
    const a = generateMonitors(model, { ...DEFAULT_MONITOR_PARAMS, count: 12 })
    const b = generateMonitors(model, { ...DEFAULT_MONITOR_PARAMS, count: 12 })
    expect(a.length).toBe(12)
    expect(a.map((point) => point.measured)).toEqual(b.map((point) => point.measured))
  })

  it('reports residuals against the active field', () => {
    const monitors = generateMonitors(model)
    const field = benchField(model, {
      kind: 'free-face',
      maxThrow: 24,
      decay: 0.00012,
      uniformDx: 0,
      uniformDz: 0,
    })
    const evaluation = evaluateMonitors(monitors, field)
    expect(evaluation.points.length).toBe(monitors.length)
    expect(evaluation.rms).toBeGreaterThan(0)
    expect(evaluation.max).toBeGreaterThanOrEqual(evaluation.rms)
  })
})

describe('calibrateField', () => {
  it('reduces the residual RMS and recovers the hidden field', () => {
    const monitors = generateMonitors(model)
    const before = evaluateMonitors(
      monitors,
      benchField(model, {
        kind: 'free-face',
        maxThrow: 24,
        decay: 0.00012,
        uniformDx: 0,
        uniformDz: 0,
      }),
    )
    const fit = calibrateField(model, monitors)

    expect(fit.rms).toBeLessThan(before.rms)
    expect(Math.abs(fit.maxThrow - DEFAULT_MONITOR_PARAMS.trueMaxThrow)).toBeLessThanOrEqual(2)
    expect(Math.abs(fit.decay - DEFAULT_MONITOR_PARAMS.trueDecay)).toBeLessThan(0.00004)
  })
})

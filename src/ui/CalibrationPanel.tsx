import * as SwitchPrimitive from '@radix-ui/react-switch'
import { useMemo } from 'react'

import {
  benchField,
  calibrateField,
  DEFAULT_MONITOR_PARAMS,
  evaluateMonitors,
  generateMonitors,
} from '@/domain'
import { useAppStore } from '@/state'

export function CalibrationPanel(): React.JSX.Element {
  const model = useAppStore((state) => state.model)
  const monitorsEnabled = useAppStore((state) => state.monitorsEnabled)
  const monitorSeed = useAppStore((state) => state.monitorSeed)
  const calibration = useAppStore((state) => state.calibration)
  const fieldKind = useAppStore((state) => state.fieldKind)
  const maxThrow = useAppStore((state) => state.maxThrow)
  const decay = useAppStore((state) => state.decay)
  const uniformDx = useAppStore((state) => state.uniformDx)
  const uniformDz = useAppStore((state) => state.uniformDz)
  const setMonitorsEnabled = useAppStore((state) => state.setMonitorsEnabled)
  const setMonitorSeed = useAppStore((state) => state.setMonitorSeed)
  const setCalibration = useAppStore((state) => state.setCalibration)
  const setFieldKind = useAppStore((state) => state.setFieldKind)
  const setMaxThrow = useAppStore((state) => state.setMaxThrow)
  const setDecay = useAppStore((state) => state.setDecay)
  const setSigma = useAppStore((state) => state.setSigma)

  const monitors = useMemo(
    () => generateMonitors(model, { ...DEFAULT_MONITOR_PARAMS, seed: monitorSeed }),
    [model, monitorSeed],
  )
  const activeField = useMemo(
    () => benchField(model, { kind: fieldKind, maxThrow, decay, uniformDx, uniformDz }),
    [model, fieldKind, maxThrow, decay, uniformDx, uniformDz],
  )
  const evaluation = useMemo(() => evaluateMonitors(monitors, activeField), [monitors, activeField])

  const onCalibrate = (): void => {
    const beforeRms = evaluation.rms
    const fit = calibrateField(model, monitors)
    const sigma = Math.min(5, Math.max(0.2, Number(fit.rms.toFixed(1))))
    setFieldKind('free-face')
    setMaxThrow(fit.maxThrow)
    setDecay(fit.decay)
    setSigma(sigma)
    setCalibration({
      beforeRms,
      afterRms: fit.rms,
      maxThrow: fit.maxThrow,
      decay: fit.decay,
      sigma,
    })
  }

  const rows = evaluation.points.slice(0, 4)

  return (
    <section className="rounded-lg border border-[#252b34] bg-[#14171c] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d8998]">
            Calibration
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-[#6f7b8a]">
            Synthetic monitors compare predicted vs measured blast movement.
          </p>
        </div>
        <SwitchPrimitive.Root
          checked={monitorsEnabled}
          onCheckedChange={setMonitorsEnabled}
          aria-label="Toggle synthetic monitor points"
          title="Show synthetic measured monitor points and predicted vs measured residual vectors."
          data-tip="Show synthetic measured monitor points and predicted vs measured residual vectors."
          className="relative h-5 w-9 shrink-0 rounded-full bg-[#2b323c] transition data-[state=checked]:bg-[#46b3a5]"
        >
          <SwitchPrimitive.Thumb className="block h-3.5 w-3.5 translate-x-1 rounded-full bg-white transition data-[state=checked]:translate-x-[18px]" />
        </SwitchPrimitive.Root>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat
          label="Predicted RMS"
          value={`${evaluation.rms.toFixed(2)} m`}
          hint="Root-mean-square difference between predicted and measured monitor displacements."
        />
        <Stat
          label="Max residual"
          value={`${evaluation.max.toFixed(2)} m`}
          hint="Largest single predicted-vs-measured residual."
        />
        <Stat
          label="Monitors"
          value={`${monitors.length}`}
          hint="Synthetic surface displacement monitors derived from a hidden ground-truth field plus seeded noise."
        />
        <Stat
          label="Ground truth"
          value={`${DEFAULT_MONITOR_PARAMS.trueMaxThrow} m`}
          hint="The hidden maximum throw used to create the synthetic measurements."
        />
      </div>

      <div className="mt-3 flex gap-1.5">
        <button
          type="button"
          onClick={onCalibrate}
          title="Fit max throw and throw decay to the monitor residuals, then set ensemble sigma from the residual RMS."
          data-tip="Fit max throw and throw decay to the monitor residuals, then set ensemble sigma from the residual RMS."
          className="flex-1 rounded-md bg-[#46b3a5] px-2 py-1.5 text-[11px] font-medium text-[#06231f] hover:bg-[#5cc6b8]"
        >
          Calibrate field
        </button>
        <button
          type="button"
          onClick={() => setMonitorSeed(monitorSeed + 1)}
          title="Generate a new deterministic set of monitor points and clear the previous fit."
          data-tip="Generate a new deterministic set of monitor points and clear the previous fit."
          className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#9aa6b5] hover:bg-[#232a33]"
        >
          Resample
        </button>
      </div>

      {calibration ? (
        <div className="mt-3 rounded-md border border-[#2b6f68] bg-[#132925] px-3 py-2 text-[10px] leading-4 text-[#9be8dc]">
          Last fit: max throw {calibration.maxThrow.toFixed(1)} m, decay{' '}
          {calibration.decay.toExponential(1)}.
          <br />
          RMS {calibration.beforeRms.toFixed(2)} m → {calibration.afterRms.toFixed(2)} m.
          Uncertainty sigma set to {calibration.sigma.toFixed(1)} m.
        </div>
      ) : null}

      <table className="mt-3 w-full text-left text-[10px] text-[#8a96a5]">
        <thead>
          <tr className="text-[#5d6775]">
            <th className="font-normal">#</th>
            <th className="font-normal">Predicted</th>
            <th className="font-normal">Measured</th>
            <th className="font-normal">Residual</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="font-mono">{row.id}</td>
              <td className="font-mono">{magnitude(row.predicted).toFixed(1)} m</td>
              <td className="font-mono">{magnitude(row.measured).toFixed(1)} m</td>
              <td className="font-mono text-[#ffd166]">{row.magnitude.toFixed(2)} m</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] leading-4 text-[#5d6775]">
        Monitors are synthetic: measured = hidden truth + seeded noise. Calibration only fits the
        free-face model.
      </p>
    </section>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}): React.JSX.Element {
  return (
    <div className="rounded-md bg-[#1b1f26] px-2.5 py-2" title={hint} data-tip={hint}>
      <div className="text-[10px] uppercase tracking-wider text-[#6f7b8a]">{label}</div>
      <div className="mt-0.5 font-mono text-[12px] text-[#d5dde6]">{value}</div>
    </div>
  )
}

function magnitude(vector: readonly [number, number, number]): number {
  return Math.hypot(vector[0], vector[1], vector[2])
}

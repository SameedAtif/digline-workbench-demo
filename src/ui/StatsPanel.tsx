import { modelBounds } from '@/domain'
import { MetricsPanel } from '@/polygon/metrics-panel'
import { useAppStore } from '@/state'
import { UncertaintyToggle } from '@/uncertainty/toggle'

import { CalibrationPanel } from './CalibrationPanel'
import { InspectorPanel } from './InspectorPanel'

export function StatsPanel(): React.JSX.Element {
  const model = useAppStore((state) => state.model)
  const bounds = modelBounds(model)
  const width = bounds.maxX - bounds.minX
  const depth = bounds.maxZ - bounds.minZ
  const height = bounds.maxY - bounds.minY

  return (
    <aside
      data-testid="stats-panel"
      className="flex h-full w-[340px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-[#20252d] bg-[#101318] p-3"
    >
      <div className="rounded-lg border border-[#252b34] bg-[#14171c] p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d8998]">
          Bench
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <Stat
            label="Blocks"
            value={model.count.toLocaleString()}
            hint="Total number of blocks in the current model."
          />
          <Stat
            label="Extent"
            value={`${width.toFixed(0)} × ${depth.toFixed(0)} m`}
            hint="Bench footprint in the X and Z directions."
          />
          <Stat label="Height" value={`${height.toFixed(0)} m`} hint="Bench height in Y." />
          <Stat
            label="Cell"
            value={`${(model.size[0] ?? 0).toFixed(1)} m`}
            hint="Edge length of one block."
          />
        </div>
      </div>

      <MetricsPanel />
      <InspectorPanel />
      <CalibrationPanel />
      <UncertaintyToggle />

      <p className="px-1 pb-2 text-[10px] leading-4 text-[#5d6775]">
        Synthetic data only. Displacement is a plausible parameterised field, not a physics
        prediction. Not for operational use.
      </p>
    </aside>
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

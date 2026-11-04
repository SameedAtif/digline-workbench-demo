import { benchField, MATERIAL } from '@/domain'
import { useAppStore } from '@/state'

const MATERIAL_LABEL: Record<number, string> = {
  [MATERIAL.waste]: 'Waste',
  [MATERIAL.ore]: 'Ore',
  [MATERIAL.lowGrade]: 'Low grade',
}

export function InspectorPanel(): React.JSX.Element | null {
  const model = useAppStore((state) => state.model)
  const index = useAppStore((state) => state.selectedBlock)
  const fieldKind = useAppStore((state) => state.fieldKind)
  const maxThrow = useAppStore((state) => state.maxThrow)
  const uniformDx = useAppStore((state) => state.uniformDx)
  const uniformDz = useAppStore((state) => state.uniformDz)

  if (index === null || index < 0 || index >= model.count) return null

  const x = model.x[index] ?? 0
  const y = model.y[index] ?? 0
  const z = model.z[index] ?? 0
  const grade = model.grade[index] ?? 0
  const material = model.material[index] ?? 0
  const size = model.size[index] ?? 0
  const tonnes = model.tonnes[index] ?? 0

  const field = benchField(model, { kind: fieldKind, maxThrow, uniformDx, uniformDz })
  const [dx, dy, dz] = field.sample(x, y, z)

  return (
    <section className="rounded-lg border border-[#252b34] bg-[#14171c] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d8998]">
          Block inspector
        </h2>
        <span className="rounded bg-[#232a33] px-1.5 py-0.5 font-mono text-[10px] text-[#9aa6b5]">
          #{index}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-4 text-[#6f7b8a]">
        The block under your last click. The dashed line in the viewport links its pre- and
        post-blast positions.
      </p>
      <dl className="mt-3 space-y-1.5 text-xs">
        <Row label="Grade" value={`${grade.toFixed(2)} g/t`} hint="Grade of the selected block." />
        <Row
          label="Material"
          value={MATERIAL_LABEL[material] ?? 'Unknown'}
          hint="Ore, low grade or waste classification."
        />
        <Row
          label="Tonnes"
          value={`${tonnes.toFixed(0)} t`}
          hint="Block tonnage from size cubed times density."
        />
        <Row label="Size" value={`${size.toFixed(1)} m`} hint="Block edge length." />
        <Row
          label="Pre-blast"
          value={`${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`}
          hint="Block centroid at t = 0."
          mono
        />
        <Row
          label="Post-blast"
          value={`${(x + dx).toFixed(1)}, ${(y + dy).toFixed(1)}, ${(z + dz).toFixed(1)}`}
          hint="Block centroid at t = 1 under the active field."
          mono
        />
      </dl>
    </section>
  )
}

function Row({
  label,
  value,
  hint,
  mono = false,
}: {
  label: string
  value: string
  hint: string
  mono?: boolean
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3" title={hint} data-tip={hint}>
      <dt className="text-[#7d8998]">{label}</dt>
      <dd className={`text-[#d5dde6] ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</dd>
    </div>
  )
}

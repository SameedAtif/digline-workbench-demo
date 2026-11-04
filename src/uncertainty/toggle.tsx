import * as SliderPrimitive from '@radix-ui/react-slider'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { useAppStore } from '@/state'

export function UncertaintyToggle(): React.JSX.Element {
  const enabled = useAppStore((state) => state.enabled)
  const t = useAppStore((state) => state.t)
  const size = useAppStore((state) => state.size)
  const sigma = useAppStore((state) => state.sigma)
  const setEnabled = useAppStore((state) => state.setEnabled)
  const setSize = useAppStore((state) => state.setSize)
  const setSigma = useAppStore((state) => state.setSigma)

  return (
    <section className="rounded-lg border border-[#252b34] bg-[#14171c] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d8998]">
            Uncertainty ensemble
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-[#6f7b8a]">
            {enabled && t < 0.02
              ? 'Scrub the blast above 0 to see where the dig line could land.'
              : '10 perturbed fields show where the dig line could land.'}
          </p>
        </div>
        <SwitchPrimitive.Root
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label="Toggle uncertainty ensemble"
          title="Show perturbed versions of the dig line to visualise blast uncertainty."
          data-tip="Show perturbed versions of the dig line to visualise blast uncertainty."
          className="relative h-5 w-9 shrink-0 rounded-full bg-[#2b323c] transition data-[state=checked]:bg-[#46b3a5]"
        >
          <SwitchPrimitive.Thumb className="block h-3.5 w-3.5 translate-x-1 rounded-full bg-white transition data-[state=checked]:translate-x-[18px]" />
        </SwitchPrimitive.Root>
      </div>

      <div className="mt-4 space-y-4">
        <SliderRow
          label="Members"
          hint="How many perturbed dig-line outlines to draw. More members make the band denser."
          value={`${size}`}
          min={1}
          max={32}
          step={1}
          current={size}
          onChange={setSize}
          ariaLabel="Ensemble member count"
        />
        <SliderRow
          label="Sigma"
          hint="Standard deviation of the jitter added to the blast field, in metres. Larger sigma widens the band."
          value={`${sigma.toFixed(1)} m`}
          min={0}
          max={5}
          step={0.1}
          current={sigma}
          onChange={setSigma}
          ariaLabel="Ensemble sigma in metres"
        />
      </div>
    </section>
  )
}

function SliderRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  current,
  onChange,
  ariaLabel,
}: {
  label: string
  hint: string
  value: string
  min: number
  max: number
  step: number
  current: number
  onChange: (value: number) => void
  ariaLabel: string
}): React.JSX.Element {
  return (
    <div title={hint} data-tip={hint}>
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="text-[#8a96a5]">{label}</span>
        <span className="font-mono text-[#d5dde6]">{value}</span>
      </div>
      <SliderPrimitive.Root
        value={[current]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0] ?? min)}
        aria-label={ariaLabel}
        className="relative flex h-4 w-full touch-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-[#2b323c]">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-[#46b3a5]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full bg-[#e6ebf2] shadow focus:outline-none focus:ring-2 focus:ring-[#46b3a5]" />
      </SliderPrimitive.Root>
    </div>
  )
}

import { useRef } from 'react'

import { useAppStore } from '@/state'

type MetricKey = 'tonnes' | 'meanGrade' | 'dilution' | 'oreLoss'
type Trend = 'up' | 'down' | 'flat'

function formatTonnes(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Mt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} kt`
  return `${value.toFixed(0)} t`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function trendOf(current: number, previous: number): Trend {
  if (previous === 0 && current === 0) return 'flat'
  if (current > previous * 1.01) return 'up'
  if (current < previous * 0.99) return 'down'
  return 'flat'
}

const TREND_GLYPH: Record<Trend, string> = { up: '↑', down: '↓', flat: '·' }
const TREND_COLOR: Record<Trend, string> = {
  up: 'text-[#6fd8c9]',
  down: 'text-[#ffb4a2]',
  flat: 'text-[#5d6775]',
}

export function MetricsPanel(): React.JSX.Element {
  const mode = useAppStore((state) => state.mode)
  const tonnes = useAppStore((state) => state.tonnes)
  const meanGrade = useAppStore((state) => state.meanGrade)
  const dilution = useAppStore((state) => state.dilution)
  const oreLoss = useAppStore((state) => state.oreLoss)

  const isClosed = mode === 'closed' || mode === 'editing'
  const values: Record<MetricKey, number> = { tonnes, meanGrade, dilution, oreLoss }
  const previous = useRef<Record<MetricKey, number>>(values)

  const trends: Record<MetricKey, Trend> = {
    tonnes: trendOf(values.tonnes, previous.current.tonnes),
    meanGrade: trendOf(values.meanGrade, previous.current.meanGrade),
    dilution: trendOf(values.dilution, previous.current.dilution),
    oreLoss: trendOf(values.oreLoss, previous.current.oreLoss),
  }
  previous.current = values

  if (!isClosed) {
    return (
      <section className="rounded-lg border border-[#252b34] bg-[#14171c] p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d8998]">
          Dig-line metrics
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#8a96a5]">
          Draw an ore polygon on the bench top, then close it to see tonnes, grade, dilution and ore
          loss.
        </p>
      </section>
    )
  }

  const cards: Array<{ key: MetricKey; label: string; value: string; hint: string }> = [
    {
      key: 'tonnes',
      label: 'Tonnes in polygon',
      value: formatTonnes(tonnes),
      hint: 'Tonnage of ore-grade blocks whose current centroid is inside the deformed polygon.',
    },
    {
      key: 'meanGrade',
      label: 'Mean grade',
      value: `${meanGrade.toFixed(2)} g/t`,
      hint: 'Tonnage-weighted mean grade of the ore-grade blocks currently inside the polygon.',
    },
    {
      key: 'dilution',
      label: 'Dilution',
      value: formatPercent(dilution),
      hint: 'Share of tonnage inside the polygon that was not inside it at t = 0. Lower is cleaner.',
    },
    {
      key: 'oreLoss',
      label: 'Ore loss',
      value: formatPercent(oreLoss),
      hint: 'Share of the original ore tonnage that has moved outside the deformed polygon. Lower is better.',
    },
  ]

  return (
    <section className="rounded-lg border border-[#252b34] bg-[#14171c] p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d8998]">
        Dig-line metrics
      </h2>
      <p className="mt-1 text-[10px] leading-4 text-[#6f7b8a]">
        Measured against the pre-blast polygon at t = 0.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3" data-testid="metrics-panel">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-md bg-[#1b1f26] px-3 py-2.5"
            title={card.hint}
            data-tip={card.hint}
          >
            <div className="text-[10px] uppercase tracking-wider text-[#6f7b8a]">{card.label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-[#e6ebf2]">{card.value}</span>
              <span className={`text-xs ${TREND_COLOR[trends[card.key]]}`}>
                {TREND_GLYPH[trends[card.key]]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

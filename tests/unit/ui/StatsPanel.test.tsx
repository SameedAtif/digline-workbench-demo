import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useAppStore } from '@/state'
import { StatsPanel } from '@/ui/StatsPanel'

describe('StatsPanel', () => {
  it('shows a prompt before a polygon is closed', () => {
    useAppStore.setState({ mode: 'idle', vertices: new Float32Array(0) })
    render(<StatsPanel />)
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument()
    expect(screen.getByText(/draw an ore polygon/i)).toBeInTheDocument()
  })

  it('shows the four metrics once the polygon is closed', () => {
    useAppStore.setState({
      mode: 'closed',
      vertices: new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]),
      tonnes: 1200,
      meanGrade: 2.4,
      dilution: 0.12,
      oreLoss: 0.05,
    })
    render(<StatsPanel />)
    expect(screen.getByTestId('metrics-panel')).toBeInTheDocument()
    expect(screen.getByText('1.2 kt')).toBeInTheDocument()
    expect(screen.getByText('12.0%')).toBeInTheDocument()
  })
})

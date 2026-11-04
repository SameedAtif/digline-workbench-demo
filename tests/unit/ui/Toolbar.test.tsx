import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useAppStore } from '@/state'
import { Toolbar } from '@/ui/Toolbar'

function reset(): void {
  useAppStore.setState({
    mode: 'idle',
    vertices: new Float32Array(0),
    t: 0,
    playing: false,
    selectedBlock: null,
    colorMode: 'grade',
    sliceEnabled: false,
    hudVisible: false,
  })
}

describe('Toolbar', () => {
  it('renders the primary tool groups', () => {
    reset()
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draw polygon' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play blast' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import CSV' })).toBeInTheDocument()
  })

  it('switches colour mode through the store', () => {
    reset()
    render(<Toolbar />)
    screen.getByText('Material').click()
    expect(useAppStore.getState().colorMode).toBe('material')
  })
})

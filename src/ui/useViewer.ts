import { useContext } from 'react'

import type { Viewer } from '@/render/core'

import { ViewerContext } from './viewer-context'

export function useViewer(): Viewer {
  const viewer = useContext(ViewerContext)
  if (!viewer) {
    throw new Error('useViewer must be used inside a <Viewport> provider')
  }
  return viewer
}

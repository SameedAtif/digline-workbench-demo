import { createContext } from 'react'

import type { Viewer } from '@/render/core'

export const ViewerContext = createContext<Viewer | null>(null)

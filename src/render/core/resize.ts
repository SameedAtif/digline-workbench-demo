export interface ResizeController {
  disconnect(): void
}

/**
 * Observes an element and collapses ResizeObserver bursts to one call per
 * animation frame.
 */
export function observeResize(
  element: Element,
  onResize: (width: number, height: number) => void,
): ResizeController {
  let raf = 0
  let pending: { width: number; height: number } | null = null

  const flush = (): void => {
    raf = 0
    if (!pending) return
    const { width, height } = pending
    pending = null
    onResize(width, height)
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const box = entry.contentRect
    pending = { width: Math.max(1, box.width), height: Math.max(1, box.height) }
    if (raf === 0) raf = requestAnimationFrame(flush)
  })

  observer.observe(element)

  return {
    disconnect: () => {
      observer.disconnect()
      if (raf !== 0) cancelAnimationFrame(raf)
      raf = 0
      pending = null
    },
  }
}

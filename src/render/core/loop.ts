export interface FrameInfo {
  /** Seconds since the previous frame. */
  dt: number
  /** Seconds since the loop started. */
  elapsed: number
}

export type FrameCallback = (info: FrameInfo) => void

export interface Loop {
  start(): void
  stop(): void
  isRunning(): boolean
}

export function createLoop(callback: FrameCallback): Loop {
  let raf = 0
  let running = false
  let last = 0
  let elapsed = 0

  const tick = (now: number): void => {
    if (!running) return
    if (last === 0) last = now
    const dt = Math.min(0.2, (now - last) / 1000)
    last = now
    elapsed += dt
    callback({ dt, elapsed })
    raf = requestAnimationFrame(tick)
  }

  return {
    start: () => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(tick)
    },
    stop: () => {
      running = false
      if (raf !== 0) cancelAnimationFrame(raf)
      raf = 0
    },
    isRunning: () => running,
  }
}

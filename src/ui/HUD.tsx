import { useEffect, useRef, useState } from 'react'

import { useAppStore } from '@/state'

import { useViewer } from './useViewer'

interface HudStats {
  fps: number
  frameMs: number
  calls: number
  geometries: number
  textures: number
}

const INITIAL: HudStats = { fps: 0, frameMs: 0, calls: 0, geometries: 0, textures: 0 }

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

export function HUD(): React.JSX.Element | null {
  const viewer = useViewer()
  const visible = useAppStore((state) => state.hudVisible)
  const toggleHud = useAppStore((state) => state.toggleHud)
  const instanceCount = useAppStore((state) => state.model.count)
  const [stats, setStats] = useState<HudStats>(INITIAL)
  const frames = useRef(0)
  const elapsed = useRef(0)
  const lastFrame = useRef(0)

  useEffect(() => {
    const unsubscribe = viewer.onFrame(({ dt }) => {
      frames.current += 1
      elapsed.current += dt
      lastFrame.current = dt
      if (elapsed.current >= 0.25) {
        const info = viewer.renderer.info
        setStats({
          fps: frames.current / elapsed.current,
          frameMs: lastFrame.current * 1000,
          calls: info.render.calls,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
        })
        frames.current = 0
        elapsed.current = 0
      }
    })
    return unsubscribe
  }, [viewer])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== 'd' || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      toggleHud()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleHud])

  if (!visible) return null

  return (
    <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-[#2b323c] bg-[#0b0d10]/85 px-3 py-2 font-mono text-[11px] leading-5 text-[#b8c2cf] shadow-lg backdrop-blur">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-[#6f7b8a]">Render HUD</div>
      <div className="flex gap-4">
        <span>
          <span className="text-[#6f7b8a]">fps </span>
          {stats.fps.toFixed(0)}
        </span>
        <span>
          <span className="text-[#6f7b8a]">frame </span>
          {stats.frameMs.toFixed(1)} ms
        </span>
        <span>
          <span className="text-[#6f7b8a]">calls </span>
          {stats.calls}
        </span>
      </div>
      <div className="flex gap-4">
        <span>
          <span className="text-[#6f7b8a]">blocks </span>
          {instanceCount.toLocaleString()}
        </span>
        <span>
          <span className="text-[#6f7b8a]">geo </span>
          {stats.geometries}
        </span>
        <span>
          <span className="text-[#6f7b8a]">tex </span>
          {stats.textures}
        </span>
      </div>
    </div>
  )
}

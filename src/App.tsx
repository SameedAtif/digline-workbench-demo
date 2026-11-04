import { useAppStore } from '@/state'

import { StatsPanel } from './ui/StatsPanel'
import { Toolbar } from './ui/Toolbar'
import { Viewport } from './ui/Viewport'

export function App(): React.JSX.Element {
  const statsVisible = useAppStore((state) => state.statsVisible)

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0b0d10] text-[#e6ebf2]">
      <Toolbar />
      <main className="relative min-w-0 flex-1">
        <Viewport />
      </main>
      {statsVisible ? <StatsPanel /> : null}
    </div>
  )
}

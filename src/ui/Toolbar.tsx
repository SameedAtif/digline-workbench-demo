import { useMemo, useRef, useState } from 'react'

import { defaultBenchParams, describeImportError, generateBench, parseCSV } from '@/data'
import { modelBounds } from '@/domain'
import { ClosePolygon } from '@/polygon'
import { useAppStore } from '@/state'
import type { ColorMode, FieldKind } from '@/state'

const SIZE_PRESETS = [
  { id: 'demo', label: 'Demo — 11.5k blocks', nx: 48, ny: 5, nz: 48 },
  { id: '100k', label: '100k blocks', nx: 100, ny: 10, nz: 100 },
  { id: '250k', label: '250k blocks', nx: 100, ny: 25, nz: 100 },
  { id: '500k', label: '500k blocks', nx: 100, ny: 50, nz: 100 },
] as const

const COLOR_MODES: Array<{ value: ColorMode; label: string; hint: string }> = [
  {
    value: 'grade',
    label: 'Grade',
    hint: 'Colour every block by its grade using the perceptually uniform viridis ramp.',
  },
  {
    value: 'material',
    label: 'Material',
    hint: 'Colour by material type: ore (gold), low grade (pale green), or waste (slate).',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    hint: 'Flat accent colour. Useful for judging shape and movement without grade distraction.',
  },
]

export function Toolbar(): React.JSX.Element {
  const model = useAppStore((state) => state.model)
  const setModel = useAppStore((state) => state.setModel)
  const bounds = useMemo(() => modelBounds(model), [model])

  const colorMode = useAppStore((state) => state.colorMode)
  const setColorMode = useAppStore((state) => state.setColorMode)
  const cutoff = useAppStore((state) => state.cutoff)
  const setCutoff = useAppStore((state) => state.setCutoff)
  const gradeMax = useAppStore((state) => state.gradeMax)

  const sliceEnabled = useAppStore((state) => state.sliceEnabled)
  const setSliceEnabled = useAppStore((state) => state.setSliceEnabled)
  const slicePosition = useAppStore((state) => state.slicePosition)
  const setSlicePosition = useAppStore((state) => state.setSlicePosition)

  const t = useAppStore((state) => state.t)
  const setT = useAppStore((state) => state.setT)
  const playing = useAppStore((state) => state.playing)
  const play = useAppStore((state) => state.play)
  const pause = useAppStore((state) => state.pause)
  const resetBlast = useAppStore((state) => state.resetBlast)

  const fieldKind = useAppStore((state) => state.fieldKind)
  const setFieldKind = useAppStore((state) => state.setFieldKind)
  const maxThrow = useAppStore((state) => state.maxThrow)
  const setMaxThrow = useAppStore((state) => state.setMaxThrow)
  const decay = useAppStore((state) => state.decay)
  const setDecay = useAppStore((state) => state.setDecay)
  const uniformDx = useAppStore((state) => state.uniformDx)
  const uniformDz = useAppStore((state) => state.uniformDz)
  const setUniform = useAppStore((state) => state.setUniform)

  const mode = useAppStore((state) => state.mode)
  const vertices = useAppStore((state) => state.vertices)
  const planeY = useAppStore((state) => state.planeY)
  const startPlacing = useAppStore((state) => state.startPlacing)
  const executeCommand = useAppStore((state) => state.executeCommand)
  const clearPolygon = useAppStore((state) => state.clearPolygon)
  const loadExamplePolygon = useAppStore((state) => state.loadExamplePolygon)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const historyLength = useAppStore((state) => state.historyStack.length)
  const redoLength = useAppStore((state) => state.redoStack.length)

  const fieldArrowsVisible = useAppStore((state) => state.fieldArrowsVisible)
  const setFieldArrowsVisible = useAppStore((state) => state.setFieldArrowsVisible)
  const hudVisible = useAppStore((state) => state.hudVisible)
  const toggleHud = useAppStore((state) => state.toggleHud)

  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const vertexCount = vertices.length / 2
  const currentPreset =
    SIZE_PRESETS.find((preset) => preset.nx * preset.ny * preset.nz === model.count)?.id ?? 'custom'

  const onSize = (id: string): void => {
    const preset = SIZE_PRESETS.find((candidate) => candidate.id === id)
    if (!preset) return
    const base = defaultBenchParams()
    const cell = base.cellSize
    setModel(
      generateBench({
        ...base,
        nx: preset.nx,
        ny: preset.ny,
        nz: preset.nz,
        orebodyCenter: [(preset.nx * cell) / 2, (preset.ny * cell) / 2, (preset.nz * cell) / 2],
        orebodyRadius: Math.min(preset.nx, preset.nz) * cell * 0.42,
      }),
    )
    setImportMessage(`Generated ${preset.label}`)
  }

  const onDraw = (): void => {
    if (mode === 'placing') {
      if (vertexCount >= 3) executeCommand(ClosePolygon())
      return
    }
    startPlacing(planeY)
  }

  const onFile = async (file: File | null): Promise<void> => {
    if (!file) return
    setImportMessage('Parsing…')
    const result = await parseCSV(file)
    if (result.kind === 'ok') {
      setModel(result.model)
      setImportMessage(`Loaded ${result.model.count.toLocaleString()} blocks`)
    } else {
      setImportMessage(describeImportError(result))
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <aside
      data-testid="toolbar"
      className="flex h-full w-[280px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-[#20252d] bg-[#101318] p-3"
    >
      <header className="px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#46b3a5]" />
          <h1 className="text-sm font-semibold tracking-wide text-[#e6ebf2]">Dig-Line Workbench</h1>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-[#6f7b8a]">
          Draw the ore polygon, scrub the blast, read the muckpile.
        </p>
      </header>

      <Section title="How to use">
        <ol className="ml-4 list-decimal space-y-1 text-[11px] leading-4 text-[#8a96a5]">
          <li>
            Click <b className="text-[#c3ccd7]">Draw polygon</b>, then click the bench top at least
            three times.
          </li>
          <li>
            Click <b className="text-[#c3ccd7]">Close polygon</b> (or double-click the bench) to
            finish. Drag a white handle to reshape it, or drag inside it to move the whole polygon.
          </li>
          <li>
            Drag <b className="text-[#c3ccd7]">Scrub</b> or press{' '}
            <b className="text-[#c3ccd7]">Play blast</b> to move blocks and polygon.
          </li>
          <li>Read tonnes, grade, dilution and ore loss in the right-hand panel.</li>
          <li>Click a block to trace it, then try the uncertainty toggle.</li>
        </ol>
      </Section>

      <Section title="Colour">
        <div className="grid grid-cols-3 gap-1.5">
          {COLOR_MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              title={option.hint}
              data-tip={option.hint}
              onClick={() => setColorMode(option.value)}
              className={`rounded-md px-2 py-1.5 text-[11px] transition ${
                colorMode === option.value
                  ? 'bg-[#46b3a5] text-[#06231f]'
                  : 'bg-[#1b1f26] text-[#9aa6b5] hover:bg-[#232a33]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <RangeRow
          label="Grade cutoff"
          hint="Blocks below this grade fade out. Raise it to focus on high-grade ore."
          value={`${cutoff.toFixed(2)} g/t`}
          min={0}
          max={gradeMax}
          step={0.05}
          current={cutoff}
          onChange={setCutoff}
        />
      </Section>

      <Section title="Ore polygon">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onDraw}
            title={
              mode === 'placing'
                ? 'Finish the polygon after at least three points. You can also double-click the bench.'
                : 'Start drawing. Then click the bench top to place each corner.'
            }
            data-tip={
              mode === 'placing'
                ? 'Finish the polygon after at least three points. You can also double-click the bench.'
                : 'Start drawing. Then click the bench top to place each corner.'
            }
            className="rounded-md bg-[#46b3a5] px-2 py-1.5 text-[11px] font-medium text-[#06231f] hover:bg-[#5cc6b8]"
          >
            {mode === 'placing'
              ? vertexCount >= 3
                ? 'Close polygon'
                : 'Placing…'
              : 'Draw polygon'}
          </button>
          <button
            type="button"
            onClick={clearPolygon}
            title="Delete the polygon and return the draw tool to idle."
            data-tip="Delete the polygon and return the draw tool to idle."
            className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#9aa6b5] hover:bg-[#232a33]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={historyLength === 0}
            title="Reverse the last polygon edit. Keyboard: Ctrl/Cmd + Z."
            data-tip="Reverse the last polygon edit. Keyboard: Ctrl/Cmd + Z."
            className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#9aa6b5] hover:bg-[#232a33] disabled:opacity-35"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoLength === 0}
            title="Re-apply the last undone edit. Keyboard: Shift + Ctrl/Cmd + Z."
            data-tip="Re-apply the last undone edit. Keyboard: Shift + Ctrl/Cmd + Z."
            className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#9aa6b5] hover:bg-[#232a33] disabled:opacity-35"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={loadExamplePolygon}
            title="Load a demo dig line around the high-grade core so you can immediately see metrics and blast deformation."
            data-tip="Load a demo dig line around the high-grade core so you can immediately see metrics and blast deformation."
            className="col-span-2 rounded-md border border-[#2b6f68] bg-[#132925] px-2 py-1.5 text-[11px] text-[#9be8dc] hover:bg-[#16332e]"
          >
            Load example polygon
          </button>
        </div>
        <p className="text-[10px] leading-4 text-[#5d6775]">
          {mode === 'placing'
            ? `${vertexCount} point${vertexCount === 1 ? '' : 's'} placed — double-click or press Close.`
            : 'Click the bench top to add points. Drag a white handle to edit. Alt-click deletes.'}
        </p>
      </Section>

      <Section title="Blast">
        <RangeRow
          label="Scrub"
          hint="t = 0 is the pre-blast bench; t = 1 is the post-blast muckpile. Blocks and polygon move together."
          value={`t = ${t.toFixed(2)}`}
          min={0}
          max={1}
          step={0.01}
          current={t}
          onChange={setT}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={playing ? pause : play}
            title="Animate the blast from the current scrub position to t = 1."
            data-tip="Animate the blast from the current scrub position to t = 1."
            className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#d5dde6] hover:bg-[#232a33]"
          >
            {playing ? 'Pause' : 'Play blast'}
          </button>
          <button
            type="button"
            onClick={resetBlast}
            title="Return the blast to t = 0 (pre-blast)."
            data-tip="Return the blast to t = 0 (pre-blast)."
            className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#9aa6b5] hover:bg-[#232a33]"
          >
            Reset
          </button>
        </div>
        <label
          className="block text-[10px] uppercase tracking-wider text-[#6f7b8a]"
          title="Free face: throw decays with distance from the bench edge. Uniform: every block moves by the same vector."
          data-tip="Free face: throw decays with distance from the bench edge. Uniform: every block moves by the same vector."
        >
          Field
          <select
            value={fieldKind}
            onChange={(event) => setFieldKind(event.target.value as FieldKind)}
            className="mt-1 w-full rounded-md border border-[#2b323c] bg-[#1b1f26] px-2 py-1.5 text-[11px] normal-case tracking-normal text-[#d5dde6] outline-none"
          >
            <option value="free-face">Free face</option>
            <option value="uniform">Uniform</option>
          </select>
        </label>
        {fieldKind === 'free-face' ? (
          <>
            <RangeRow
              label="Max throw"
              hint="Maximum horizontal displacement at the free face, in metres. Higher values throw ore further."
              value={`${maxThrow.toFixed(1)} m`}
              min={0}
              max={40}
              step={0.5}
              current={maxThrow}
              onChange={setMaxThrow}
            />
            <RangeRow
              label="Throw decay"
              hint="How quickly throw falls off with distance from the free face. Lower values reach farther across the bench."
              value={decay.toExponential(1)}
              min={0.00001}
              max={0.0006}
              step={0.00001}
              current={decay}
              onChange={setDecay}
            />
          </>
        ) : (
          <>
            <RangeRow
              label="East"
              hint="Uniform blast displacement along world X, in metres."
              value={`${uniformDx.toFixed(1)} m`}
              min={-40}
              max={40}
              step={0.5}
              current={uniformDx}
              onChange={(value) => setUniform(value, uniformDz)}
            />
            <RangeRow
              label="North"
              hint="Uniform blast displacement along world Z, in metres."
              value={`${uniformDz.toFixed(1)} m`}
              min={-40}
              max={40}
              step={0.5}
              current={uniformDz}
              onChange={(value) => setUniform(uniformDx, value)}
            />
          </>
        )}
        <label
          className="flex items-center justify-between text-[11px] text-[#9aa6b5]"
          title="Show the active 3D blast field as arrows on a grid over the bench."
          data-tip="Show the active 3D blast field as arrows on a grid over the bench."
        >
          Show field arrows
          <input
            type="checkbox"
            checked={fieldArrowsVisible}
            onChange={(event) => setFieldArrowsVisible(event.target.checked)}
            className="h-3.5 w-3.5 accent-[#46b3a5]"
          />
        </label>
      </Section>

      <Section title="Slice">
        <label
          className="flex items-center justify-between text-[11px] text-[#9aa6b5]"
          title="Hide blocks on one side of a vertical plane at the chosen world-X position."
          data-tip="Hide blocks on one side of a vertical plane at the chosen world-X position."
        >
          Enable clipping
          <input
            type="checkbox"
            checked={sliceEnabled}
            onChange={(event) => setSliceEnabled(event.target.checked)}
            className="h-3.5 w-3.5 accent-[#46b3a5]"
          />
        </label>
        <RangeRow
          label="Plane X"
          hint="World-X position of the vertical slice. Lower it to sweep across the bench."
          value={`${slicePosition.toFixed(0)} m`}
          min={bounds.minX}
          max={bounds.maxX}
          step={1}
          current={slicePosition}
          onChange={setSlicePosition}
        />
      </Section>

      <Section title="Model">
        <label
          className="block text-[10px] uppercase tracking-wider text-[#6f7b8a]"
          title="Regenerate the synthetic bench at a different size. Larger models exercise the instanced renderer."
          data-tip="Regenerate the synthetic bench at a different size. Larger models exercise the instanced renderer."
        >
          Bench size
          <select
            value={currentPreset}
            onChange={(event) => onSize(event.target.value)}
            className="mt-1 w-full rounded-md border border-[#2b323c] bg-[#1b1f26] px-2 py-1.5 text-[11px] normal-case tracking-normal text-[#d5dde6] outline-none"
          >
            {SIZE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            {currentPreset === 'custom' ? <option value="custom">Imported / custom</option> : null}
          </select>
        </label>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
          className="hidden"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            title="Load a CSV with columns x,y,z,size,grade,material. Invalid files are rejected with a row summary."
            data-tip="Load a CSV with columns x,y,z,size,grade,material. Invalid files are rejected with a row summary."
            className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#9aa6b5] hover:bg-[#232a33]"
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('digline:reset-view'))}
            title="Re-frame the camera on the whole bench. Does not change data or the polygon."
            data-tip="Re-frame the camera on the whole bench. Does not change data or the polygon."
            className="rounded-md bg-[#1b1f26] px-2 py-1.5 text-[11px] text-[#9aa6b5] hover:bg-[#232a33]"
          >
            Reset view
          </button>
        </div>
        <a
          href="/sample-blocks.csv"
          download="sample-blocks.csv"
          title="Download a small valid block CSV to try the importer."
          data-tip="Download a small valid block CSV to try the importer."
          className="block text-center text-[10px] text-[#6fd8c9] underline decoration-dotted underline-offset-2 hover:text-[#9be8dc]"
        >
          Download sample CSV
        </a>
        <label
          className="flex items-center justify-between text-[11px] text-[#9aa6b5]"
          title="Show FPS, frame time, draw calls, block count and GPU memory counters. Keyboard: D."
          data-tip="Show FPS, frame time, draw calls, block count and GPU memory counters. Keyboard: D."
        >
          Performance HUD
          <input
            type="checkbox"
            checked={hudVisible}
            onChange={toggleHud}
            className="h-3.5 w-3.5 accent-[#46b3a5]"
          />
        </label>
        {importMessage ? (
          <p className="text-[10px] leading-4 text-[#7d8998]">{importMessage}</p>
        ) : null}
      </Section>
    </aside>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="space-y-2.5 rounded-lg border border-[#252b34] bg-[#14171c] p-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d8998]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function RangeRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string
  hint: string
  value: string
  min: number
  max: number
  step: number
  current: number
  onChange: (value: number) => void
}): React.JSX.Element {
  return (
    <div title={hint} data-tip={hint}>
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="uppercase tracking-wider text-[#6f7b8a]">{label}</span>
        <span className="font-mono text-[#c3ccd7]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#2b323c]"
      />
    </div>
  )
}

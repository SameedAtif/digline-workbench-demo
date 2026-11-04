import { resolve } from 'node:path'

import { expect, test, type Page } from '@playwright/test'

const SAMPLE_CSV = resolve(process.cwd(), 'public/sample-blocks.csv')
const MALFORMED_CSV = resolve(process.cwd(), 'tests/fixtures/malformed.csv')

async function canvasBox(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await page.locator('canvas').boundingBox()
  expect(box).not.toBeNull()
  if (!box) throw new Error('canvas has no box')
  return box
}

async function drawSquare(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Draw polygon' }).click()
  await expect(page.getByTestId('viewport-guide')).toContainText('Drawing:')

  const box = await canvasBox(page)
  const points: Array<[number, number]> = [
    [0.38, 0.38],
    [0.64, 0.4],
    [0.66, 0.62],
    [0.36, 0.6],
  ]
  for (const [fx, fy] of points) {
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy)
    await page.waitForTimeout(80)
  }
  await page.getByRole('button', { name: 'Close polygon' }).click()
  await expect(page.getByTestId('metrics-panel')).toBeVisible()
}

test('dig-line flow: draw, close, undo/redo, play, uncertainty, inspect', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByTestId('viewport-guide')).toContainText('Polygon closed')
  await expect(page.getByTestId('metrics-panel')).toBeVisible()

  await drawSquare(page)
  const before = await page.getByTestId('metrics-panel').innerText()

  // Undo the close command, then redo it.
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByTestId('metrics-panel')).toHaveCount(0)
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByTestId('metrics-panel')).toBeVisible()

  // Play the blast to the end and confirm both the 3D view and metrics respond.
  const canvasBefore = await page.locator('canvas').screenshot()
  await page.getByRole('button', { name: 'Play blast' }).click()
  await expect
    .poll(
      async () => {
        const text = await page.getByTestId('toolbar').innerText()
        return text.includes('t = 1.00')
      },
      { timeout: 60_000 },
    )
    .toBe(true)
  const canvasAfter = await page.locator('canvas').screenshot()
  expect(Buffer.compare(canvasBefore, canvasAfter)).not.toBe(0)
  const after = await page.getByTestId('metrics-panel').innerText()
  expect(after).not.toBe(before)

  // Toggle the uncertainty ensemble.
  const uncertainty = page.getByRole('switch', { name: /uncertainty/i })
  await uncertainty.click()
  await expect(uncertainty).toBeChecked()
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const band = (
          window as unknown as {
            __diglineViewer: {
              scene: { children: Array<{ name: string; visible: boolean; children: unknown[] }> }
            }
          }
        ).__diglineViewer.scene.children.find((child) => child.name === 'ensemble-band')
        return band ? band.visible && band.children.length > 0 : false
      }),
    )
    .toBe(true)

  // Pick a block. Try a few bench positions; the inspector appears on a hit.
  const box = await canvasBox(page)
  const candidates: Array<[number, number]> = [
    [0.3, 0.5],
    [0.25, 0.55],
    [0.7, 0.5],
    [0.55, 0.62],
    [0.5, 0.55],
  ]
  for (const [fx, fy] of candidates) {
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy)
    await page.waitForTimeout(250)
    if ((await page.getByText('Block inspector').count()) > 0) break
  }
  await expect(page.getByText('Block inspector')).toBeVisible()

  // Picking must not leave the renderer scissored to a 1x1 viewport.
  const viewport = await page.evaluate(() => {
    const viewer = (
      window as unknown as {
        __diglineViewer: {
          renderer: {
            getViewport(target: {
              copy(v: { x: number; y: number; z: number; w: number }): unknown
            }): { z: number; w: number }
          }
        }
      }
    ).__diglineViewer
    return viewer.renderer.getViewport({
      copy(v: { x: number; y: number; z: number; w: number }) {
        return { z: v.z, w: v.w }
      },
    })
  })
  expect(viewport.z).toBeGreaterThan(300)
  expect(viewport.w).toBeGreaterThan(300)

  // HUD and reset-view controls.
  await page.getByLabel('Performance HUD').check()
  await expect(page.getByText('Render HUD')).toBeVisible()
  await page.getByRole('button', { name: 'Reset view' }).click()

  expect(errors).toEqual([])
})

test('import flow: sample CSV, malformed CSV, slice, colour modes', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Download sample CSV' })).toHaveAttribute(
    'href',
    '/sample-blocks.csv',
  )

  const fileInput = page.locator('input[type=file]')
  await fileInput.setInputFiles(SAMPLE_CSV)
  await expect
    .poll(async () => await page.getByTestId('stats-panel').innerText())
    .toContain('1,200')
  await expect(page.getByText('Loaded 1,200 blocks')).toBeVisible()

  await fileInput.setInputFiles(MALFORMED_CSV)
  await expect(page.getByText(/missing header: grade/i)).toBeVisible()

  // Re-import the good sample so later tool checks use a valid model.
  await fileInput.setInputFiles(SAMPLE_CSV)
  await expect
    .poll(async () => await page.getByTestId('stats-panel').innerText())
    .toContain('1,200')

  await page.getByRole('button', { name: 'Material', exact: true }).click()
  await page.getByRole('button', { name: 'Neutral', exact: true }).click()
  await page.getByRole('button', { name: 'Grade', exact: true }).click()

  await page.getByLabel('Enable clipping').check()
  const slice = page.locator('input[type=range]').nth(3)
  await slice.evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    setter?.call(el, '40')
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.getByLabel('Enable clipping')).toBeChecked()

  expect(errors).toEqual([])
})

test('polygon flow: example polygon, drag to move, drag to place', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByTestId('metrics-panel')).toBeVisible()

  const cameraBefore = await page.evaluate(() =>
    (
      window as unknown as {
        __diglineViewer: { camera: { position: { toArray(): number[] } } }
      }
    ).__diglineViewer.camera.position.toArray(),
  )
  const metricsBefore = await page.getByTestId('metrics-panel').innerText()

  // Drag the whole polygon from its interior. The camera must not orbit.
  const box = await canvasBox(page)
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.58, box.y + box.height * 0.5, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(500)

  expect(await page.getByTestId('metrics-panel').innerText()).not.toBe(metricsBefore)
  const cameraAfter = await page.evaluate(() =>
    (
      window as unknown as {
        __diglineViewer: { camera: { position: { toArray(): number[] } } }
      }
    ).__diglineViewer.camera.position.toArray(),
  )
  expect(cameraAfter).toEqual(cameraBefore)

  // Drag-to-place: press, move, release should leave one vertex at the release point.
  await page.getByRole('button', { name: 'Draw polygon' }).click()
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.45, { steps: 10 })
  await page.mouse.up()
  await expect(page.getByTestId('toolbar')).toContainText('1 point placed')

  // The example button restores a closed demo polygon.
  await page.getByRole('button', { name: 'Load example polygon' }).click()
  await expect(page.getByTestId('metrics-panel')).toBeVisible()

  expect(errors).toEqual([])
})

test('scrub flow: dragging the scrubber updates the 3D view and metrics', async ({ page }) => {
  await page.goto('/')
  const canvasBefore = await page.locator('canvas').screenshot()
  const metricsBefore = await page.getByTestId('metrics-panel').innerText()

  const scrub = page.locator('input[type=range]').nth(1)
  await scrub.evaluate((element) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, '1')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const store = (window as unknown as { __diglineStore: { getState(): { t: number } } })
          .__diglineStore
        return store.getState().t
      }),
    )
    .toBe(1)
  await page.waitForTimeout(600)

  expect(await page.getByTestId('metrics-panel').innerText()).not.toBe(metricsBefore)
  const canvasAfter = await page.locator('canvas').screenshot()
  expect(Buffer.compare(canvasBefore, canvasAfter)).not.toBe(0)
})

test('showpiece flow: field arrows, calibration and a 100k model', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await page.getByLabel('Show field arrows').check()
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const arrows = (
          window as unknown as {
            __diglineViewer: {
              scene: { children: Array<{ name: string; visible: boolean; count?: number }> }
            }
          }
        ).__diglineViewer.scene.children.find((child) => child.name === 'field-arrows')
        return arrows ? arrows.visible && (arrows.count ?? 0) > 0 : false
      }),
    )
    .toBe(true)

  const state = (): Promise<{
    maxThrow: number
    decay: number
    sigma: number
    calibration: unknown
  }> =>
    page.evaluate(() => {
      const store = (
        window as unknown as {
          __diglineStore: {
            getState(): {
              maxThrow: number
              decay: number
              sigma: number
              calibration: unknown
            }
          }
        }
      ).__diglineStore
      const current = store.getState()
      return {
        maxThrow: current.maxThrow,
        decay: current.decay,
        sigma: current.sigma,
        calibration: current.calibration,
      }
    })

  const before = await state()
  await page.getByRole('button', { name: 'Calibrate field' }).click()
  await expect.poll(async () => (await state()).calibration !== null).toBe(true)
  const after = await state()
  expect(after.maxThrow).not.toBe(before.maxThrow)
  expect(after.decay).not.toBe(before.decay)
  expect(after.sigma).not.toBe(before.sigma)
  await expect(page.getByTestId('stats-panel')).toContainText('RMS')

  await page.getByLabel('Bench size').selectOption('100k')
  await expect
    .poll(async () => (await page.getByTestId('stats-panel').innerText()).includes('100,000'))
    .toBe(true)

  expect(errors).toEqual([])
})

import { expect, test } from '@playwright/test'

test('boots, draws a polygon, scrubs the blast and toggles uncertainty', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="toolbar"]')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()

  const hasWebGL = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return false
    return Boolean(canvas.getContext('webgl2'))
  })
  expect(hasWebGL).toBe(true)

  await page.getByRole('button', { name: 'Draw polygon' }).click()
  const box = await page.locator('canvas').boundingBox()
  expect(box).not.toBeNull()
  if (!box) return

  const points: Array<[number, number]> = [
    [0.42, 0.42],
    [0.58, 0.42],
    [0.6, 0.58],
    [0.4, 0.58],
  ]
  for (const [fx, fy] of points) {
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy)
  }

  await page.getByRole('button', { name: 'Close polygon' }).click()
  await expect(page.locator('[data-testid="metrics-panel"]')).toBeVisible()

  const before = await page.screenshot()

  await page.getByRole('button', { name: 'Play blast' }).click()
  await expect
    .poll(
      async () => {
        const text = await page.locator('[data-testid="toolbar"]').innerText()
        return text.includes('t = 1.00')
      },
      { timeout: 60_000 },
    )
    .toBe(true)

  const after = await page.screenshot()
  expect(Buffer.compare(before, after)).not.toBe(0)

  await page.getByRole('switch', { name: /uncertainty/i }).click()
  await expect(page.getByRole('switch', { name: /uncertainty/i })).toBeChecked()
})

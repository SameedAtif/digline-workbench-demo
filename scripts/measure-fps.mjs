import { chromium } from '@playwright/test'

const SIZES = [
  { label: '100k', nx: 100, ny: 10, nz: 100 },
  { label: '250k', nx: 100, ny: 25, nz: 100 },
  { label: '500k', nx: 100, ny: 50, nz: 100 },
]

// Headed Chrome by default so measurements use the real GPU. Set PW_HEADLESS=1
// on a machine without a display; software rendering is much slower.
const headed = process.env.PW_HEADLESS !== '1'
const browser = await chromium.launch({
  channel: 'chrome',
  headless: !headed,
  args: ['--disable-frame-rate-limit', '--disable-gpu-vsync'],
})

console.log('| Blocks | Mean FPS | p95 frame (ms) |')
console.log('|---|---|---|')

for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://localhost:5173/?seed=1&nx=${size.nx}&ny=${size.ny}&nz=${size.nz}`, {
    waitUntil: 'load',
    timeout: 60_000,
  })
  await page.waitForSelector('canvas', { timeout: 60_000 })
  await page.waitForTimeout(2500)

  const result = await page.evaluate(async () => {
    const frames = []
    let last = performance.now()
    const start = last
    await new Promise((resolve) => {
      const tick = (now) => {
        frames.push(now - last)
        last = now
        if (now - start >= 5000) resolve(undefined)
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    const sorted = [...frames].sort((a, b) => a - b)
    const mean = frames.reduce((sum, value) => sum + value, 0) / frames.length
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
    return { fps: 1000 / mean, p95, frames: frames.length }
  })

  const blocks = size.nx * size.ny * size.nz
  console.log(
    `| ${blocks.toLocaleString()} | ${result.fps.toFixed(1)} | ${result.p95.toFixed(2)} |`,
  )
  await page.close()
}

await browser.close()

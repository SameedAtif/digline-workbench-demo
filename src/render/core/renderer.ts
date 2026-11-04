import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three'

export interface RendererOptions {
  canvas: HTMLCanvasElement
  antialias?: boolean
  pixelRatio?: number
}

export function createRenderer(options: RendererOptions): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas: options.canvas,
    antialias: options.antialias ?? true,
    powerPreference: 'high-performance',
  })

  const dpr = options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.localClippingEnabled = true
  renderer.setClearColor(0x0b0d10, 1)

  return renderer
}

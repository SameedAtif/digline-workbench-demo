/// <reference types="vite/client" />

declare module '*.glsl' {
  const source: string
  export default source
}

declare module '*?worker' {
  const workerConstructor: new () => Worker
  export default workerConstructor
}

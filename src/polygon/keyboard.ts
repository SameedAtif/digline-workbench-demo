import { useAppStore } from '@/state'

export interface KeyboardShortcuts {
  dispose(): void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** Window-level undo/redo and cancel shortcuts. Returns a disposer. */
export function createKeyboardShortcuts(target: Window = window): KeyboardShortcuts {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target)) return
    const store = useAppStore.getState()
    const mod = event.metaKey || event.ctrlKey

    if (mod && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) store.redo()
      else store.undo()
      return
    }

    if (event.key === 'Escape') {
      store.cancel()
    }
  }

  target.addEventListener('keydown', onKeyDown)
  return {
    dispose: () => target.removeEventListener('keydown', onKeyDown),
  }
}

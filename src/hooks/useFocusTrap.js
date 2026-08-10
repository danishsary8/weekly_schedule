import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap(containerRef, active, { onEscape, returnFocusRef } = {}) {
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    if (!active) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && escapeRef.current) {
        event.preventDefault()
        event.stopPropagation()
        escapeRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = [...(containerRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
        .filter((node) => node.getClientRects().length > 0)
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      returnFocusRef?.current?.focus()
    }
  }, [active, containerRef, returnFocusRef])
}

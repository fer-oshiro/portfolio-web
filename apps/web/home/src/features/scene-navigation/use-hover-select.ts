import { useEffect, useRef, type RefObject } from 'react'

import { remoteControlStore } from '../remote-control'
import { isInsideRect, stepHoverProgress } from './hover-select'

const FILL_COLOR = 'rgba(0, 0, 0, 0.18)'
// A hidden tab pauses requestAnimationFrame; the first frame back must not
// count the whole pause as hover time.
const MAX_FRAME_SECONDS = 0.1

// Selects a DOM element by hovering it, like the room hotspots. The phone
// cursor is virtual and never produces DOM pointer events, so it is hit-tested
// against the element on every frame alongside the real mouse.
export function useHoverSelect(
  ref: RefObject<HTMLElement | null>,
  onSelect: () => void,
  enabled: boolean,
) {
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onSelectRef.current = onSelect
  })

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return

    let mouseInside = false
    let progress = 0
    let selected = false
    let lastTime: number | null = null
    let frame = 0

    // On touch the click already selects.
    const handleEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') mouseInside = true
    }
    const handleLeave = () => {
      mouseInside = false
    }

    const tick = (time: number) => {
      const deltaSeconds =
        lastTime === null
          ? 0
          : Math.min((time - lastTime) / 1000, MAX_FRAME_SECONDS)
      lastTime = time

      const remote = remoteControlStore.getState()
      const hovering =
        mouseInside ||
        (remote.connected &&
          isInsideRect(remote.cursorPosition, element.getBoundingClientRect()))

      progress = stepHoverProgress(progress, hovering, deltaSeconds)
      // Fires once per hover so the pending transition is not re-requested.
      if (!hovering) selected = false
      if (progress === 1 && !selected) {
        selected = true
        onSelectRef.current()
      }

      const percent = progress * 100
      element.style.backgroundImage =
        progress > 0
          ? `linear-gradient(to right, ${FILL_COLOR} ${percent}%, transparent ${percent}%)`
          : ''

      frame = requestAnimationFrame(tick)
    }

    element.addEventListener('pointerenter', handleEnter)
    element.addEventListener('pointerleave', handleLeave)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('pointerenter', handleEnter)
      element.removeEventListener('pointerleave', handleLeave)
      element.style.backgroundImage = ''
    }
  }, [enabled, ref])
}

// Hover selection shared by the room hotspots and the back buttons: holding
// the pointer fills the progress and leaving drains it at the same rate.
export const HOVER_SELECT_SECONDS = 1.2

export function stepHoverProgress(
  progress: number,
  hovering: boolean,
  deltaSeconds: number,
) {
  const step = deltaSeconds / HOVER_SELECT_SECONDS

  return hovering ? Math.min(progress + step, 1) : Math.max(progress - step, 0)
}

export type HoverPoint = {
  x: number
  y: number
}

export type HoverRect = {
  left: number
  top: number
  right: number
  bottom: number
}

export function isInsideRect(point: HoverPoint, rect: HoverRect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  )
}

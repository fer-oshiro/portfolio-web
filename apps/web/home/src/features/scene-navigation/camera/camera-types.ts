export type CameraVector = readonly [number, number, number]

export type CameraPose = {
  coord: CameraVector
  target: CameraVector
}

export type CameraCoords = 'default' | 'pc' | 'board' | 'draw' | 'cat'
export type CameraFocus = 'intro' | CameraCoords
export type CameraViewport = 'mobile' | 'desktop'

export type CameraModelState = {
  focus: CameraFocus
  hover: CameraCoords
  viewport: CameraViewport
}

export type CameraModelEvent =
  | { type: 'focusChanged'; focus: CameraCoords }
  | { type: 'hoverChanged'; hover: CameraCoords }
  | { type: 'viewportChanged'; viewport: CameraViewport }

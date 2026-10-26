import { Component, type PropsWithChildren } from 'react'

import type { Scene } from '../navigation-types'
import { reportSceneFailure } from '../scene-failure'

type SceneErrorBoundaryProps = PropsWithChildren<{
  scene: Scene
  onFailed?: (scene: Scene) => void
}>

export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  // Covers render and asset errors; chunk failures are reported from the
  // registry status. A failed preload stays silent and the next navigation
  // retries it.
  componentDidCatch() {
    const { scene, onFailed } = this.props

    if (reportSceneFailure(scene)) onFailed?.(scene)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

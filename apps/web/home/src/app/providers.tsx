import type { PropsWithChildren } from 'react'

import { RealtimeProvider } from '../features/remote-control'
import { SceneController } from '../features/scene-navigation'

export function HomeProviders({ children }: PropsWithChildren) {
  return (
    <RealtimeProvider>
      <SceneController>{children}</SceneController>
    </RealtimeProvider>
  )
}

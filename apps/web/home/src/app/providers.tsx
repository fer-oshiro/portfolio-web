import type { PropsWithChildren } from 'react'

import { RealtimeProvider } from '../features/remote-control'

export function HomeProviders({ children }: PropsWithChildren) {
  return <RealtimeProvider>{children}</RealtimeProvider>
}

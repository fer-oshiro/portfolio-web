import type { PropsWithChildren } from 'react'

import { RealtimeProvider } from '../service/RealtimeProvider'

export function HomeProviders({ children }: PropsWithChildren) {
  return <RealtimeProvider>{children}</RealtimeProvider>
}

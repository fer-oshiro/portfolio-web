import { createContext, PropsWithChildren, useContext } from 'react'

import { RealtimeClient } from './realtime-client'

const RealtimeContext = createContext<RealtimeClient | null>(null)
// Temporary bridge for consumers that still use the public hooks outside the
// provider tree. Remove it only after every consumer has migrated to Context.
const compatibilityRealtimeClient = new RealtimeClient()

type RealtimeContextProviderProps = PropsWithChildren<{
  client: RealtimeClient
}>

export const RealtimeContextProvider = ({
  children,
  client,
}: RealtimeContextProviderProps) => (
  <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>
)

export const useRealtimeClient = () => {
  const client = useContext(RealtimeContext)

  return client ?? compatibilityRealtimeClient
}

export const getCompatibilityRealtimeClient = () => compatibilityRealtimeClient

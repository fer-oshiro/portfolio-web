import { createContext, PropsWithChildren, useContext } from 'react'

import { RealtimeClient } from './realtime-client'

const RealtimeContext = createContext<RealtimeClient | null>(null)

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

  if (!client) {
    throw new Error('useRealtime deve ser usado dentro de RealtimeProvider')
  }

  return client
}

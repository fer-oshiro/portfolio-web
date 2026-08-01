import { StateCreator } from 'zustand'
import { MyStore } from '../../store'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Location = 'room' | 'draw' | 'cat'

export interface LocationState {
  location: Location
  setLocation: (location: Location, time?: number) => Promise<void>
}

export const createLocationSlice: StateCreator<
  MyStore,
  [],
  [],
  LocationState
> = (set, get) => ({
  location: 'room',
  setLocation: async (location, time = 1000) => {
    const { setCamera } = get()
    if (time > 0) await wait(time)
    set({ location })
    if (location == 'room') {
      await wait(2500)
      setCamera('default')
    }
  },
})

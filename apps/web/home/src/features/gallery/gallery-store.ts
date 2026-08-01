import { createStore } from 'zustand/vanilla'

export interface GalleryStore {
  drawingsReady: boolean
  setDrawingsReady: (drawingsReady: boolean) => void
}

export const createGalleryStore = () =>
  createStore<GalleryStore>()((set) => ({
    drawingsReady: false,
    setDrawingsReady: (drawingsReady) => set({ drawingsReady }),
  }))

export const galleryStore = createGalleryStore()

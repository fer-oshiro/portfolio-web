import { describe, expect, it, vi } from 'vitest'

import { createGalleryStore } from './features/gallery/gallery-store'
import { createRemoteControlStore } from './features/remote-control/remote-control-store'
import { createCameraStore } from './features/scene-navigation/camera/camera-store'

describe('store boundaries', () => {
  it('isola atualizações de alta frequência no domínio de controle remoto', () => {
    const camera = createCameraStore()
    const gallery = createGalleryStore()
    const remoteControl = createRemoteControlStore()
    const cameraListener = vi.fn()
    const galleryListener = vi.fn()
    const remoteControlListener = vi.fn()

    camera.subscribe(cameraListener)
    gallery.subscribe(galleryListener)
    remoteControl.subscribe(remoteControlListener)

    remoteControl.getState().setCursorPosition({ x: 10, y: 20 })

    expect(remoteControlListener).toHaveBeenCalledOnce()
    expect(cameraListener).not.toHaveBeenCalled()
    expect(galleryListener).not.toHaveBeenCalled()
  })

  it('mantém câmera e prontidão da galeria em domínios independentes', () => {
    const camera = createCameraStore()
    const gallery = createGalleryStore()
    const remoteControl = createRemoteControlStore()
    const cameraListener = vi.fn()
    const galleryListener = vi.fn()
    const remoteControlListener = vi.fn()

    camera.subscribe(cameraListener)
    gallery.subscribe(galleryListener)
    remoteControl.subscribe(remoteControlListener)

    camera.getState().setCamera('pc')

    expect(cameraListener).toHaveBeenCalledOnce()
    expect(galleryListener).not.toHaveBeenCalled()
    expect(remoteControlListener).not.toHaveBeenCalled()

    gallery.getState().setDrawingsReady(true)

    expect(cameraListener).toHaveBeenCalledOnce()
    expect(galleryListener).toHaveBeenCalledOnce()
    expect(remoteControlListener).not.toHaveBeenCalled()
  })
})

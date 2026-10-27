import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useStore } from 'zustand'
import { cameraStore } from '../camera/camera-store'
import { useSceneController } from '../scene-controller'

export const CameraToDefault = () => {
  const focus = useStore(cameraStore, (state) => state.focus)
  const { resetCamera } = useSceneController()
  const isFocused = ['pc', 'board'].includes(focus)

  useEffect(() => {
    if (!isFocused) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') resetCamera()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocused, resetCamera])

  return (
    <AnimatePresence mode="wait">
      {isFocused && (
        <motion.div
          style={{
            position: 'fixed',
            top: '40px',
            width: '100px',
            height: '40px',
            backgroundColor: '#e6b092',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 99999,
          }}
          initial={{ left: '-80px' }}
          animate={{ left: '40px' }}
          exit={{ left: '-100px' }}
        >
          <button
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
            }}
            onClick={resetCamera}
          >
            Voltar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

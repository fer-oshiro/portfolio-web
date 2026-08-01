import { AnimatePresence, motion } from 'motion/react'
import { useStore } from 'zustand'
import { cameraStore } from '../camera/camera-store'
import { useSceneController } from '../scene-controller'

export const CameraToDefault = () => {
  const focus = useStore(cameraStore, (state) => state.focus)
  const { resetCamera } = useSceneController()

  return (
    <AnimatePresence mode="wait">
      {['pc', 'board'].includes(focus) && (
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

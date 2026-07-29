import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'

export const CameraToDefault = () => {
  const { focus, setCamera } = useStore()
  console.log(focus)
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
            onClick={() => setCamera('default')}
          >
            Voltar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

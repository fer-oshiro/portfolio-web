import { motion } from 'motion/react'

export const Transition = ({}) => {
  return (
    <div>
      <motion.div
        className="slide-in"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#0f0f0f',
          transformOrigin: 'top',
          zIndex: 9999,
        }}
      />

      <motion.div
        className="slide-out"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#0f0f0f',
          transformOrigin: 'bottom',
          zIndex: 9999,
        }}
      />
    </div>
  )
}

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect } from 'react'
import { useStore } from 'zustand'

import { remoteControlStore } from '../remote-control-store'

import './RemoteCursor.css'

const sparkles = [
  { cx: 80, cy: -20, r: 3, delay: 0, initial: '#ffd1c3' },
  { cx: 120, cy: 100, r: 5, delay: 0.3, initial: '#E4FFFC' },
  { cx: 20, cy: 100, r: 6, delay: 0.6, initial: '#FFFFDD' },
  { cx: -20, cy: 30, r: 5, delay: 0.9, initial: '#ffd1c3' },
]

export const Cursor = () => {
  const cursorPosition = useStore(
    remoteControlStore,
    (state) => state.cursorPosition,
  )
  const { x, y } = cursorPosition

  console.log('cursor', x, y)

  const motionX = useMotionValue(x)
  const motionY = useMotionValue(y)

  const springX = useSpring(motionX, { stiffness: 200, damping: 25 })
  const springY = useSpring(motionY, { stiffness: 200, damping: 25 })

  useEffect(() => {
    motionX.set(x)
    motionY.set(y)
  }, [x, y])

  return (
    <motion.svg
      className="shape"
      style={{
        position: 'fixed',
        left: springX,
        top: springY,
        translate: '-50% -50%',
        pointerEvents: 'none',
        zIndex: 999,
        filter: 'blur(1px)',
      }}
      animate={{ rotate: -360, scale: [1, 1.2, 1] }}
      transition={{
        rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
        scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      }}
      width="30"
      height="30"
      viewBox="-30 -30 160 160"
    >
      {sparkles.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          style={{ filter: 'blur(2px)' }}
          initial={{ fill: s.initial }}
          animate={{
            scale: [0.8, 1.4, 0.8],
            opacity: [0.3, 1, 0.3],
            fill: ['#ffd1c3', '#E4FFFC', '#FFFFDD', '#ffd1c3'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: s.delay,
          }}
        />
      ))}
      <defs>
        <linearGradient id="header-shape-gradient" x2="0.35" y2="1">
          <stop offset="20%" stop-color="var(--color-pink)" />
          <stop offset="70%" stop-color="var(--color-blue)" />
          <stop offset="100%" stop-color="var(--color-yellow)" />
        </linearGradient>
      </defs>
      <motion.polygon
        animate={{ rotate: 360, scale: [1, 1.4, 1] }}
        transition={{
          rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="gradient-bg"
        points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35"
      />
    </motion.svg>
  )
}

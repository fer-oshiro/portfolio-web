import { animate, motion, useMotionValue } from 'motion/react'

import { useStore } from '../../../store'
import './Transition.css'
import { ComponentProps, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

const brushVariant = {
  animate: {
    pathLength: [0, 1, 1, 0],
    strokeWidth: [0, 120, 120, 0],
  },
  initial: {
    pathLength: 0,
    strokeWidth: 0,
  },
}

const d1 =
  'M53.7183 30.0664C22.2812 55.0475 7.52971 68.9601 18.7183 92.5664C53.7183 108.456 75.0002 80.8146 123 49.4564C173.047 16.7613 201 1.45634 232.5 30.0664C250.5 76.4563 180.93 123.461 132 136.066C10.8044 182.088 20.6423 185.967 18.7183 219.566C62.3911 259.673 109.01 220.809 192.218 173.066C240.218 145.526 273.125 109.456 297.218 136.066C321.311 162.677 286 196.859 207 230.456C102.553 274.876 89.908 308.015 94.7183 339.066C119.372 357.748 134.854 341.36 207 297.956C257.954 258.152 300.021 246.801 342.218 266.066C358.476 287.091 372.5 297.956 330.718 315.566L253 339.066'

const d2 =
  'M29.1266 258.619C43.6981 291.205 57.4799 311.636 79.1266 301.619C95.1119 282.965 74.7916 255.528 44.6266 210.119C15.0151 158.127 8.11574 138.006 21.6266 126.119C49.9255 112.891 65.6363 144.522 93.6266 210.119C144.569 318.557 157.812 311.371 182.127 301.619C220.548 276.192 192.16 235.543 142.627 163.619C65.4593 64.7793 67.0826 43.2223 93.6266 22.6193C110.242 15.0705 138.489 -14.0939 196.627 126.119C254.765 266.333 304.609 290.143 311.127 277.119C334.352 265.613 293.127 147.619 293.127 147.619C293.127 147.619 245.253 21.9114 256.127 17.6193C267 13.3273 276.32 12.5089 306.627 49.6193'

const cat =
  'M481.875,299.344L512,292.219l-4.656-19.641l-24.25,5.734c0-0.328,0.016-0.641,0.016-0.969 c0-38.078-10.531-72.781-28.969-102.359c15.438-53.938-13.438-124.547-13.438-124.547S387.813,73,357.719,100.297 C327.109,91.063,292.578,88.094,256,88.094c-36.766,0-71.484,2.563-102.203,11.781c-30.156-27.109-82.5-49.438-82.5-49.438 S42.406,121.063,57.859,175c-18.422,29.578-28.984,64.281-28.984,102.344c0,0.328,0.031,0.641,0.031,0.969l-24.25-5.734L0,292.219l30.109,7.125c2.672,23.578,9.672,44.75,20.234,63.422L12.875,377.75l7.484,18.75l41.203-16.484 		c39.797,53.141,111.969,81.547,194.438,81.547c82.453,0,154.641-28.406,194.438-81.547l41.203,16.484l7.484-18.75l-37.469-14.984 C472.219,344.094,479.219,322.922,481.875,299.344z'

type BrushPathProps = ComponentProps<typeof motion.path> & {
  variant: 1 | 2
}

const BrushPath = ({ variant, ...props }: BrushPathProps) => {
  const { transition, setTransition } = useStore()
  const d = variant === 1 ? d1 : d2
  return (
    <motion.path
      d={d}
      stroke={`var(--transition-stroke-${variant})`}
      stroke-linecap="round"
      variants={brushVariant}
      initial="initial"
      animate={transition === 'brush' ? 'animate' : 'initial'}
      transition={{
        duration: 6,
      }}
      onAnimationComplete={() => setTransition('none')}
      {...props}
    />
  )
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const Transition = () => {
  const { status, setCamera } = useStore()
  const { progress } = useProgress()
  const opacity = useMotionValue(1)

  useEffect(() => {
    if (progress === 100 && status === 'ready') {
      wait(1000).then(() => {
        setCamera('default')
        animate(opacity, 0, { duration: 5 })
      })
    }
  }, [progress, status])

  return (
    <>
      <motion.div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          backgroundColor: '#603e33',
          zIndex: 9,
          pointerEvents: 'none',
          opacity,
        }}
      />
      <CatTransition />
      <div className="transition-svg">
        <svg
          width="374"
          height="362"
          viewBox="0 0 374 362"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <BrushPath variant={1} />
          <BrushPath variant={2} />
        </svg>
      </div>
    </>
  )
}

const CatTransition = () => {
  const { transition, setTransition } = useStore()
  return (
    <div className="transition-svg">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 625 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d={cat}
          fill="black"
          stroke="black"
          initial={{ scale: 0 }}
          animate={{
            scale: transition === 'cat' ? [0, 2, 2, 0] : 0,
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
          onAnimationComplete={() => setTransition('none')}
        />
      </svg>
    </div>
  )
}

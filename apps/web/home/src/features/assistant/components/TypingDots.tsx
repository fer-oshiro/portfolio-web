import { motion } from 'motion/react'

import './AssistantWindow.css'

export const TypingDots = () => {
  return (
    <div
      className="bubble-container"
      style={{ marginTop: 'auto', marginBottom: '-5px' }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          height: 16,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: '#555',
              display: 'block',
            }}
          />
        ))}
      </div>
    </div>
  )
}

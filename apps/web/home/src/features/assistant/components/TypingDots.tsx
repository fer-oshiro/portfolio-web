import { motion } from 'motion/react'

import './AssistantWindow.css'

export const TypingDots = () => {
  return (
    <div className="bubble-container typing-dots">
      <div className="typing-dots__list">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="typing-dots__dot"
          />
        ))}
      </div>
    </div>
  )
}

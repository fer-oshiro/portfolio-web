import { forwardRef } from 'react'
import { css } from 'styled-system/css'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={css({
          bg: 'blue.500',
          _hover: {
            cursor: 'pointer',
          },
        })}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

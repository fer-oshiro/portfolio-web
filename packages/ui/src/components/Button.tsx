import { ark, type HTMLArkProps } from '@ark-ui/react/factory'
import { forwardRef } from 'react'

export type ButtonProps = HTMLArkProps<'button'>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <ark.button
        ref={ref}
        className={['bg-blue-500 hover:cursor-pointer', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </ark.button>
    )
  },
)

Button.displayName = 'Button'

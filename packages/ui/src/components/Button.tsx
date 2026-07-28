import { ark, type HTMLArkProps } from '@ark-ui/react/factory'
import { forwardRef } from 'react'

export type ButtonProps = HTMLArkProps<'button'>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <ark.button
        ref={ref}
        className={[
          'rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white transition-colors hover:cursor-pointer hover:bg-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
          className,
        ]
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

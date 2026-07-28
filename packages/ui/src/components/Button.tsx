import { ark, type HTMLArkProps } from '@ark-ui/react/factory'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '../utils/cn'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-rose-500 text-white hover:bg-rose-400 focus-visible:outline-rose-500',
        secondary:
          'bg-magic-light text-background hover:bg-magic-glow focus-visible:outline-magic-glow',
        ghost:
          'bg-transparent text-rose-500 hover:bg-rose-100 focus-visible:outline-rose-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonProps = HTMLArkProps<'button'> &
  VariantProps<typeof buttonVariants>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant, size, ...props }, ref) => {
    return (
      <ark.button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </ark.button>
    )
  },
)

Button.displayName = 'Button'

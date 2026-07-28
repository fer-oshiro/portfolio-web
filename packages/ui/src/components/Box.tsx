import { ark, type HTMLArkProps } from '@ark-ui/react/factory'
import { forwardRef } from 'react'

export type BoxProps = HTMLArkProps<'div'>

export const Box = forwardRef<HTMLDivElement, BoxProps>((props, ref) => (
  <ark.div ref={ref} {...props} />
))

Box.displayName = 'Box'

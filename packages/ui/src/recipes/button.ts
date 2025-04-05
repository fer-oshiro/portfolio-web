import { defineRecipe } from '@pandacss/dev'

export const button = defineRecipe({
  className: 'button',
  base: {
    fontWeight: 'semibold',
    borderRadius: 'md',
    px: '4',
    py: '2',
    transition: 'all 0.2s',
  },
  variants: {
    variant: {
      primary: {
        bg: 'brand',
        color: 'white',
        _hover: { bg: 'blue.600' },
      },
      secondary: {
        bg: 'gray.100',
        color: 'gray.800',
        _hover: { bg: 'gray.200' },
      }
    }
  },
  defaultVariants: {
    variant: 'primary'
  }
})

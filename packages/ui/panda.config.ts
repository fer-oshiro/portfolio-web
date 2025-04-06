import { defineConfig } from '@pandacss/dev'
import { colors } from './src/tokens/colors'

export default defineConfig({
  preflight: true,
  outExtension: 'js',
  jsxFramework: 'react',

  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  exclude: [],

  theme: {
    extend: {
      tokens: {
        colors,
      },
    },
  },

  outdir: 'styled-system',
})

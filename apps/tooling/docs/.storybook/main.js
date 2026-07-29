
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const getAbsolutePath = (packageName) =>
  dirname(require.resolve(join(packageName, 'package.json')))

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/*/**/*.mdx',
    '../src/*/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
}

export default config

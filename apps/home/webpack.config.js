const HtmlWebPackPlugin = require('html-webpack-plugin')
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')
const Dotenv = require('dotenv-webpack')
const path = require('path')
const deps = require('./package.json').dependencies
const {
  '@charmbyte/ui': ____,
  'qrcode.react': _,
  'react-use-websocket': __,
  zustand: ___,
  ...sharedDeps
} = deps

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production'

  return {
    output: {
      publicPath: isProd ? 'https://fer-oshiro.com/home/' : 'auto',
      clean: true,
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      alias: {
        '@charmbyte/ui$': path.resolve(
          __dirname,
          '../../packages/ui/src/index.tsx',
        ),
        '@charmbyte/ui/styles.css$': path.resolve(
          __dirname,
          '../../packages/ui/src/styles.css',
        ),
      },
    },

    devServer: {
      port: 3001,
      historyApiFallback: true,
      allowedHosts: 'all',
      hot: true,
      watchFiles: ['src/**/*'],
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept, Range',
      },
      proxy: [
        {
          context: ['/gallery'],
          target: 'https://fer-oshiro.com',
          changeOrigin: true,
          secure: false, // útil se o certificado SSL da origem for inválido em staging
        },
      ],
    },

    module: {
      rules: [
        {
          test: /\.m?js/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
        { test: /\.(glb|gltf|bin|png|mp3)$/i, type: 'asset/resource' },
        {
          test: /\.(css|s[ac]ss)$/i,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: {
                    '@tailwindcss/postcss': {},
                  },
                },
              },
            },
          ],
        },
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic', // React 17+ JSX transform
                  },
                },
              },
            },
          },
        },
      ],
    },

    plugins: [
      new ModuleFederationPlugin({
        name: 'home',
        filename: 'remoteEntry.js',
        exposes: {
          './Home': './src/Home',
        },
        shared: {
          ...sharedDeps,
          react: {
            singleton: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
          },
        },
      }),
      new HtmlWebPackPlugin({
        template: './src/index.html',
      }),
      new Dotenv({
        silent: true,
      }),
    ],
    ignoreWarnings: [
      {
        module: /node_modules\/(motion|framer-motion|@react-three)/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ],
  }
}

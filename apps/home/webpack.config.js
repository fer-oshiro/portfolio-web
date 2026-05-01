const HtmlWebPackPlugin = require('html-webpack-plugin')
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')
const Dotenv = require('dotenv-webpack')
const deps = require('./package.json').dependencies
const {
  'qrcode.react': _,
  'react-use-websocket': __,
  zustand: ___,
  ...sharedDeps
} = deps
const address = require('address')
const { DefinePlugin } = require('webpack')

const LAN_IP = address.ip()

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production'

  return {
    output: {
      publicPath: isProd
        ? 'https://dk341v3ghfif7.cloudfront.net/home/'
        : 'auto',
      clean: true,
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
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
          use: ['style-loader', 'css-loader'],
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

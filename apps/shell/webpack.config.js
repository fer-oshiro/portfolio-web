const HtmlWebPackPlugin = require('html-webpack-plugin')
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')
const Dotenv = require('dotenv-webpack')
const deps = require('./package.json').dependencies

const address = require('address')
const LAN_IP = address.ip()
console.log({ LAN_IP })
const CDN_BASE = 'https://dk341v3ghfif7.cloudfront.net'

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production'

  return {
    mode: isProd ? 'production' : 'development',
    output: {
      publicPath: isProd ? `${CDN_BASE}/shell/` : `http://${LAN_IP}:3000/`,
      clean: true,
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },

    devServer: {
      port: 3000,
      historyApiFallback: true,
      allowedHosts: 'all',
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
        { test: /\.(glb|gltf|bin)$/i, type: 'asset/resource' },
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
        name: 'shell',
        filename: 'remoteEntry.js',
        remotes: {
          home: isProd
            ? 'home@https://dk341v3ghfif7.cloudfront.net/home/remoteEntry.js'
            : `home@http://${LAN_IP}:3001/remoteEntry.js`,
          blog: isProd
            ? 'blog@https://dk341v3ghfif7.cloudfront.net/blog/remoteEntry.js'
            : `blog@http://${LAN_IP}:3003/remoteEntry.js`,
          resume: isProd
            ? 'resume@https://dk341v3ghfif7.cloudfront.net/resume/remoteEntry.js'
            : `resume@http://${LAN_IP}:3002/remoteEntry.js`,
        },
        exposes: {},
        shared: {
          ...deps,
          react: {
            singleton: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
          },
          'react-router': {
            singleton: true,
            requiredVersion: deps['react-router'],
          },
        },
      }),
      new HtmlWebPackPlugin({
        template: './src/index.html',
      }),
      new Dotenv(),
    ],
  }
}

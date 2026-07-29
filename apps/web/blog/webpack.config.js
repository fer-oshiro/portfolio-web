const HtmlWebPackPlugin = require('html-webpack-plugin')
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')
const Dotenv = require('dotenv-webpack')
const deps = require('./package.json').dependencies
const os = require('os')
const getLocalIP = () => {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

const LAN_IP = getLocalIP()

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production'

  return {
    output: {
      publicPath: isProd
        ? 'https://fer-oshiro.com/blog/'
        : `http://${LAN_IP}:3003/`,
      clean: true,
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },

    devServer: {
      port: 3003,
      historyApiFallback: true,
      host: '0.0.0.0',
      hot: true,
      watchFiles: ['src/**/*'],
      allowedHosts: 'all',
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
        { test: /\.(glb|gltf|bin|png)$/i, type: 'asset/resource' },
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
        name: 'blog',
        filename: 'remoteEntry.js',
        remotes: {},
        exposes: {
          './Blog': './src/Blog',
        },
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
        },
      }),
      new HtmlWebPackPlugin({
        template: './src/index.html',
      }),
      new Dotenv({
        silent: true,
      }),
    ],
  }
}

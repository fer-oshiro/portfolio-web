const HtmlWebPackPlugin = require('html-webpack-plugin')
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')
const Dotenv = require('dotenv-webpack')
const deps = require('./package.json').dependencies

module.exports = (_, argv) => ({
  output: {
    publicPath: 'http://localhost:3003/',
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },

  devServer: {
    port: 3003,
    historyApiFallback: true,
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
    new Dotenv(),
  ],
})

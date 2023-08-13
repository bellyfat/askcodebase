const path = require('path')
const copy = require('copy-webpack-plugin')
const analyzer = require('webpack-bundle-analyzer')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

const isDev = process.env.NODE_ENV !== 'production'

module.exports = {
  entry: './src/client/index.tsx',
  mode: isDev ? 'development' : 'production',
  output: {
    path: path.resolve(__dirname, 'dist-client'),
    filename: 'vscode.js',
    clean: true,
    publicPath: 'http://localhost:3000/',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'node_modules'),
      '~': path.resolve(__dirname, 'src'),
    },
    fallback: {
      crypto: false,
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  stats: {
    errorDetails: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
              modules: {
                auto: true,
                localIdentName: '[local]_[hash:base64:5]',
              },
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
              modules: {
                auto: true,
                localIdentName: '[local]_[hash:base64:5]',
              },
            },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
    ],
  },
  plugins: [
    new copy({
      patterns: [{ from: 'public' }],
    }),
    isDev && new ReactRefreshWebpackPlugin(),
    // new analyzer.BundleAnalyzerPlugin(),
  ].filter(Boolean),
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    hot: true,
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
}

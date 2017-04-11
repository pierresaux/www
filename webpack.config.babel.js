import webpack from 'webpack'
import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import PrerenderSpaPlugin from 'prerender-spa-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import { names, prefix } from './src/blog/post-obj'

const paths = {
  src: path.resolve(__dirname, 'src'),
  build: path.resolve(__dirname, 'build'),
}

const plugins = [
  new ExtractTextPlugin('stylesheets/main.css'),
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    minChunks({ context }) {
      if (context) {
        return /node_modules/.test(context) &&
          /(react|redux)/.test(context) === false
      }
    }
  }),
  new HtmlWebpackPlugin({
    template: '!!pug-loader!src/templates/index.pug',
    inject: 'head',
    filename: 'index.html',
    title: 'loading...',
    hash: true,
  })
]

const productionPlugins = [
  new PrerenderSpaPlugin(paths.build, [
    '/',
    '/blogs',
    ...names.map(name => `${prefix}/${name}`)
  ]),
]

module.exports = function(env = {}) {
  const isProduction = !!env.production || process.env.NODE_ENV === 'production'

  return {
    entry: {
      main: path.resolve(paths.src, 'js/index.js'),
    },
    output: {
      filename: 'scripts/[name].js',
      publicPath: '/',
      path: paths.build
    },
    module: {
      rules: [
        {
          test: /src\/assets\/.*$/,
          loader: 'file-loader?limit=16384&context=src/assets&name=assets/[path][name].[ext]',
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              scss: 'vue-style-loader!css-loader!sass-loader',
            }
          }
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              'css-loader',
              'postcss-loader',
              'sass-loader'
            ]
          })
        },
        {
          test: /\.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
          loader: 'file-loader?name=fonts/[name].[ext]'
        },
        {
          test: /\.md$/,
          loader: 'raw-loader',
        },
        {
          test: /\.pug$/,
          loader: 'pug-loader',
        },
        { test: /\.json$/, loader: 'json-loader' }
      ]
    },
    plugins: isProduction ? [
      ...plugins,
      ...productionPlugins,
    ] : plugins,
    devtool: isProduction ? 'none' : 'source-map',
    devServer: {
      contentBase: paths.build,
      compress: true,
      historyApiFallback: true,
      host: process.env.HOST || 'localhost',
    }
  }
}

var HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: './src/js/main.js',
  output: {
    path: __dirname + '/build',
    publicPath: '',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(jpg|png|svg|ico|ttf|woff|woff2)$/,
        loader: 'url-loader'
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { importLoaders: 1 } },
          { loader: 'font-loader' },
          { loader: 'postcss-loader',
            options: {
              plugins: (loader) => [
                require('postcss-import')(),
                require('postcss-comment/hookRequire')(),
                require('postcss-simple-vars')(),
                require('postcss-nested')(),
                require('autoprefixer')({ remove: false })
              ]
            }
          }
        ]
      },
      {
        test: /\.html$/,
        loader: 'raw-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      favicon: './src/assets/favicon.ico',
    })
  ]
}
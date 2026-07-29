const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const _resolve = (_path) => path.resolve(__dirname, _path);

module.exports = {
  mode: 'development',
  target: ['web', 'es5'],
  entry: {
    index: _resolve('../examples/index.ts'),
  },
  output: {
    clean: true,
    filename: '[name].js',
    path: _resolve('../dist'),
  },
  devServer: {
    host: '127.0.0.1',
    static: {
      directory: _resolve('../dist'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: _resolve('../examples/index.html'),
      inject: true,
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

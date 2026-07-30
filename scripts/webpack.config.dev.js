const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const project = require('../project.config');

const resolveProject = (...parts) => path.resolve(__dirname, '..', ...parts);
const production = process.env.GITHUB_PAGES === 'true';
const publicPath = production ? project.site.basePath : '/';

function pageTemplate(page, jsonLd) {
  return {
    project,
    page,
    jsonLd: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
    publicPath,
    production,
  };
}

module.exports = {
  mode: production ? 'production' : 'development',
  target: ['web', 'es2018'],
  devtool: production ? 'source-map' : 'eval-cheap-module-source-map',
  entry: {
    shared: {
      import: resolveProject('site/shared.ts'),
    },
    home: {
      import: resolveProject('site/index.ts'),
      dependOn: 'shared',
    },
    playground: {
      import: resolveProject('examples/index.ts'),
      dependOn: 'shared',
    },
    api: {
      import: resolveProject('site/api.ts'),
    },
  },
  output: {
    clean: true,
    filename: 'assets/[name].js',
    path: resolveProject('dist-dev'),
    publicPath,
  },
  devServer: {
    host: '127.0.0.1',
    port: 8080,
    static: { directory: resolveProject('dist-dev') },
    historyApiFallback: {
      rewrites: [{ from: /^\/playground\/?$/, to: '/playground/index.html' }],
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: { configFile: resolveProject('tsconfig.site.json') },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(?:png|svg)$/,
        type: 'asset/resource',
        generator: { filename: 'images/[name][ext]' },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __SITE_RUNTIME_CONFIG__: JSON.stringify({
        installCommand: `npm install ${project.package.name}`,
        packageName: project.package.name,
        themeStorageKey: project.site.theme.storageKey,
        pwa: {
          appName: project.brand.displayName,
          enabled: production,
          serviceWorkerUrl: project.pwa.serviceWorkerUrl,
          scope: project.site.basePath,
        },
      }),
    }),
    new MiniCssExtractPlugin({
      filename: 'assets/[name].css',
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: resolveProject('site/index.html'),
      chunks: ['shared', 'home'],
      templateParameters: pageTemplate(
        project.site.pages.home,
        project.seo.rootJsonLd
      ),
    }),
    new HtmlWebpackPlugin({
      filename: 'playground/index.html',
      template: resolveProject('examples/index.html'),
      chunks: ['shared', 'playground'],
      templateParameters: pageTemplate(
        project.site.pages.playground,
        project.seo.playgroundJsonLd
      ),
    }),
  ],
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
};

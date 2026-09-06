import { DEFAULT_EXTENSIONS } from '@babel/core';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import rollupTypescript from 'rollup-plugin-typescript2';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const resolvePath = (relativePath) => path.resolve(__dirname, relativePath);
const pkg = require('../package.json');
const pkgName = pkg.name;
const pkgVersion =
  process.env.SCRIPTS_NPM_PACKAGE_VERSION || process.env.VERSION || pkg.version;
const banner =
  '/*!\n' +
  ` * ${pkgName} v${pkgVersion} https://www.npmjs.com/package/${pkgName}\n` +
  ` * (c) 2018-${new Date().getFullYear()} Cheng\n` +
  ' * Released under the MIT License.\n' +
  ' */';
const runtimeDependencies = ['mazey', 'jquery', 'js-sha1'];

const cleanLib = () => ({
  name: 'clean-lib',
  buildStart() {
    rmSync(resolvePath('../lib'), { recursive: true, force: true });
  },
});

const createPlugins = ({ bundleDependencies = false } = {}) => [
  rollupTypescript(),
  ...(bundleDependencies ? [nodeResolve()] : []),
  commonjs({
    include: /node_modules/,
  }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    extensions: [...DEFAULT_EXTENSIONS, '.ts'],
  }),
  terser({
    format: {
      comments: /^!\n\s\*\smazey-wechat-launch-app/,
    },
  }),
];

export default [
  {
    input: resolvePath('../src/index.ts'),
    output: [
      {
        file: resolvePath('../lib/index.cjs.js'),
        format: 'cjs',
        exports: 'auto',
        banner,
      },
      {
        file: resolvePath('../lib/index.esm.js'),
        format: 'esm',
        banner,
      },
    ],
    plugins: [cleanLib(), ...createPlugins()],
    external: (id) =>
      runtimeDependencies.includes(id) || id.startsWith('core-js/'),
  },
  {
    input: resolvePath('../src/index.ts'),
    output: {
      file: resolvePath('../lib/launch-app.min.js'),
      format: 'iife',
      name: 'LAUNCH_APP',
      banner,
    },
    plugins: createPlugins({ bundleDependencies: true }),
    external: [],
  },
];

# AGENTS.md

Guidance for contributors and automated coding agents working in this repository.

## Project Scope

`mazey-wechat-launch-app` is a browser-only TypeScript package that overlays WeChat's
`wx-open-launch-app` tag on matching page elements. It configures the WeChat JS-SDK, generates the
required signature, renders launch controls, exposes lifecycle helpers, and handles launch errors
or fallback navigation.

Keep changes focused on this checkout. The parent `/Users/cheng/web/npm` directory contains
independent repositories and is not a monorepo. Run Git and npm commands from this repository, and
preserve unrelated uncommitted work. Do not stage, commit, push, release, or publish unless the user
explicitly asks.

## Repository Map

- `src/index.ts`: the complete package implementation and default export. It owns option defaults,
  JS-SDK setup, signature generation, open-tag rendering, fallback UI, browser globals, and the
  public lifecycle methods.
- `typing.d.ts`: ambient browser and public return-value declarations used by the TypeScript build.
  Keep these declarations synchronized with public methods and `window.LAUNCH_APP_*` globals.
- `test/type.test.js`: Jest smoke test for the generated ESM entry. It imports from `lib`, so build
  before running the test in a fresh checkout.
- `examples/index.ts`: Webpack development entry. It currently logs a development message and does
  not exercise the package runtime.
- `examples/index.html`: HTML shell used by the Webpack development server.
- `scripts/rollup.config.mjs`: production package build for CommonJS, ESM, browser IIFE, and
  declarations.
- `scripts/webpack.config.dev.js`: local example build and development-server configuration.
- `scripts/release.js`: delegates Git release work to `mazey/scripts/git-helper.js` on `main`.
- `scripts/env.sh` and `.nvmrc`: select Node.js 22 through `nvm`.
- `.github/workflows/test.yml`: pull-request verification job on Node.js 22.
- `.github/workflows/publish.yml`: build, test, and npm publish workflow for every push to `main`.
- `README.md`: installation, CDN, runtime API, WeChat prerequisites, and contributor commands.
- `lib/` and `dist/`: ignored generated output. Never edit either directory by hand.

## Entry Points And Public Outputs

The source entry is the default factory exported from `src/index.ts`. Consumers receive one of
three generated entry points declared in `package.json`:

- `lib/index.cjs.js` through `main` for CommonJS.
- `lib/index.esm.js` through `module` for ESM.
- `lib/launch-app.min.js` through `unpkg` and `jsdelivr` as an IIFE named `LAUNCH_APP`.
- `lib/index.d.ts` through `typings` for TypeScript declarations.

Preserve the default-export API and these filenames unless a deliberate breaking change updates
the build config, package metadata, README examples, declarations, and tests together.

## Runtime Startup Flow

1. The host page loads the WeChat JS-SDK so `window.wx` exists, then imports the package or loads
   the IIFE bundle.
2. Calling `LAUNCH_APP(options)` merges the supplied values with module-level defaults, captures
   `window.wx`, prepares share defaults from `document.title` and `location.href`, installs
   `window.LAUNCH_APP_UPDATE`, `window.LAUNCH_APP_BEFORE_DESTROY`, and
   `window.LAUNCH_APP_SHOW_WEIXIN_TO_BROWSER`, and returns the lifecycle API.
3. Calling `start(data)` or `update(data)` runs the same `appUpdated` function. `canLaunchApp(data)`
   decides whether first-time WeChat initialization may proceed.
4. The ticket is selected in this order: `options.weixinJsSdkTicket`,
   `window.LAUNCH_APP_WEIXIN_JS_SDK_TICKET`, the `weixinJsSdkTicket` URL query parameter, then an
   empty string. The imported `js-sha1` function signs the ticket, nonce, timestamp, and current
   URL before the values are sent to `wx.config`.
5. In `wx.ready`, optional share settings are registered. If `openPlatformMobileAppId` is present,
   the code marks `window.LAUNCH_APP_READY`, calls `launchReady`, finds every element matching
   `launchContainerQuery`, and appends a `wx-open-launch-app` tag when one is not already present.
6. The generated tag emits `ready`, `launch`, `error`, and `click` events. Errors hide generated
   launch tags, may show the “open in browser” overlay, and may navigate to an element-specific or
   global error link. Clicks invoke `launchBtnClick`.
7. `destroy()` clears selected global lifecycle state. It does not remove generated DOM, styles,
   or event listeners; do not assume it is full DOM teardown.

The SDK is captured when the factory is called, not when `start()` is called. Tests or integrations
that mock the browser must create `window`, `document`, `location`, and `window.wx` first.

## Data Flow And Component Boundaries

- Factory options supply global defaults for account IDs, selector, tag appearance, callbacks,
  debug behavior, sharing, and fallback behavior.
- `start(data)` and `update(data)` pass application state only to `canLaunchApp(data)`; other runtime
  values come from the factory options, browser globals, URL, or matched DOM elements.
- A container's `data-launch-app-key` determines its generated CSS class and tag ID. If absent, the
  loop index is used. Values may be inherited from the nearest matching ancestor.
- `data-launch-app-ext-info` overrides `extInfo` for a matched container, and
  `data-launch-app-error-link` overrides `launchErrorLink`. Both attributes may also be inherited
  from an ancestor.
- `mazey` provides logging, nonce generation, style injection, and query parsing; `jquery` handles
  DOM lookup and mutation; `js-sha1` signs the JS-SDK configuration string.
- CJS and ESM builds leave `mazey`, `jquery`, `js-sha1`, and injected `core-js` modules external for
  npm consumers. The browser IIFE resolves and bundles them.
- The runtime writes its integration surface to `window.LAUNCH_APP_*` and writes generated tags,
  classes, styles, and the optional fallback mask into the host document.

`defaultOptions` is currently mutated by `Object.assign(defaultOptions, options)`, so values can
persist across factory calls. Treat that observable behavior carefully: any attempt to isolate
instances needs focused regression tests and an explicit compatibility decision.

## Configuration Files

- `package.json`: package identity, generated entry points, npm scripts, runtime dependencies,
  development dependencies, Husky hooks, and Node-era tooling.
- `tsconfig.json`: strict TypeScript, ES5 target, ESNext modules, DOM libraries, declaration and
  source-map emission to `lib`, plus local resolution for `mazey` and `tslib` types.
- `.babelrc`: browser targets, TypeScript parsing, ES5-compatible transformation, usage-based
  Core-JS injection, and Babel runtime helpers.
- `eslint.config.mjs`: flat TypeScript lint configuration and generated-directory exclusions.
- `.prettierrc`, `.prettierignore`, and `.editorconfig`: formatting, whitespace, and line-ending
  rules.
- `.lintstagedrc`, `commitlint.config.js`, and `.husky/`: staged TypeScript formatting/linting and
  Conventional Commit checks.
- `.npmignore`: excludes source, examples, tests, scripts, configuration, and the npm lockfile from
  the published package. Check `npm pack --dry-run` when changing package contents.
- `.gitignore`: excludes dependencies, `lib`, `dist`, local environment files, and logs.
- `package-lock.json`: npm v10 lockfile committed for reproducible Node.js 22 installs.
- `.npmrc`: uses the public npm registry.

## Build And Development Pipeline

Use Node.js 22.15.0 or later in the Node.js 22 release line and npm 10 or later, matching `.nvmrc`,
`scripts/env.sh`, `package.json`, the README, and both GitHub workflows. Install the committed
dependency graph with `npm ci`.

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run test
npm run preview
npm run lint:fix
```

- `npm run dev` runs `webpack serve`, compiles `examples/index.ts` through `ts-loader`, generates
  `dist/index.html`, and opens the local page. `dist` is disposable output.
- `npm run build` runs Rollup. The first target removes `lib`, compiles `src/index.ts`, externalizes
  runtime dependencies, and emits CJS/ESM files plus declarations. The second target resolves
  dependencies and emits the minified browser IIFE. Rollup, TypeScript, and Babel all participate,
  so validate all output formats when changing build configuration.
- `npm run test` runs Jest against `lib/index.esm`; it is not a source-only test. Run the build first
  after source changes.
- `npm run typecheck` checks the TypeScript program without emitting output.
- `npm run lint` checks the package source, ambient declarations, JavaScript build and release
  configuration, and tests without modifying them.
- `npm run preview` is the normal local verification sequence: typecheck, lint, build, then test.
- `npm run lint:fix` fixes supported lint findings in the same files. Review its diff and use it only
  when the affected files require formatting or lint fixes.
- `npm run release` first runs the preview pipeline, then invokes a Git/tag release helper. It is a
  state-changing maintainer command, not a validation command.

## Change And Test Guidelines

- Keep browser-only behavior out of module initialization where practical. Runtime code assumes
  WeChat and DOM globals, so add controlled mocks when expanding tests.
- When changing options, lifecycle methods, callbacks, or globals, update `src/index.ts`,
  `typing.d.ts`, README API tables/examples, and Jest coverage together.
- Preserve both `serviceAccountAppId` and the deprecated `wexinServiceAccountAppId` alias unless a
  breaking release explicitly removes compatibility.
- Preserve ticket precedence, signature field order, open-tag attributes, and per-element data
  overrides unless the requested behavior changes them.
- Avoid new dependencies without checking both output strategies: npm builds externalize runtime
  dependencies, while the IIFE bundles them.
- Do not hand-edit `lib` or `dist`. Rebuild from source.
- Keep tests deterministic; do not require a live WeChat session, real ticket, network access, or
  navigation to validate package logic.

For a normal source change, run:

```bash
npm run preview
git diff --check
```

Add `npm pack --dry-run` for package metadata, output, or publishing-boundary changes. Report any
checks that could not run, especially when Node.js 22 or dependencies are unavailable.

## CI And Release Safety

Pull requests to `main` run the full preview pipeline on Node.js 22. Pushes to `main` run a separate
workflow that performs a clean install, lints without mutation, builds, tests, and publishes to npm
with `NPM_TOKEN`. Treat changes to `main`, `.github/workflows/publish.yml`, package identity,
versioning, and release scripts as release-sensitive. Never push or publish as an implicit part of
routine contributor work.

# AGENTS.md

Guidance for contributors and automated coding agents working in this repository.

## Project Scope

`mazey-wechat-launch-app` is a browser-only TypeScript package that overlays WeChat's
`wx-open-launch-app` tag on matching page elements. It configures the WeChat JS-SDK, generates the
required signature, renders launch controls, exposes lifecycle helpers, and handles launch errors
or fallback navigation.

Keep changes focused on this checkout. The parent `/Users/mazey/Web/web/npm` directory contains
independent repositories and is not a monorepo. Run Git and package-manager commands from this
repository, and preserve unrelated uncommitted work. Do not stage, commit, push, release, or publish
unless the user explicitly asks.

## Repository Map

- `src/index.ts`: the complete package implementation and default export. It owns option defaults,
  JS-SDK setup, signature generation, open-tag rendering, fallback UI, browser globals, and the
  public lifecycle methods.
- `typing.d.ts`: ambient browser and public return-value declarations used by the TypeScript build.
  Keep these declarations synchronized with public methods and `window.LAUNCH_APP_*` globals.
- `test/type.test.js`: Jest smoke tests for generated package entries and declarations.
- `test/site.test.js`: regression tests for project identity, Playground validation, the mock
  WeChat SDK, theme behavior, and TypeDoc Pages transformation.
- `examples/`: crawlable Playground source that exercises the public root API with a local WeChat
  JS-SDK mock.
- `site/`: shared Bootstrap, navigation, theme, PWA, API enhancement, homepage, and service-worker
  sources.
- `project.config.js`: central package, repository, website, SEO, theme, and PWA identity.
- `scripts/rollup.config.mjs`: production package build for CommonJS, ESM, browser IIFE, and
  declarations.
- `scripts/webpack.config.dev.js`: website, Playground, and API enhancement build configuration.
- `scripts/build-pages.mjs`: deterministic Pages assembly and TypeDoc transformation.
- `scripts/validate-seo.mjs` and `scripts/validate-pwa.mjs`: final-artifact validation.
- `scripts/prepare.mjs`: installs Husky hooks outside production installs.
- `scripts/release.js`: delegates Git release work to `mazey/scripts/git-helper.js` on `main`.
- `scripts/env.sh` and `.nvmrc`: select Node.js 22 through `nvm`.
- `.github/workflows/test.yml`: pull-request verification job on Node.js 22 and pnpm 10.
- `.github/workflows/pages.yml`: validated GitHub Pages build and deployment.
- `.github/workflows/publish.yml`: lint, build, test, and npm publication for pushes to
  `release/v*`.
- `README.md`: installation, CDN, runtime API, WeChat prerequisites, and contributor commands.
- `images/`: maintained logo, social image, and PWA icon sources copied into the Pages artifact.
- `lib/`, `dist-dev/`, `docs/`, `.pages-api/`, and `coverage/`: ignored generated output. Never
  edit these directories by hand.

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
- `tsconfig.json`: strict package TypeScript, ES5 target, ESNext modules, DOM libraries,
  declaration and source-map emission to `lib`, plus local resolution for `mazey` and `tslib`
  types.
- `tsconfig.site.json`: ES2018 browser build settings for package source, website source, and the
  Playground.
- `.babelrc`: browser targets, TypeScript parsing, ES5-compatible transformation, and usage-based
  Core-JS injection.
- `eslint.config.mjs`: flat TypeScript lint configuration and generated-directory exclusions.
- `.prettierrc`, `.prettierignore`, and `.editorconfig`: formatting, whitespace, and line-ending
  rules.
- `.lintstagedrc`, `commitlint.config.js`, and `.husky/`: staged TypeScript formatting/linting and
  Conventional Commit checks.
- `package.json` uses an explicit `files` allowlist for published package contents. Check
  `npm pack --dry-run` when changing package contents.
- `.gitignore`: excludes dependencies, generated package/site output, local environment files, and
  logs.
- `pnpm-lock.yaml`: pnpm 10 lockfile committed for reproducible Node.js 22 installs.
- `.npmrc`: uses the public npm registry.

## Build And Development Pipeline

The README requires Node.js 22.15.0 or later in the Node.js 22 release line. `.nvmrc`,
`scripts/env.sh`, and CI select Node.js 22. The published package does not declare an `engines`
restriction because its runtime is the browser. Contributors may use npm, pnpm, or Yarn. CI uses
pnpm 10 and the committed `pnpm-lock.yaml`; do not commit locally generated `package-lock.json` or
`yarn.lock` files.

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run test
npm run docs
npm run preview
npm run lint:fix
```

- `npm run dev` runs the Webpack development server for the homepage and Playground.
- `npm run build` runs Rollup. The first target removes `lib`, compiles `src/index.ts`, externalizes
  runtime dependencies, and emits CJS/ESM files plus declarations. The second target resolves
  dependencies and emits the minified browser IIFE. Rollup, TypeScript, and Babel all participate,
  so validate all output formats when changing build configuration.
- `npm run test` runs Jest against `lib/index.esm` and website source. Run the build first
  after source changes.
- `npm run docs` builds TypeDoc and the Webpack site, replaces `docs/`, enhances API pages,
  generates SEO/PWA assets, and validates the final artifact.
- `npm run typecheck` checks the package TypeScript program without emitting output.
- `npm run lint` checks package and website source, declarations, build scripts, and tests.
- `npm run preview` is the normal local verification sequence: typecheck, lint, package build,
  tests, and the complete Pages build.
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
- Do not hand-edit `lib`, `dist-dev`, `docs`, `.pages-api`, or `coverage`. Rebuild from source.
- The Home and Playground navbars use project-owned two-state light/dark buttons. Resolve the
  operating-system preference only during initialization, persist only concrete `light` or `dark`
  values under the configured project key, and keep TypeDoc's native `#tsd-theme` selector with
  only its Light and Dark options in the final Pages artifact.
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

Pull requests to `main` run the full preview pipeline on Node.js 22. Pushes to `main` and
`release/v*` build, validate, and deploy the Pages artifact; manual Pages runs are also supported.
Only pushes to `release/v*` run the npm workflow, which installs from the lockfile, lints, builds,
tests, and publishes with `NPM_TOKEN`. Treat changes to release branches,
`.github/workflows/publish.yml`, package identity, versioning, and release scripts as
release-sensitive. Never push or publish as an implicit part of routine contributor work.

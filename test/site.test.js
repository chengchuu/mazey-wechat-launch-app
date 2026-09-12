/**
 * @jest-environment jsdom
 */

import { createMockWx, validatePlaygroundValues } from '../examples/index';
import { initializeThemeControls } from '../site/theme';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const bootstrapThemeIconPaths = ['sun-fill.svg', 'moon-stars-fill.svg'].flatMap(
  (name) =>
    [
      ...fs
        .readFileSync(
          path.resolve(
            __dirname,
            `../node_modules/bootstrap-icons/icons/${name}`
          ),
          'utf8'
        )
        .matchAll(/d="([^"]+)"/g),
    ].map((match) => match[1])
);

let media;

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  document.documentElement.removeAttribute('data-theme-controls-ready');
  document.documentElement.removeAttribute('data-bs-theme');
  document.documentElement.removeAttribute('data-theme');
  document.head.innerHTML =
    '<meta name="theme-color" content="#fff" data-theme-color data-theme-color-light="#f5faf8" data-theme-color-dark="#0b1713">';
  document.body.innerHTML = `
    <button type="button" data-theme-toggle
      aria-label="Current theme: Light. Switch to dark theme.">
      <svg data-theme-icon="light" aria-hidden="true" focusable="false"></svg>
      <svg data-theme-icon="dark" aria-hidden="true" focusable="false" hidden></svg>
    </button>`;
  media = {
    addEventListener: jest.fn((_, listener) => {
      media.listener = listener;
    }),
    matches: false,
    removeEventListener: jest.fn(),
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => media,
  });
  window.localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
  document.documentElement.style.removeProperty('color-scheme');
});

test('playground rejects values that could break generated tag attributes', () => {
  expect(
    validatePlaygroundValues({
      serviceAppId: 'wx-service',
      mobileAppId: 'wx-mobile',
      extInfo: "value'",
    })
  ).toMatch(/不能包含/);
});

test('playground mock reports JS-SDK configuration and runs ready callbacks', () => {
  const onConfig = jest.fn();
  const ready = jest.fn();
  const wx = createMockWx(onConfig);

  wx.config({ appId: 'wx-demo' });
  wx.ready(ready);

  expect(onConfig).toHaveBeenCalledWith({ appId: 'wx-demo' });
  expect(ready).toHaveBeenCalledTimes(1);
});

test('central config derives stable package and Pages identity', () => {
  const project = require('../project.config');

  expect(project.package.installCommand).toBe(
    'npm install mazey-wechat-launch-app'
  );
  expect(project.site.basePath).toBe('/mazey-wechat-launch-app/');
  expect(project.site.pages.playground.url).toBe(
    'https://chengchuu.github.io/mazey-wechat-launch-app/playground/'
  );
});

test('theme buttons use the compact circular visual contract', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '../site/site.css'),
    'utf8'
  );
  const apiCss = fs.readFileSync(
    path.resolve(__dirname, '../site/api.css'),
    'utf8'
  );
  const buttonRule = css.match(/\.theme-toggle\s*\{([^}]*)\}/)?.[1];
  const iconRule = css.match(/\.theme-toggle svg\s*\{([^}]*)\}/)?.[1];
  const apiButtonRule = apiCss.match(
    /\.site-project-links \.theme-toggle\s*\{([^}]*)\}/
  )?.[1];

  expect(buttonRule).toMatch(/width:\s*32px;/);
  expect(buttonRule).toMatch(/height:\s*32px;/);
  expect(buttonRule).toMatch(/padding:\s*7px;/);
  expect(buttonRule).toMatch(/box-sizing:\s*border-box;/);
  expect(buttonRule).toMatch(/border-radius:\s*50%;/);
  expect(iconRule).toMatch(/width:\s*16px;/);
  expect(iconRule).toMatch(/height:\s*16px;/);
  expect(apiButtonRule).toMatch(/width:\s*28px;/);
  expect(apiButtonRule).toMatch(/height:\s*28px;/);
  expect(apiButtonRule).toMatch(/border-radius:\s*50%;/);
});

test('shared layout keeps the footer at the bottom of short pages', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '../site/site.css'),
    'utf8'
  );
  const bodyRule = [...css.matchAll(/body\s*\{([^}]*)\}/g)]
    .map((match) => match[1])
    .find((rule) => /min-height:\s*100vh;/.test(rule));
  const mainRule = css.match(/body\s*>\s*main\s*\{([^}]*)\}/)?.[1];

  expect(bodyRule).toMatch(/display:\s*flex;/);
  expect(bodyRule).toMatch(/flex-direction:\s*column;/);
  expect(bodyRule).toMatch(/min-height:\s*100vh;/);
  expect(mainRule).toMatch(/flex:\s*1 0 auto;/);
});

test('navbar templates use official inline Bootstrap theme icons', () => {
  for (const file of ['../site/index.html', '../examples/index.html']) {
    const html = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
    expect(html.match(/data-theme-toggle/g)).toHaveLength(1);
    expect(html).toContain('type="button"');
    expect(html).toContain(
      'aria-label="Current theme: Light. Switch to dark theme."'
    );
    expect(html).toContain('data-theme-icon="light"');
    expect(html).toMatch(/data-theme-icon="dark"\s+hidden/);
    expect(html).not.toContain('data-theme-select');
    expect(html).not.toContain('aria-pressed');
    expect(
      html.match(/<svg[\s\S]*?width="16"[\s\S]*?height="16"/g)
    ).toHaveLength(2);
    for (const iconPath of bootstrapThemeIconPaths)
      expect(html).toContain(iconPath);
  }
});

function expectRenderedTheme(theme) {
  const button = document.querySelector('[data-theme-toggle]');
  const current = theme === 'light' ? 'Light' : 'Dark';
  const next = theme === 'light' ? 'dark' : 'light';

  expect(document.documentElement.dataset.bsTheme).toBe(theme);
  expect(document.documentElement.dataset.theme).toBe(theme);
  expect(document.documentElement.style.colorScheme).toBe(theme);
  expect(button.getAttribute('aria-label')).toBe(
    `Current theme: ${current}. Switch to ${next} theme.`
  );
  expect(button.hasAttribute('aria-pressed')).toBe(false);
  expect(
    button.querySelector('[data-theme-icon="light"]').hasAttribute('hidden')
  ).toBe(theme !== 'light');
  expect(
    button.querySelector('[data-theme-icon="dark"]').hasAttribute('hidden')
  ).toBe(theme !== 'dark');
  expect(document.querySelector('meta[name="theme-color"]').content).toBe(
    theme === 'light' ? '#f5faf8' : '#0b1713'
  );
}

test('missing preference resolves the operating-system theme only once', () => {
  media.matches = true;
  const stop = initializeThemeControls('test-theme');

  expectRenderedTheme('dark');
  expect(localStorage.getItem('test-theme')).toBeNull();
  expect(localStorage.getItem('tsd-theme')).toBe('dark');
  expect(media.addEventListener).not.toHaveBeenCalled();

  media.matches = false;
  expectRenderedTheme('dark');
  stop();
});

test('URL and saved concrete preferences keep their precedence', () => {
  localStorage.setItem('test-theme', 'light');
  window.history.replaceState({}, '', '/?test-theme=dark');
  const stop = initializeThemeControls('test-theme');

  expectRenderedTheme('dark');
  expect(localStorage.getItem('test-theme')).toBe('light');
  stop();
});

test('invalid stored preference falls through without migration', () => {
  localStorage.setItem('test-theme', 'corrupted');
  media.matches = false;
  const stop = initializeThemeControls('test-theme');

  expectRenderedTheme('light');
  expect(localStorage.getItem('test-theme')).toBe('corrupted');
  stop();
});

test('unavailable storage keeps initialization and toggling usable', () => {
  media.matches = true;
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Storage unavailable', 'SecurityError');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage unavailable', 'SecurityError');
  });

  let stop;
  expect(() => {
    stop = initializeThemeControls('test-theme');
  }).not.toThrow();
  expectRenderedTheme('dark');
  expect(() =>
    document.querySelector('[data-theme-toggle]').click()
  ).not.toThrow();
  expectRenderedTheme('light');
  stop();
});

test('unavailable media queries use the light fallback', () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => {
      throw new Error('Media queries unavailable');
    },
  });

  const stop = initializeThemeControls('test-theme');
  expectRenderedTheme('light');
  expect(localStorage.getItem('test-theme')).toBeNull();
  stop();
});

test('theme selection remains active when storage rejects writes', () => {
  const stop = initializeThemeControls('test-theme');
  const storageWrite = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('storage unavailable');
    });
  document.querySelector('[data-theme-toggle]').click();

  expectRenderedTheme('dark');
  storageWrite.mockRestore();
  stop();
});

test('repeated toggles persist concrete preferences', () => {
  const stop = initializeThemeControls('test-theme');
  const button = document.querySelector('[data-theme-toggle]');

  button.click();
  expectRenderedTheme('dark');
  expect(localStorage.getItem('test-theme')).toBe('dark');
  button.click();
  expectRenderedTheme('light');
  expect(localStorage.getItem('test-theme')).toBe('light');
  stop();
});

test('every project theme button stays synchronized', () => {
  const secondButton = document
    .querySelector('[data-theme-toggle]')
    .cloneNode(true);
  document.body.append(secondButton);
  const stop = initializeThemeControls('test-theme');

  document.querySelector('[data-theme-toggle]').click();
  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    expect(button.getAttribute('aria-label')).toBe(
      'Current theme: Dark. Switch to light theme.'
    );
    expect(
      button.querySelector('[data-theme-icon="light"]').hasAttribute('hidden')
    ).toBe(true);
    expect(
      button.querySelector('[data-theme-icon="dark"]').hasAttribute('hidden')
    ).toBe(false);
  }
  stop();
});

test('TypeDoc theme changes synchronize without recursive events', () => {
  document.body.insertAdjacentHTML(
    'beforeend',
    '<select id="tsd-theme"><option value="light">Light</option><option value="dark">Dark</option></select>'
  );
  const select = document.querySelector('#tsd-theme');
  const observedChanges = jest.fn();
  select.addEventListener('change', observedChanges);
  const stop = initializeThemeControls('test-theme');

  select.value = 'dark';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  expectRenderedTheme('dark');
  expect(localStorage.getItem('test-theme')).toBe('dark');
  expect(localStorage.getItem('tsd-theme')).toBe('dark');
  expect(observedChanges).toHaveBeenCalledTimes(1);

  document.querySelector('[data-theme-toggle]').click();
  expect(select.value).toBe('light');
  expect(observedChanges).toHaveBeenCalledTimes(1);
  stop();
});

test('unsupported TypeDoc values restore the current concrete theme', () => {
  document.body.insertAdjacentHTML(
    'beforeend',
    '<select id="tsd-theme"><option value="light">Light</option><option value="dark">Dark</option><option value="unsupported">Unsupported</option></select>'
  );
  const select = document.querySelector('#tsd-theme');
  const stop = initializeThemeControls('test-theme');

  select.value = 'unsupported';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  expectRenderedTheme('light');
  expect(select.value).toBe('light');
  expect(localStorage.getItem('test-theme')).toBeNull();
  expect(localStorage.getItem('tsd-theme')).toBe('light');
  stop();
});

test('duplicate initialization and cleanup do not duplicate listeners', () => {
  const stop = initializeThemeControls('test-theme');
  const duplicateStop = initializeThemeControls('test-theme');
  duplicateStop();

  document.querySelector('[data-theme-toggle]').click();
  expectRenderedTheme('dark');
  stop();
  document.querySelector('[data-theme-toggle]').click();
  expectRenderedTheme('dark');
});

function typeDocFixture(themeOptions) {
  return `<!doctype html><html><head><title>API Reference</title></head><body><header><div class="tsd-toolbar-contents container"></div></header><div class="tsd-theme-toggle"><label class="settings-label" for="tsd-theme">Theme</label><select id="tsd-theme">${themeOptions}</select></div><main><div class="tsd-page-title"><h2>API</h2></div><h1>mazey-wechat-launch-app</h1></main></body></html>`;
}

function transformApiHtml(html) {
  const script = `
    import { transformApiHtml } from './scripts/build-pages.mjs';
    const html = Buffer.from(process.argv[1], 'base64').toString('utf8');
    process.stdout.write(transformApiHtml(html, 'index.html'));
  `;
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      script,
      Buffer.from(html).toString('base64'),
    ],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' }
  );
}

test('TypeDoc transformation preserves its selector and removes only OS', () => {
  const source = typeDocFixture(
    '<option value="os">OS</option><option value="light">Light</option><option value="dark">Dark</option>'
  );
  const first = transformApiHtml(source);
  expect(first.status).toBe(0);
  const transformed = first.stdout;

  expect(transformed).toContain('data-theme-toggle');
  expect(transformed).toContain('id="tsd-theme"');
  expect(transformed).not.toContain('value="os"');
  expect(transformed).not.toContain('mazey-api-theme');
  expect(transformed).not.toContain('data-theme-select');
  for (const iconPath of bootstrapThemeIconPaths)
    expect(transformed).toContain(iconPath);
  const second = transformApiHtml(transformed);
  expect(second.status).toBe(0);
  expect(second.stdout).toBe(transformed);
});

test('TypeDoc transformation rejects missing or duplicate native controls', () => {
  const missingOption = transformApiHtml(typeDocFixture(''));
  expect(missingOption.status).not.toBe(0);
  expect(missingOption.stderr).toMatch(/exactly one TypeDoc OS theme option/);

  const markerOnly = transformApiHtml(
    typeDocFixture('').replace(
      '<head>',
      '<head><!-- mazey-wechat-launch-app-seo:start --><!-- mazey-wechat-launch-app-seo:end -->'
    )
  );
  expect(markerOnly.status).not.toBe(0);
  expect(markerOnly.stderr).toMatch(/exactly one TypeDoc OS theme option/);

  const duplicateSelector = transformApiHtml(
    typeDocFixture('<option value="os">OS</option>').replace(
      '</body>',
      '<select id="tsd-theme"><option value="os">OS</option></select></body>'
    )
  );
  expect(duplicateSelector.status).not.toBe(0);
  expect(duplicateSelector.stderr).toMatch(
    /exactly one TypeDoc theme selector/
  );
});

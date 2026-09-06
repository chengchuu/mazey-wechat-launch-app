/**
 * @jest-environment jsdom
 */

import { createMockWx, validatePlaygroundValues } from '../examples/index';
import { initializeThemeControls } from '../site/theme';

const fs = require('node:fs');
const path = require('node:path');

let media;

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  document.documentElement.removeAttribute('data-theme-controls-ready');
  document.documentElement.removeAttribute('data-bs-theme');
  document.documentElement.removeAttribute('data-theme');
  document.head.innerHTML =
    '<meta name="theme-color" content="#fff" data-theme-color data-theme-color-light="#f5faf8" data-theme-color-dark="#0b1713">';
  document.body.innerHTML =
    '<select data-theme-select><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>';
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

test('shared navigation keeps the theme control on one line', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '../site/site.css'),
    'utf8'
  );
  const themeControlRule = css.match(/\.theme-control\s*\{([^}]*)\}/)?.[1];

  expect(themeControlRule).toMatch(/flex:\s*0 0 auto;/);
  expect(themeControlRule).toMatch(/white-space:\s*nowrap;/);
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

test('theme selection remains active when storage rejects writes', () => {
  const stop = initializeThemeControls('test-theme');
  const storageWrite = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('storage unavailable');
    });
  const select = document.querySelector('[data-theme-select]');

  select.value = 'dark';
  select.dispatchEvent(new Event('change', { bubbles: true }));

  expect(document.documentElement.dataset.bsTheme).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.querySelector('meta[name="theme-color"]').content).toBe(
    '#0b1713'
  );
  storageWrite.mockRestore();
  stop();
});

test('session-only system theme follows media changes after storage failure', () => {
  window.localStorage.setItem('test-theme', 'dark');
  const stop = initializeThemeControls('test-theme');
  const storageWrite = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('storage unavailable');
    });
  const select = document.querySelector('[data-theme-select]');

  select.value = 'system';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  expect(document.documentElement.dataset.bsTheme).toBe('light');

  media.matches = true;
  media.listener({ matches: true });

  expect(document.documentElement.dataset.bsTheme).toBe('dark');
  storageWrite.mockRestore();
  stop();
});

test('fixed URL theme keeps the resolved theme and selector consistent', () => {
  window.history.replaceState({}, '', '/?theme=dark');
  const stop = initializeThemeControls('test-theme');
  const select = document.querySelector('[data-theme-select]');

  select.value = 'light';
  select.dispatchEvent(new Event('change', { bubbles: true }));

  expect(document.documentElement.dataset.bsTheme).toBe('dark');
  expect(select.value).toBe('dark');
  stop();
});

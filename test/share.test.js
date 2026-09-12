/** @jest-environment jsdom */

let createLaunchApp;
let wx;
let ready;
let configured;
let app;

const timeline = (title = 'Timeline') => ({
  title,
  link: 'https://example.com/share',
  imgUrl: 'https://example.com/icon.png',
});
const message = (title = 'Message') => ({
  ...timeline(title),
  desc: 'Description',
});

beforeEach(() => {
  jest.resetModules();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  createLaunchApp = require('../lib/index.cjs.js');
  document.title = 'Page title';
  let onConfigured;
  configured = new Promise((resolve) => {
    onConfigured = resolve;
  });
  wx = {
    config: jest.fn(),
    ready: jest.fn((callback) => {
      ready = callback;
      onConfigured();
    }),
    error: jest.fn(),
    updateTimelineShareData: jest.fn(),
    updateAppMessageShareData: jest.fn(),
  };
  window.wx = wx;
});

afterEach(() => {
  if (app) app.destroy();
  app = undefined;
  for (const key of Object.keys(window)) {
    if (key.startsWith('LAUNCH_APP_')) delete window[key];
  }
  delete window.wx;
  jest.restoreAllMocks();
});

async function start(options = {}) {
  app = createLaunchApp({
    weixinJsSdkTicket: 'mock-ticket',
    serviceAccountAppId: 'wx-service',
    ...options,
  });
  app.start({});
  await configured;
}

test('registers modern APIs without configuring absent shares', async () => {
  await start();
  expect(wx.config.mock.calls[0][0].jsApiList).toEqual([
    'showOptionMenu',
    'updateTimelineShareData',
    'updateAppMessageShareData',
  ]);
  ready();
  expect(wx.updateTimelineShareData).not.toHaveBeenCalled();
  expect(wx.updateAppMessageShareData).not.toHaveBeenCalled();
});

test('new configurations take precedence as whole objects without an app ID', async () => {
  const legacySuccess = jest.fn();
  await start({
    onMenuShareTimelineOptions: {
      ...timeline('Old'),
      success: legacySuccess,
      cancel: jest.fn(),
    },
    onMenuShareAppMessageOptions: {
      ...message('Old'),
      success: legacySuccess,
      cancel: jest.fn(),
      type: 'music',
      dataUrl: 'old',
    },
    updateTimelineShareDataOptions: timeline('New'),
    updateAppMessageShareDataOptions: message('New'),
  });
  expect(wx.updateTimelineShareData).not.toHaveBeenCalled();
  ready();
  expect(wx.updateTimelineShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateTimelineShareData).toHaveBeenCalledWith(timeline('New'));
  expect(wx.updateAppMessageShareData).toHaveBeenCalledWith(message('New'));
  expect(window.LAUNCH_APP_READY).not.toBe(true);
  expect(legacySuccess).not.toHaveBeenCalled();
});

test('legacy options filter unsupported fields and preserve SDK-owned callbacks', async () => {
  const success = jest.fn();
  const cancel = jest.fn();
  const oldTimeline = Object.freeze({ ...timeline(), success, cancel });
  const oldMessage = Object.freeze({
    ...message(),
    success,
    cancel,
    type: 'music',
    dataUrl: 'audio',
  });
  await start({
    updateTimelineShareDataOptions: undefined,
    updateAppMessageShareDataOptions: undefined,
    onMenuShareTimelineOptions: oldTimeline,
    onMenuShareAppMessageOptions: oldMessage,
  });
  ready();
  expect(wx.updateTimelineShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateTimelineShareData).toHaveBeenCalledWith({
    ...timeline(),
    success,
  });
  expect(wx.updateAppMessageShareData).toHaveBeenCalledWith({
    ...message(),
    success,
  });
  expect(success).not.toHaveBeenCalled();
  wx.updateAppMessageShareData.mock.calls[0][0].success();
  expect(success).toHaveBeenCalledTimes(1);
  expect(cancel).not.toHaveBeenCalled();
  expect(oldMessage.dataUrl).toBe('audio');
});

test('stable methods retain the latest independent updates before ready and send immediately afterward', async () => {
  app = createLaunchApp({
    weixinJsSdkTicket: 'mock-ticket',
    updateTimelineShareDataOptions: timeline('Initial'),
    updateAppMessageShareDataOptions: message('Initial'),
  });
  const shareTimeline = app.LAUNCH_APP_SHARE_TIMELINE;
  const shareMessage = app.LAUNCH_APP_SHARE_APP_MESSAGE;
  expect(window.LAUNCH_APP_SHARE_TIMELINE).toBe(shareTimeline);
  expect(window.LAUNCH_APP_SHARE_APP_MESSAGE).toBe(shareMessage);
  shareTimeline(timeline('First'));
  shareMessage(message('First'));
  app.start({});
  await configured;
  window.LAUNCH_APP_SHARE_TIMELINE(timeline('Latest'));
  window.LAUNCH_APP_SHARE_APP_MESSAGE(message('Latest'));
  expect(wx.updateTimelineShareData).not.toHaveBeenCalled();
  expect(wx.updateAppMessageShareData).not.toHaveBeenCalled();
  ready();
  expect(wx.updateTimelineShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateTimelineShareData).toHaveBeenCalledWith(timeline('Latest'));
  expect(wx.updateAppMessageShareData).toHaveBeenCalledWith(message('Latest'));
  expect(window.LAUNCH_APP_SHARE_TIMELINE).toBe(shareTimeline);
  expect(window.LAUNCH_APP_SHARE_APP_MESSAGE).toBe(shareMessage);
  shareTimeline(timeline('After'));
  window.LAUNCH_APP_SHARE_APP_MESSAGE(message('After'));
  expect(wx.updateTimelineShareData).toHaveBeenLastCalledWith(
    timeline('After')
  );
  expect(wx.updateAppMessageShareData).toHaveBeenLastCalledWith(
    message('After')
  );
  expect(wx.updateTimelineShareData).toHaveBeenCalledTimes(2);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledTimes(2);
});

test('restarting waits for SDK readiness and flushes only the latest channel updates', async () => {
  await start({
    updateTimelineShareDataOptions: timeline('Initial'),
    updateAppMessageShareDataOptions: message('Initial'),
  });
  ready();
  app.destroy();
  const reconfigured = new Promise((resolve) => {
    wx.ready.mockImplementationOnce((callback) => {
      ready = callback;
      resolve();
    });
  });
  app.start({});
  app.LAUNCH_APP_SHARE_TIMELINE(timeline('Pending'));
  app.LAUNCH_APP_SHARE_APP_MESSAGE(message('Pending'));
  expect(wx.updateTimelineShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledTimes(1);
  await reconfigured;
  window.LAUNCH_APP_SHARE_TIMELINE(timeline('Latest'));
  window.LAUNCH_APP_SHARE_APP_MESSAGE(message('Latest'));
  expect(wx.updateTimelineShareData).toHaveBeenCalledTimes(1);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledTimes(1);
  ready();
  expect(wx.updateTimelineShareData).toHaveBeenCalledTimes(2);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledTimes(2);
  expect(wx.updateTimelineShareData).toHaveBeenLastCalledWith(
    timeline('Latest')
  );
  expect(wx.updateAppMessageShareData).toHaveBeenLastCalledWith(
    message('Latest')
  );
});

test('JavaScript method calls retain page defaults and filter legacy fields', async () => {
  await start();
  ready();
  app.LAUNCH_APP_SHARE_TIMELINE(Object.freeze({ cancel: jest.fn() }));
  app.LAUNCH_APP_SHARE_APP_MESSAGE(
    Object.freeze({ type: 'music', dataUrl: 'audio' })
  );
  const defaults = { title: document.title, link: location.href, imgUrl: '' };
  expect(wx.updateTimelineShareData).toHaveBeenCalledWith(defaults);
  expect(wx.updateAppMessageShareData).toHaveBeenCalledWith({
    ...defaults,
    desc: '',
  });
});

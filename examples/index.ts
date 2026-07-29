import createLaunchApp from '../src';

interface PlaygroundValues {
  extInfo: string;
  mobileAppId: string;
  serviceAppId: string;
}

interface MockWx {
  config(options: Record<string, unknown>): void;
  error(callback: (error: unknown) => void): void;
  onMenuShareAppMessage(): void;
  onMenuShareTimeline(): void;
  ready(callback: () => void): void;
}

const appIdPattern = /^[A-Za-z0-9_-]{3,64}$/;

export function validatePlaygroundValues(
  values: PlaygroundValues
): string | null {
  if (!appIdPattern.test(values.serviceAppId)) {
    return '公众号 AppID 只能包含字母、数字、连字符和下划线，长度为 3～64 个字符。';
  }
  if (!appIdPattern.test(values.mobileAppId)) {
    return '移动应用 AppID 只能包含字母、数字、连字符和下划线，长度为 3～64 个字符。';
  }
  if (/['"<>&]/.test(values.extInfo)) {
    return '扩展信息不能包含引号、尖括号或 &。';
  }
  return null;
}

export function createMockWx(onConfig: (value: unknown) => void): MockWx {
  return {
    config(options) {
      onConfig(options);
    },
    error() {},
    onMenuShareAppMessage() {},
    onMenuShareTimeline() {},
    ready(callback) {
      callback();
    },
  };
}

const form = document.querySelector<HTMLFormElement>('[data-playground-form]');
const status = document.querySelector<HTMLElement>('[data-playground-status]');
const tagOutput = document.querySelector<HTMLElement>('[data-tag-output]');
const configOutput = document.querySelector<HTMLElement>(
  '[data-config-output]'
);
const preview = document.querySelector<HTMLElement>(
  '.mazey-launch-app-selector'
);

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const values: PlaygroundValues = {
    serviceAppId: String(data.get('serviceAppId') ?? '').trim(),
    mobileAppId: String(data.get('mobileAppId') ?? '').trim(),
    extInfo: String(data.get('extInfo') ?? '').trim(),
  };
  const validationError = validatePlaygroundValues(values);
  if (validationError) {
    if (status) {
      status.textContent = validationError;
      status.setAttribute('aria-invalid', 'true');
    }
    return;
  }

  let sdkConfig: unknown = null;
  preview
    ?.querySelectorAll('wx-open-launch-app')
    .forEach((tag) => tag.remove());
  window.wx = createMockWx((value) => {
    sdkConfig = value;
  });
  const launchApp = createLaunchApp({
    weixinJsSdkTicket: 'local-playground-ticket',
    serviceAccountAppId: values.serviceAppId,
    openPlatformMobileAppId: values.mobileAppId,
    extInfo: values.extInfo,
    launchContainerQuery: '.mazey-launch-app-selector',
    launchBtnText: '模拟打开 App',
    isConClosed: true,
  });
  launchApp.start({});
  window.setTimeout(() => {
    const tag = preview?.querySelector('wx-open-launch-app');
    if (tagOutput) tagOutput.textContent = tag?.outerHTML ?? '未生成开放标签。';
    if (configOutput)
      configOutput.textContent = JSON.stringify(sdkConfig, null, 2);
    if (status) {
      status.removeAttribute('aria-invalid');
      status.textContent = tag ? '已生成本地模拟结果。' : '未生成开放标签。';
    }
    launchApp.destroy();
  }, 0);
});

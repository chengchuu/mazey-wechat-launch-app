const copyButton = document.querySelector<HTMLButtonElement>(
  '[data-copy-install]'
);
const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');

copyButton?.addEventListener('click', () => {
  void navigator.clipboard
    .writeText(SITE_RUNTIME_CONFIG.installCommand)
    .then(() => {
      if (copyStatus) copyStatus.textContent = '安装命令已复制。';
    })
    .catch(() => {
      if (copyStatus) copyStatus.textContent = '复制失败，请手动选择安装命令。';
    });
});
import { SITE_RUNTIME_CONFIG } from './runtime-config';

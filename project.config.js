const { deepFreeze } = require('mazey');
const pkg = require('./package.json');
const {
  packageDetails,
  repositoryDetails,
} = require('./scripts/project-config-utils');

const packageConfig = packageDetails(pkg);
const repository = repositoryDetails(pkg.repository);
const siteUrl = new URL(pkg.homepage);
siteUrl.pathname = siteUrl.pathname.endsWith('/')
  ? siteUrl.pathname
  : `${siteUrl.pathname}/`;
siteUrl.search = '';
siteUrl.hash = '';

const basePath = siteUrl.pathname;
const displayName = pkg.name;
const githubUrl = repository.url;
const npmUrl = `https://www.npmjs.com/package/${pkg.name}`;
const primary = {
  light: {
    base: '#087f5b',
    hover: '#06694b',
    active: '#05543d',
    soft: '#def7ed',
    rgb: '8, 127, 91',
    hoverRgb: '6, 105, 75',
  },
  dark: {
    base: '#63e6be',
    hover: '#96f2d7',
    active: '#c3fae8',
    soft: '#173f34',
    rgb: '99, 230, 190',
    hoverRgb: '150, 242, 215',
  },
};
const theme = {
  storageKey: `${packageConfig.bundleBaseName}-theme`,
  colorPrimary: primary.light.base,
  colorLight: '#f5faf8',
  colorDark: '#0b1713',
  primary,
};
const pages = {
  home: {
    title: `${displayName} - 微信 App 唤起开放标签工具`,
    description:
      '为网页元素生成 wx-open-launch-app 开放标签，并配置微信 JS-SDK 签名、生命周期回调和失败跳转。',
    url: siteUrl.href,
  },
  playground: {
    title: `${displayName} Playground - 模拟开放标签生成`,
    description:
      '使用本地模拟的微信 JS-SDK，体验 mazey-wechat-launch-app 的公开工厂函数、配置和开放标签生成结果。',
    url: new URL('playground/', siteUrl).href,
  },
  api: {
    title: `${displayName} API 文档`,
    description:
      'mazey-wechat-launch-app 的 TypeScript API 文档，包含工厂选项、分享配置和生命周期方法。',
    url: new URL('api/', siteUrl).href,
  },
};
const assets = {
  faviconFile: 'logo.svg',
  faviconType: 'image/svg+xml',
  logoFile: 'logo.svg',
  openGraphImageFile: 'open-graph-1200x630.png',
};
const software = {
  '@type': 'SoftwareSourceCode',
  name: displayName,
  description: pkg.description,
  url: pages.home.url,
  codeRepository: githubUrl,
  downloadUrl: npmUrl,
  license: `${githubUrl}/blob/main/LICENSE`,
  programmingLanguage: 'TypeScript',
};

module.exports = deepFreeze({
  package: packageConfig,
  repository,
  brand: {
    displayName,
    shortName: 'WeChat Launch App',
  },
  urls: {
    github: githubUrl,
    npm: npmUrl,
    license: `${githubUrl}/blob/main/LICENSE`,
    sitemap: new URL('sitemap.xml', siteUrl).href,
  },
  assets: {
    ...assets,
    faviconUrl: `${basePath}images/${assets.faviconFile}`,
    logoUrl: `${basePath}images/${assets.logoFile}`,
  },
  site: {
    url: siteUrl.href,
    basePath,
    markerPrefix: packageConfig.bundleBaseName,
    pages,
    theme,
  },
  seo: {
    software,
    openGraphImage: {
      file: assets.openGraphImageFile,
      url: new URL(`images/${assets.openGraphImageFile}`, siteUrl).href,
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: 'mazey-wechat-launch-app 的微信开放标签与 App 跳转示意图。',
    },
    rootJsonLd: {
      '@context': 'https://schema.org',
      ...software,
    },
    playgroundJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${displayName} Playground`,
      description: pages.playground.description,
      url: pages.playground.url,
      isPartOf: {
        '@type': 'WebSite',
        name: displayName,
        url: pages.home.url,
      },
      about: software,
    },
  },
  pwa: {
    name: `${displayName} 文档`,
    shortName: 'Launch App',
    display: 'standalone',
    backgroundColor: theme.colorLight,
    themeColor: theme.colorPrimary,
    manifestUrl: `${basePath}manifest.webmanifest`,
    serviceWorkerUrl: `${basePath}service-worker.js`,
    cachePrefix: `${packageConfig.bundleBaseName}-site-`,
    description: `${displayName} 的项目网站、Playground 和 TypeScript API 文档。`,
    icons: [
      {
        file: 'icon-192.png',
        src: `${basePath}images/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        file: 'icon-512.png',
        src: `${basePath}images/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        file: 'icon-maskable-512.png',
        src: `${basePath}images/icon-maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
});

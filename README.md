<!-- omit from toc -->

# mazey-wechat-launch-app

[![NPM version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/mazey-wechat-launch-app
[npm-url]: https://npmjs.org/package/mazey-wechat-launch-app
[l-image]: https://img.shields.io/npm/l/mazey-wechat-launch-app
[l-url]: https://github.com/chengchuu/mazey-wechat-launch-app

生成微信（WeChat/Weixin）跳转 App 所需要的按钮，经过灵活配置，可支持生成单/多个按钮。

项目网站：[首页](https://chengchuu.github.io/mazey-wechat-launch-app/) · [Playground](https://chengchuu.github.io/mazey-wechat-launch-app/playground/) · [API 文档](https://chengchuu.github.io/mazey-wechat-launch-app/api/)

**Table of Contents**

- [Install](#install)
- [Usage](#usage)
  - [使用 npm](#使用-npm)
  - [使用 CDN](#使用-cdn)
- [API](#api)
  - [参数](#参数)
  - [方法](#方法)
- [FAQ](#faq)
- [Contributing](#contributing)
  - [Development Environment](#development-environment)
  - [Scripts](#scripts)
- [License](#license)

## Install

使用 [npm](https://www.npmjs.com/package/mazey-wechat-launch-app) 安装 mazey-wechat-launch-app：

```bash
npm install mazey-wechat-launch-app --save
```

## Usage

### 使用 npm

```javascript
import LAUNCH_APP from 'mazey-wechat-launch-app';

const options = {
  weixinJsSdkTicket: 'bxLdikRXVb',
  launchContainerQuery: '.example-btn',
  serviceAccountAppId: 'wx123',
  openPlatformMobileAppId: 'wx456',
  extInfo: 'example://example/example',
};
const app = LAUNCH_APP(options);
app.start({});
```

`<div class="example-btn"><span>打开</span></div>` 生成的 HTML 结构如下：

```html
<div class="example-btn mazey-launch-app-tag-0">
  <span>打开</span>
  <wx-open-launch-app
    id="mazey-launch-app-btn-prefix-mazey-launch-app-tag-0"
    appid="wx456"
    extinfo="example://example/example"
    style="z-index: 99; position: absolute; width: 100%; height: 100%; opacity: 1; background: transparent; overflow: hidden; left: 0;"
  >
    <script type="text/wxtag-template">
      <style>.mazey-launch-app-inner-btn { opacity: 0; width: 100%; height: 100%; backgroud: transparent; color: #300f54; border: none; box-sizing: border-box; text-align: center; vertical-align: middle; }</style>
      <button class="mazey-launch-app-inner-btn">Launch App <br /><br /><br /></button>
    </script>
  </wx-open-launch-app>
</div>
```

注意：本项目依赖 [WeChat JS-SDK](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#3)，请确保已经引入，程序会在初始化的时候探测 `window.wx`。

### 使用 CDN

```html
<script
  type="text/javascript"
  src="//res.wx.qq.com/open/js/jweixin-1.6.0.js"
></script>
<script
  type="text/javascript"
  src="//cdn.jsdelivr.net/npm/mazey-wechat-launch-app@latest/lib/launch-app.min.js"
></script>
<script>
  var options = {
    weixinJsSdkTicket: 'bxLdikRXVb',
    launchContainerQuery: '.example-btn',
    serviceAccountAppId: 'wx123',
    openPlatformMobileAppId: 'wx456',
    extInfo: 'example://example/example',
  };
  var app = window.LAUNCH_APP(options);
  app.start({});
</script>
```

提示：如果项目里面已经使用了 jQuery、js-sha1、mazey 依赖库，可以使用体积更小的版本 [`v2.1.4`](https://cdn.jsdelivr.net/npm/mazey-wechat-launch-app@2.1.4/lib/launch-app.min.js)。

## API

### 参数

| 参数                      | 说明                                                                                                                                                           | 类型   | 值                                             |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :--------------------------------------------- |
| `weixinJsSdkTicket`       | [jsapi_ticket](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#62) 公众号用于调用微信 JS 接口的临时票据                               | string | （必填）例如：`bxLdikRXVb`                     |
| `launchContainerQuery`    | [selectors](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Selectors) 有效的 CSS 选择器字符串，通常是填充按钮的父容器                                    | string | （必填）例如：`.example-btn`, `#example-btn`   |
| `serviceAccountAppId`     | 公众号的唯一标识 AppId                                                                                                                                         | string | （必填）例如：`wx123`                          |
| `openPlatformMobileAppId` | 开放平台内所需跳转的移动应用的 AppId                                                                                                                           | string | （可选）例如：`wx456`                          |
| `extInfo`                 | [extinfo](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_Open_Tag.html#%E8%B7%B3%E8%BD%ACAPP%EF%BC%9Awx-open-launch-app) 跳转所需额外信息 | string | （可选）例如：`example://example/example`      |
| `launchBtnStyle`          | 按钮内联样式                                                                                                                                                   | string | （可选）例如：`top:0;right:0;bottom:0;left:0;` |
| `launchBtnText`           | 按钮文字                                                                                                                                                       | string | （可选）例如：`打开 App`                       |

### 方法

| 方法      | 说明 | 类型     |
| :-------- | :--- | :------- |
| `start`   | 生成 | function |
| `update`  | 更新 | function |
| `destroy` | 销毁 | function |

## FAQ

**1\. 为什么微信里面通过分享卡片能唤起，直接打开链接却无法唤起的？**

截止 2023-08-10，只有微信 SDK 生成的卡片和服务号推送的消息才能唤起 App。

**2\. 如何修改按钮样式？**

方法一（推荐）：

如官方所说，模版的样式是和页面隔离的，建议将此处透明的开放标签覆盖在原按钮上，这样就可以保留原按钮的样式，同时又可以实现点击跳转。

方法二：

通过 `launchBtnStyle` 参数添加内联样式，通过 `launchBtnText` 参数修改按钮文字。

**3\. 如何确保满足唤起的所有前置条件？**

（1）开放平台、服务号已认证，并且主体一致；

（2）开放平台绑定服务号；

（3）开放平台绑定移动应用，并且已认证；

（4）服务号绑定域名。

## Contributing

### Development Environment

| Dependencies | Version                    |
| ------------ | -------------------------- |
| Node.js      | v22.15.0 or later in v22.x |

Use npm, pnpm, or Yarn to install dependencies and run scripts. CI uses the committed pnpm
lockfile for reproducible builds.

### Scripts

Run `npm install`, then use:

- `npm run dev` to start the development server.
- `npm run build` to build the package.
- `npm run lint` to lint the source.
- `npm test` to run the tests.
- `npm run docs` to build and validate the GitHub Pages artifact.

## License

This software is released under the terms of the [MIT license](https://github.com/chengchuu/mazey-wechat-launch-app/blob/main/LICENSE).

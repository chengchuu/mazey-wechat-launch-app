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

```bash
npm install mazey-wechat-launch-app
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

### 分享配置与更新

好友分享使用 `updateAppMessageShareDataOptions`，类型为 `UpdateAppMessageShareDataOptions`，包含 `title`、`desc`、`link` 和 `imgUrl`。朋友圈分享使用 `updateTimelineShareDataOptions`，类型为 `UpdateTimelineShareDataOptions`，包含 `title`、`link` 和 `imgUrl`。两种配置都支持可选的 `success` 回调。

`success` 表示分享数据设置成功，不表示用户已完成分享。分享链接需符合微信 JS 安全域名要求。

`onMenuShareAppMessageOptions`、`onMenuShareTimelineOptions` 和对应旧类型继续兼容，但已标记为 deprecated。每个渠道的新配置不为 `undefined` 时，采用完整的新配置，不合并旧配置字段。旧参数中的 `type`、`dataUrl` 和 `cancel` 不会传给新接口。

```typescript
const app = LAUNCH_APP({
  weixinJsSdkTicket: 'valid-ticket',
  serviceAccountAppId: 'wx-service',
  updateAppMessageShareDataOptions: {
    title: '分享标题',
    desc: '分享描述',
    link: 'https://example.com/',
    imgUrl: 'https://example.com/icon.png',
  },
});

app.LAUNCH_APP_SHARE_TIMELINE({
  title: '朋友圈标题',
  link: 'https://example.com/',
  imgUrl: 'https://example.com/icon.png',
});
app.start({});
```

返回值中的 `LAUNCH_APP_SHARE_APP_MESSAGE` 和 `LAUNCH_APP_SHARE_TIMELINE`，与对应的 `window.LAUNCH_APP_*` 属性引用相同函数。工厂创建后即可调用；仍需调用 `start()` 初始化 SDK。ready 前每个渠道只保留最新配置，方法调用优先于工厂初始配置。ready 后调用方法会立即更新分享数据，无需提供 `openPlatformMobileAppId`。未配置的渠道不主动调用 SDK。

参考：[微信 JS-SDK 文档](https://developers.weixin.qq.com/doc/service/guide/h5/jssdk.html)。

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

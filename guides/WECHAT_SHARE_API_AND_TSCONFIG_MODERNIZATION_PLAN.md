# 微信分享接口迁移与 TypeScript 配置现代化计划

## 背景与目标

微信已将 `wx.onMenuShareAppMessage` 和 `wx.onMenuShareTimeline` 标记为即将废弃。项目需要迁移到 `wx.updateAppMessageShareData` 和 `wx.updateTimelineShareData`。迁移必须兼容现有公共参数，并修复工厂返回的分享方法只记录日志的问题。

项目同时需要更新 `tsconfig.json`。新配置应适配 TypeScript 5.9、Rollup 和 Babel。TypeScript 负责现代语法和类型检查，Babel 继续负责发布产物的浏览器兼容性。

参考文档：<https://developers.weixin.qq.com/doc/service/guide/h5/jssdk.html>

## 分享接口迁移

- 在 `wx.config.jsApiList` 中使用 `updateAppMessageShareData` 和 `updateTimelineShareData`，并移除两个旧分享接口。保留 `showOptionMenu`。
- 新增 `updateAppMessageShareDataOptions` 和 `updateTimelineShareDataOptions`。对应的公开类型只包含新接口支持的字段。
- 保留 `onMenuShareAppMessageOptions`、`onMenuShareTimelineOptions` 和旧类型。通过 JSDoc 将他们标记为 deprecated，不输出运行时警告。
- 新旧参数同时出现时，新参数优先。内部只调用新 SDK 接口，不同时调用新旧接口。
- 旧参数中的 `type`、`dataUrl` 和 `cancel` 继续用于类型兼容，但不传给新接口。
- 保留 `LAUNCH_APP_SHARE_APP_MESSAGE` 和 `LAUNCH_APP_SHARE_TIMELINE` 方法名，避免破坏公共 API。
- 工厂返回方法与 `window.LAUNCH_APP_SHARE_*` 使用同一组稳定函数。不得在 `wx.ready` 中用不同函数覆盖全局方法。
- ready 前调用分享方法时，保存每个分享渠道的最新配置。SDK ready 后，每个存在配置的渠道调用一次。ready 后调用时，立即更新对应的分享数据。
- 工厂初始配置和 ready 前方法调用同时存在时，最后一次方法调用优先。不同分享渠道分别维护状态。
- `success` 仅表示分享数据设置成功，不表示用户已完成分享。README 和公开类型注释必须明确该语义。

本次不为微信客户端 6.7.2 或 JSSDK 1.4.0 以前的环境提供旧接口回退。

## TypeScript 配置现代化

- 将 `target` 更新为 `ES2022`，保留 `module: "ESNext"`，并使用 `moduleResolution: "Bundler"`。
- 将 `lib` 精简为 `ES2022`、`DOM` 和 `DOM.Iterable`。移除 `ES5`、`ESNext` 和 `ScriptHost` 的旧组合。
- 启用 `exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`noImplicitReturns`、`noFallthroughCasesInSwitch`、`isolatedModules`、`verbatimModuleSyntax` 和 `moduleDetection: "force"`。
- 继续启用 `strict`，删除 `noImplicitThis: false`。由严格模式启用 `noImplicitThis`。
- 删除多余的 `baseUrl`、`paths` 和 `allowSyntheticDefaultImports`。依赖包已经提供可由 Bundler 解析策略发现的类型声明。
- 保留 `esModuleInterop`、`declaration`、`declarationMap`、`sourceMap`、`importHelpers`、`skipLibCheck` 和 `forceConsistentCasingInFileNames`。
- 保留现有的 `include`、`exclude` 和 `typedocOptions`。将 schema URL 更新为 HTTPS，并删除旧版模板注释。
- 不启用 `noPropertyAccessFromIndexSignature`。该选项会要求无关的站点代码改写 `dataset` 属性访问。
- 保留 `tsconfig.site.json` 的 `ES2018` target 覆盖。他继续继承适用的严格检查。

为满足 `exactOptionalPropertyTypes`，需要提取明确的公共选项类型和内部默认选项类型。内部类型应显式表达可能为 `undefined` 的分享配置。不得借此改变 `defaultOptions` 当前的跨实例变异行为。

## 文档与示例

- 更新 README 的参数和方法说明，记录新参数、deprecated 旧参数、优先级及回调语义。
- 更新 Playground 的微信 SDK mock，使他只提供两个新分享接口。
- 保持 `typing.d.ts`、源代码导出类型和 `window.LAUNCH_APP_*` 声明同步。
- 不手工修改 `lib`、`dist-dev`、`docs`、`.pages-api` 或 `coverage`。

## 测试计划

- 验证 `jsApiList` 包含两个新接口，不包含两个旧接口。
- 验证两个新配置参数调用对应的新 SDK 接口。
- 验证旧配置参数仍可编译和运行，新旧参数并存时采用新参数。
- 验证旧字段不会传给新接口。
- 使用延迟触发的 `wx.ready` 验证 ready 前只保留各渠道的最新配置。
- 验证 ready 后的方法调用立即更新分享数据。
- 验证工厂返回方法和 `window.LAUNCH_APP_SHARE_*` 行为一致，且不会造成重复调用。
- 验证 TypeScript 严格配置同时覆盖包源代码、Playground 和站点源代码。
- 检查 CJS、ESM、IIFE 和声明输出。确认 Babel 仍按现有浏览器目标处理发布 JavaScript。

完成实现后运行：

```bash
npm run preview
git diff --check
npm pack --dry-run
```

## 范围限制

- 不处理 `defaultOptions` 的跨实例变异。
- 不改变缺少 `window.wx` 时的现有错误流程。
- 不扩展 `destroy()` 的 DOM、样式或事件清理行为。
- 不修改包版本、发布工作流或发布分支。
- 不执行提交、推送、发布或部署。

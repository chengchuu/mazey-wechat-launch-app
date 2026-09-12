import {
  genCustomConsole,
  generateRndNum,
  addStyle,
  getQueryParam,
} from 'mazey';
import $ from 'jquery';
import sha1 from 'js-sha1';

export interface UpdateTimelineShareDataOptions {
  title: string;
  link: string;
  imgUrl: string;
  /** Called when share data is configured, not when the user shares. */
  success?: () => void;
}

export interface UpdateAppMessageShareDataOptions extends UpdateTimelineShareDataOptions {
  desc: string;
}

/** @deprecated Use UpdateTimelineShareDataOptions. */
export interface MenuShareTimelineOptions {
  title: string;
  link: string;
  imgUrl: string;
  /** Called when share data is configured, not when the user shares. */
  success: () => void;
  cancel: () => void;
}

/** @deprecated Use UpdateAppMessageShareDataOptions. */
export interface MenuShareAppMessageOptions {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
  type: string;
  dataUrl: string;
  /** Called when share data is configured, not when the user shares. */
  success: () => void;
  cancel: () => void;
}

export type LAUNCH_APP_SHARE_TIMELINE = (
  options: UpdateTimelineShareDataOptions | MenuShareTimelineOptions
) => void;

export type LAUNCH_APP_SHARE_APP_MESSAGE = (
  options: UpdateAppMessageShareDataOptions | MenuShareAppMessageOptions
) => void;

export interface retVal {
  LAUNCH_APP_UPDATE(data: any): void;
  LAUNCH_APP_BEFORE_DESTROY(): void;
  LAUNCH_APP_SHOW_WEIXIN_TO_BROWSER(): void;
  LAUNCH_APP_SHARE_TIMELINE: LAUNCH_APP_SHARE_TIMELINE;
  LAUNCH_APP_SHARE_APP_MESSAGE: LAUNCH_APP_SHARE_APP_MESSAGE;
  start(data: any): void;
  update(data: any): void;
  destroy(): void;
}

export interface LaunchAppOptions {
  weixinJsSdkTicket?: string;
  launchContainerQuery?: string;
  genTagPrefixStr?: string;
  launchShowWeixinToBrowserImgUrl?: string;
  canShowWeixinToBrowser?: boolean;
  launchShowWeixinToBrowserClassName?: string;
  launchBtnClassName?: string;
  launchBtnStyle?: string;
  launchBtnText?: string;
  launchErrorLink?: string;
  extInfo?: string;
  serviceAccountAppId?: string;
  wexinServiceAccountAppId?: string;
  openPlatformMobileAppId?: string;
  canContinuousUpdating?: boolean;
  updateTimelineShareDataOptions?: UpdateTimelineShareDataOptions | undefined;
  updateAppMessageShareDataOptions?:
    UpdateAppMessageShareDataOptions | undefined;
  /** @deprecated Use updateTimelineShareDataOptions. */
  onMenuShareTimelineOptions?: MenuShareTimelineOptions | undefined;
  /** @deprecated Use updateAppMessageShareDataOptions. */
  onMenuShareAppMessageOptions?: MenuShareAppMessageOptions | undefined;
  isConClosed?: boolean;
  isWxDebug?: boolean;
  openTagList?: string[];
  canLaunchApp?: (data: any) => boolean;
  canFireErrorLinkDirectly?: () => boolean;
  launchBtnClick?: () => void;
  launchReady?: () => void;
}

type DefaultOptions = { [K in keyof LaunchAppOptions]-?: LaunchAppOptions[K] };

// Defaults intentionally persist across factory calls.
const defaultOptions: DefaultOptions = {
  weixinJsSdkTicket: '',
  launchContainerQuery: '.mazey-launch-app-selector',
  launchShowWeixinToBrowserImgUrl: '',
  canShowWeixinToBrowser: false,
  extInfo: '',
  serviceAccountAppId: '',
  wexinServiceAccountAppId: '', // Alias, same as serviceAccountAppId, will be deprecated. But still works. Compatible with old version.
  openPlatformMobileAppId: '',
  genTagPrefixStr: 'mazey-launch-app-btn-prefix-',
  launchShowWeixinToBrowserClassName: 'mazey-launch-app-wx-to-browser',
  launchBtnClassName: 'mazey-launch-app-inner-btn',
  launchBtnStyle: '', // 'top:0;right:0;bottom:0;left:0;' +
  launchBtnText: 'Launch App <br /><br /><br />',
  launchErrorLink: '',
  canContinuousUpdating: false,
  onMenuShareTimelineOptions: undefined,
  onMenuShareAppMessageOptions: undefined,
  updateTimelineShareDataOptions: undefined,
  updateAppMessageShareDataOptions: undefined,
  isConClosed: true,
  isWxDebug: false,
  openTagList: ['wx-open-launch-app'],
  canLaunchApp: () => true,
  canFireErrorLinkDirectly: () => false,
  launchBtnClick: () => undefined,
  launchReady: () => undefined,
};

/**
 * Launch App
 *
 * @returns Lifecycle and share-data methods.
 */
export default (options: LaunchAppOptions = defaultOptions): retVal => {
  const _options = Object.assign(defaultOptions, options);
  const {
    weixinJsSdkTicket,
    launchContainerQuery,
    genTagPrefixStr,
    launchShowWeixinToBrowserImgUrl,
    canShowWeixinToBrowser,
    launchShowWeixinToBrowserClassName,
    launchBtnClassName,
    launchBtnStyle,
    launchBtnText,
    launchErrorLink,
    wexinServiceAccountAppId,
    openPlatformMobileAppId,
    canContinuousUpdating,
    onMenuShareTimelineOptions,
    onMenuShareAppMessageOptions,
    updateTimelineShareDataOptions,
    updateAppMessageShareDataOptions,
    isConClosed,
    isWxDebug,
    openTagList,
    canLaunchApp,
    canFireErrorLinkDirectly,
    launchBtnClick,
    launchReady,
  } = _options;
  let { serviceAccountAppId, extInfo } = _options;
  const LaunchCon = genCustomConsole('LaunchCon:', {
    isClosed: isConClosed,
  });
  const wx = window.wx;
  if (!wx) {
    console.error('Launch App: wx is not found');
  }
  let batchGenerateWxTagFn: () => void = () => undefined;
  LaunchCon.log('Launch App');

  const defaultShareOptions = {
    title: document.title,
    link: location.href,
    imgUrl: '',
  };
  const defaultMessageOptions = { ...defaultShareOptions, desc: '' };
  let sdkReady = false;
  let timelineOptions =
    updateTimelineShareDataOptions !== undefined
      ? updateTimelineShareDataOptions
      : onMenuShareTimelineOptions;
  let messageOptions =
    updateAppMessageShareDataOptions !== undefined
      ? updateAppMessageShareDataOptions
      : onMenuShareAppMessageOptions;

  const sendTimeline = (opt: UpdateTimelineShareDataOptions): void => {
    const { title, link, imgUrl, success } = opt;
    wx.updateTimelineShareData({
      title,
      link,
      imgUrl,
      ...(success === undefined ? {} : { success }),
    });
  };
  const sendMessage = (opt: UpdateAppMessageShareDataOptions): void => {
    const { title, desc, link, imgUrl, success } = opt;
    wx.updateAppMessageShareData({
      title,
      desc,
      link,
      imgUrl,
      ...(success === undefined ? {} : { success }),
    });
  };
  const LAUNCH_APP_SHARE_TIMELINE: LAUNCH_APP_SHARE_TIMELINE = (opt) => {
    timelineOptions = { ...defaultShareOptions, ...opt };
    if (sdkReady) sendTimeline(timelineOptions);
  };
  const LAUNCH_APP_SHARE_APP_MESSAGE: LAUNCH_APP_SHARE_APP_MESSAGE = (opt) => {
    messageOptions = { ...defaultMessageOptions, ...opt };
    if (sdkReady) sendMessage(messageOptions);
  };
  window.LAUNCH_APP_SHARE_TIMELINE = LAUNCH_APP_SHARE_TIMELINE;
  window.LAUNCH_APP_SHARE_APP_MESSAGE = LAUNCH_APP_SHARE_APP_MESSAGE;
  const genLaunchBtn = (content = '', extStyle = '', tagName = 'button') => {
    const str =
      `<style>.${launchBtnClassName}{` +
      'opacity: 0;' +
      'width: 100%;' +
      'height: 100%;' +
      'backgroud: transparent;' +
      'color: #300f54;' +
      'border: none;' +
      'box-sizing: border-box;' +
      'text-align: center;' +
      'vertical-align: middle;' +
      launchBtnStyle +
      extStyle +
      '}</style>' +
      `<${tagName} class="${launchBtnClassName}"` +
      (content && tagName === 'button' ? ` onclick="${content}"` : '') +
      (content && tagName === 'a' ? ` target="_self" href="${content}"` : '') +
      '>' +
      launchBtnText +
      `</${tagName}>`;
    return str;
  };
  const launchBtn = genLaunchBtn();

  function renderWXOpenLaunchApp(
    serviceAccountAppId = '',
    openPlatformMobileAppId = ''
  ) {
    LaunchCon.log('renderWXOpenLaunchApp');
    sdkReady = false;

    return Promise.all([getTicket(), loadSha1()])
      .then((allRes) => {
        LaunchCon.log('allRes', allRes);
        const ticket = allRes[0];
        if (!ticket) {
          LaunchCon.error('weixinJsSdkTicket is required');
          return;
        }
        const sha1 = allRes[1];
        if (!sha1) {
          LaunchCon.error('sha1 is required');
          return;
        }
        const noncestr = generateRndNum(7);
        const jsapi_ticket = ticket;
        const timestamp = new Date().getTime();
        const url = location.href;
        const string1 =
          'jsapi_ticket=' +
          jsapi_ticket +
          '&noncestr=' +
          noncestr +
          '&timestamp=' +
          timestamp +
          '&url=' +
          url;
        const signature = sha1(string1);
        wx.config({
          debug: isWxDebug, // 开启调试模式,调用的所有 api 的返回值会在客户端 alert 出来，若要查看传入的参数，可以在 pc 端打开，参数信息会通过 log 打出，仅在 pc 端时才会打印
          appId: serviceAccountAppId, // 必填，公众号/服务号的唯一标识
          timestamp: timestamp, // 必填，生成签名的时间戳
          nonceStr: noncestr, // 必填，生成签名的随机串
          signature: signature, // 必填，签名
          jsApiList: [
            'showOptionMenu',
            'updateTimelineShareData',
            'updateAppMessageShareData',
          ], // 必填，需要使用的 JS 接口列表
          openTagList, // 可选，需要使用的开放标签列表
        });
        wx.ready(function () {
          // config 信息验证后会执行 ready 方法，所有接口调用都必须在 config 接口获得结果之后，config 是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在 ready 函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在 ready 函数中
          sdkReady = true;
          if (messageOptions !== undefined) sendMessage(messageOptions);
          if (timelineOptions !== undefined) sendTimeline(timelineOptions);
          // Launch App
          if (!openPlatformMobileAppId) {
            LaunchCon.log(
              'openPlatformMobileAppId is required for weixin launch app'
            );
            return;
          }
          window.LAUNCH_APP_READY = true;
          launchReady && launchReady();
          const batchGenerateWxTag = () => {
            const containers = $(launchContainerQuery);
            LaunchCon.log(
              'containers',
              launchContainerQuery,
              containers,
              containers.length
            );
            if (containers.length > 0) {
              containers.each(function (index: number, el: any) {
                // Key
                let key = $(el).attr('data-launch-app-key');
                if (!key) {
                  const keyEle = $(el).parents('[data-launch-app-key]:eq(0)');
                  if (keyEle.length > 0) {
                    key = keyEle.attr('data-launch-app-key');
                    LaunchCon.log('keyEle', keyEle, key);
                  }
                }
                if (!key) {
                  key = String(index);
                }
                const positionDomClass = `mazey-launch-app-tag-${key}`;
                const tag = $(`.${positionDomClass} wx-open-launch-app`);
                // Ext Info
                let eleExtInfo = $(el).attr('data-launch-app-ext-info');
                if (!eleExtInfo) {
                  const eleExtInfoEle = $(el).parents(
                    '[data-launch-app-ext-info]:eq(0)'
                  );
                  if (eleExtInfoEle.length > 0) {
                    eleExtInfo = eleExtInfoEle.attr('data-launch-app-ext-info');
                    LaunchCon.log(
                      'eleExtInfoEle parents',
                      eleExtInfoEle,
                      eleExtInfo
                    );
                  }
                }
                if (eleExtInfo) {
                  extInfo = eleExtInfo;
                }
                // Error Link
                let eleErrorLink = $(el).attr('data-launch-app-error-link');
                if (!eleErrorLink) {
                  const eleErrorLinkEle = $(el).parents(
                    '[data-launch-app-error-link]:eq(0)'
                  );
                  if (eleErrorLinkEle.length > 0) {
                    eleErrorLink = eleErrorLinkEle.attr(
                      'data-launch-app-error-link'
                    );
                    LaunchCon.log(
                      'eleErrorLinkEle parents',
                      eleErrorLinkEle,
                      eleErrorLink
                    );
                  }
                }
                let realErrorLink = launchErrorLink;
                if (eleErrorLink) {
                  realErrorLink = eleErrorLink;
                }
                const genTag = (positionDomClass: string) => {
                  const prefix = genTagPrefixStr;
                  const positionDomId = prefix + positionDomClass;
                  const tagStr =
                    '<wx-open-launch-app' +
                    " id='" +
                    positionDomId +
                    "' appid='" +
                    openPlatformMobileAppId +
                    `' extinfo='${extInfo}` +
                    "'" +
                    " style='z-index:99;position:absolute;width:100%;height:100%;opacity:1;background:transparent;overflow:hidden;left:0;'" +
                    '>' +
                    "<script type='text/wxtag-template'>" +
                    launchBtn +
                    '</script>' +
                    '</wx-open-launch-app>';
                  $('.' + positionDomClass + ':eq(0)').append(tagStr);
                  const mazeyLaunchBtn = document.getElementById(positionDomId);
                  if (mazeyLaunchBtn) {
                    mazeyLaunchBtn.addEventListener('ready', function (e) {
                      // Ready
                      LaunchCon.log('ready event', e);
                    });
                    mazeyLaunchBtn.addEventListener(
                      'launch',
                      function (e: any) {
                        // Launch
                        LaunchCon.log('launch event', e);
                        if (e.detail && e.detail.extInfo) {
                          LaunchCon.log('launch extInfo', e.detail.extInfo);
                        }
                      }
                    );
                    mazeyLaunchBtn.addEventListener('error', function (e: any) {
                      // Error
                      LaunchCon.error(e.detail);
                      // Prefix
                      $("[id^='" + prefix + "']").hide();
                      if (canShowWeixinToBrowser) {
                        launchShowWeixinToBrowser();
                      }
                      if (realErrorLink) {
                        LaunchCon.log('realErrorLink', realErrorLink);
                        location.href = realErrorLink;
                      }
                    });
                    mazeyLaunchBtn.addEventListener('click', function (e) {
                      LaunchCon.log('click event', e);
                      launchBtnClick && launchBtnClick();
                    });
                  }
                };
                if (tag.length === 0) {
                  $(el).addClass(positionDomClass);
                  LaunchCon.log('success:', positionDomClass);
                  genTag(positionDomClass);
                }
              });
            }
          };
          batchGenerateWxTag();
          batchGenerateWxTagFn = batchGenerateWxTag;
        });
        wx.error(function (res: any) {
          LaunchCon.error(res);
        });
        return 'success:launch_app';
      })
      .catch((err) => {
        LaunchCon.error(err);
      });
  }

  function launchShowWeixinToBrowser() {
    const styleStr =
      '.mazey-launch-app-mask{' +
      'position:fixed;' +
      'top:0;right:0;bottom:0;left:0;' +
      'background-color:rgba(0, 0, 0, .5);' +
      'text-align:right;' +
      'font-size:0;' +
      'white-space:nowrap;' +
      'overflow:auto;' +
      'z-index:999;' +
      '}' +
      '.mazey-launch-app-img{' +
      'display:inline-block;' +
      'vertical-align:middle;' +
      'text-align:left;' +
      'font-size:14px;' +
      'white-space:normal;' +
      'width:50vw;' +
      'margin:0.5rem 0.5rem 0 0;' +
      '}' +
      '.mazey-launch-app-img:after{' +
      'content:"";' +
      'display:inline-block;' +
      'height:100%;' +
      'vertical-align:middle;' +
      '}';
    addStyle(styleStr, {
      id: 'mazey-launch-app-mask-style',
    });
    if (!window.LAUNCH_APP_HIDE_WEIXIN_BROWSER) {
      window.LAUNCH_APP_HIDE_WEIXIN_BROWSER = function () {
        $('.mazey-launch-app-mask').hide();
      };
    }
    if ($('.mazey-launch-app-mask').length === 0) {
      $('body').append(
        "<div class='mazey-launch-app-mask' onclick='window.LAUNCH_APP_HIDE_WEIXIN_BROWSER()'>" +
          '<img ' +
          `class='mazey-launch-app-img ${launchShowWeixinToBrowserClassName}' ` +
          `src='${launchShowWeixinToBrowserImgUrl}' ` +
          "alt='Launch App' " +
          '/>' +
          '</div>'
      );
    } else {
      $('.mazey-launch-app-mask').show();
    }
  }

  function renderWeixinLaunchTemplate() {
    LaunchCon.log('renderWeixinLaunchTemplate');
    if (!serviceAccountAppId && wexinServiceAccountAppId) {
      console.warn(
        'wexinServiceAccountAppId will be deprecated, use serviceAccountAppId instead.'
      );
      serviceAccountAppId = wexinServiceAccountAppId;
    }
    renderWXOpenLaunchApp(serviceAccountAppId, openPlatformMobileAppId);
  }

  function loadSha1() {
    return Promise.resolve(sha1);
  }

  function getTicket() {
    return Promise.resolve(
      weixinJsSdkTicket ||
        window.LAUNCH_APP_WEIXIN_JS_SDK_TICKET ||
        getQueryParam('weixinJsSdkTicket') ||
        ''
    );
  }

  function destroyWeixinLaunchEvent() {
    window.LAUNCH_APP_LOAD = null;
    window.LAUNCH_APP_HIDE_WEIXIN_BROWSER = null;
  }

  function appUpdated(data: any = {}) {
    LaunchCon.log('appUpdated', data);
    if (!window.LAUNCH_APP_LOAD && canLaunchApp(data)) {
      renderWeixinLaunchTemplate();
      window.LAUNCH_APP_LOAD = true;
    }
    if (canContinuousUpdating && window.LAUNCH_APP_LOAD && canLaunchApp(data)) {
      batchGenerateWxTagFn();
    }
    // Failback
    if (canFireErrorLinkDirectly()) {
      const containers = $(launchContainerQuery);
      if (containers.length > 0) {
        containers.each(function (index: number, el: any) {
          const c = $(el).children('.' + launchBtnClassName);
          if (c && c.length) {
            return;
          }
          // Error Link
          let eleErrorLink = $(el).attr('data-launch-app-error-link');
          if (!eleErrorLink) {
            const eleErrorLinkEle = $(el).parents(
              '[data-launch-app-error-link]:eq(0)'
            );
            if (eleErrorLinkEle.length > 0) {
              eleErrorLink = eleErrorLinkEle.attr('data-launch-app-error-link');
            }
          }
          if (
            eleErrorLink &&
            typeof eleErrorLink === 'string' &&
            eleErrorLink.length
          ) {
            const launchBtn = genLaunchBtn(
              eleErrorLink,
              'position:absolute;left:0;z-index:999;',
              'a'
            );
            $(el).append(launchBtn);
          }
        });
      }
    }
  }

  function appBeforeDestroy() {
    LaunchCon.log('appBeforeDestroy', appBeforeDestroy);
    destroyWeixinLaunchEvent();
  }

  window.LAUNCH_APP_UPDATE = appUpdated;
  window.LAUNCH_APP_BEFORE_DESTROY = appBeforeDestroy;
  window.LAUNCH_APP_SHOW_WEIXIN_TO_BROWSER = launchShowWeixinToBrowser;

  return {
    LAUNCH_APP_UPDATE: appUpdated,
    LAUNCH_APP_BEFORE_DESTROY: appBeforeDestroy,
    LAUNCH_APP_SHOW_WEIXIN_TO_BROWSER: launchShowWeixinToBrowser,
    LAUNCH_APP_SHARE_TIMELINE,
    LAUNCH_APP_SHARE_APP_MESSAGE,
    // Alias
    start: appUpdated,
    update: appUpdated, // Same as start
    destroy: appBeforeDestroy,
  };
};

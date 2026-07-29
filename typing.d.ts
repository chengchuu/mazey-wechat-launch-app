/**
 * @author Cheng
 */

import type {
  LAUNCH_APP_SHARE_APP_MESSAGE,
  LAUNCH_APP_SHARE_TIMELINE,
} from './src/index';

declare global {
  interface Window {
    // METHOD
    LAUNCH_APP_UPDATE(data: any): void;
    LAUNCH_APP_BEFORE_DESTROY(): void;
    LAUNCH_APP_SHOW_WEIXIN_TO_BROWSER(): void;
    LAUNCH_APP_SHARE_TIMELINE: LAUNCH_APP_SHARE_TIMELINE;
    LAUNCH_APP_SHARE_APP_MESSAGE: LAUNCH_APP_SHARE_APP_MESSAGE;
    // VAR
    LAUNCH_APP_LOAD: any;
    LAUNCH_APP_HIDE_WEIXIN_BROWSER: any;
    LAUNCH_APP_WEIXIN_JS_SDK_TICKET: any;
    LAUNCH_APP_READY: boolean;
    // LIB
    wx: any;
    mazey: any;
    sha1: any;
    $: any;
    jQuery: any;
  }
}

export {};

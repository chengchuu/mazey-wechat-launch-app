declare module '*.css';
declare module '*.png';
declare module '*.svg';

declare module 'bootstrap/js/dist/collapse' {
  interface CollapseOptions {
    toggle?: boolean;
  }

  export default class Collapse {
    static getOrCreateInstance(
      element: Element,
      options?: CollapseOptions
    ): Collapse;
    hide(): void;
    toggle(): void;
  }
}

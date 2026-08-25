// DOM Types for Open Idle Engine

interface DOMRect {
  bottom: number;
  left: number;
  top: number;
  right: number;
}

declare global {
  namespace NodeJS {
    interface Window {
      innerHeight: readonly number;
      innerWidth: readonly number;
      height: readonly number;
      width: readonly number;
    }

    namespace DOM {
      interface Document {
        body?: HTMLBodyElement | null;
        createElement?: (tagName: string, attrs?: NodeHTMLAttributes) => HTMLElement;
      }

      interface HTMLElement {
        style: CSSStyleDeclaration;
        offsetParent: HTMLElement | null;
      }
    }
  }
}

type DOMRect = typeof window['DOMRect'] extends any ? typeof window['DOMRect'] : {
  bottom: number;
  left: number;
  top: number;
  right: number;
};

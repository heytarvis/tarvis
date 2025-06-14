import { ChatUiContext } from './types/chat-ui-context.model';
import { createElement, render } from 'preact';
import ChatUIComponent from './components/ChatUI';
import { CustomComponentFn, CustomComponentFns } from './types/app';

export class ChatUI {
  #ctx: ChatUiContext;
  #preactRoot: HTMLElement | null = null;

  constructor(ctx: ChatUiContext) {
    this.#ctx = ctx;
  }

  render(el: HTMLElement): void {
    this.#preactRoot = document.createElement('div');
    this.#preactRoot.className = 'tarvis__preact-root';
    el.appendChild(this.#preactRoot);
    render(createElement(ChatUIComponent, { ctx: this.#ctx }), this.#preactRoot);
  }

  destroy(): void {
    if (this.#preactRoot) {
      render(null, this.#preactRoot);
      this.#preactRoot.remove();
      this.#preactRoot = null;
    }
  }

  /**
   * Internal API for framework adapter components, to set custom component functions.
   * */
  _setCustomComponentFn(fnId: keyof CustomComponentFns, fn: CustomComponentFn) {
    this.#ctx.customComponents[fnId] = fn;
  }
}

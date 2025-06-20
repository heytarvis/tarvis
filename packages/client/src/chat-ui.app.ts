import { ChatUiContext } from '@tarvis/shared/src/types/chat-ui-context.model';
import { createElement, render } from 'preact';
import ChatUIComponent from './components/ChatUI';
import { CustomComponentFn, CustomComponentFns } from './types/app';
import { ClientPlugin } from '@tarvis/shared/src/types/client-plugin';

export class ChatUI {
  private readonly ctx: ChatUiContext;
  private preactRoot: HTMLElement | null = null;

  constructor(ctx: ChatUiContext) {
    this.ctx = ctx;
  }

  async render(el: HTMLElement): Promise<void> {
    await this.#beforeRender();

    this.preactRoot = document.createElement('div');
    this.preactRoot.className = 'tarvis__preact-root';
    el.appendChild(this.preactRoot);
    render(createElement(ChatUIComponent, { ctx: this.ctx }), this.preactRoot);
  }

  destroy(): void {
    if (this.preactRoot) {
      render(null, this.preactRoot);
      this.preactRoot.remove();
      this.preactRoot = null;
    }
  }

  /**
   * Internal API for framework adapter components, to set custom component functions.
   * */
  _setCustomComponentFn(fnId: keyof CustomComponentFns, fn: CustomComponentFn) {
    this.ctx.customComponents[fnId] = fn;
  }

  async #beforeRender() {
    if (this.ctx.plugins?.value && this.ctx.plugins.value.length > 0) {
      await Promise.all(
        this.ctx.plugins.value.map((plugin: ClientPlugin) => plugin.beforeRender?.(this.ctx))
      );
    }
  }
}

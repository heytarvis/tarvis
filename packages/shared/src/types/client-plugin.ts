import {ChatUiContext} from "../../types/chat-ui-context.model";

export interface ClientPlugin {
  name: string;
  beforeRender(ctx: ChatUiContext): void;
  onRender(ctx: ChatUiContext): void;
  destroy(): void;
}

import { ChatUiContext } from './chat-ui-context.model';
import { AssistantMessage, Thread } from './conversations';

export interface ClientPlugin {
  name: string;

  destroy: () => void;
  beforeRender?: (ctx: ChatUiContext) => void;
  onRender?: (ctx: ChatUiContext) => void;
  onMessageComplete?: (message: AssistantMessage, threads?: Thread[]) => void;
}

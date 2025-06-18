import { ChatUiContext } from '@tarvis/shared/src/types/chat-ui-context.model';
import { useEffect, useState } from 'preact/hooks';
import type { UserMessage } from '@tarvis/shared/src/types/conversations';
import { randomStringId } from '../utils';

const MessageContent = ({ contentToShow }: { contentToShow: string }) => {
  return <div className="whitespace-pre-wrap">{contentToShow}</div>;
};

type UserMessageProps = {
  message: UserMessage;
  messageVersions: { [key: string]: number };
  ctx: ChatUiContext;
};

export default function UserMessage({ message, messageVersions, ctx }: UserMessageProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const contentToShow = message.content[messageVersions[message.id] ?? 0] || '';

  const handleCopyMessage = async (message: UserMessage) => {
    try {
      await navigator.clipboard.writeText(message.content[0]);
      setCopiedMessageId(message.id);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const customComponentFn = ctx.customComponents.UserMessage;
  const customComponentId = useState(customComponentFn ? randomStringId() : undefined)[0];

  useEffect(() => {
    if (!customComponentId || !customComponentFn) return;

    const containerEl = document.querySelector(`[data-ccid="${customComponentId}"]`);
    if (!(containerEl instanceof HTMLElement)) return;

    customComponentFn(containerEl, {
      message,
    });
  }, [message]);

  return (
    <div className="tarvis__message tarvis__message--user" data-ccid={customComponentId}>
      {!customComponentFn && (
        <div className="tarvis__message-inner">
          <div className="tarvis__avatar">U</div>
          <div className="tarvis__message-content">
            <MessageContent contentToShow={contentToShow} />
            <div className="tarvis__message-actions">
              <button
                className="tarvis__action-button"
                title="Copy message"
                onClick={() => handleCopyMessage(message)}
              >
                {copiedMessageId === message.id ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style="stroke-width: 2;"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style="stroke-width: 2;"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

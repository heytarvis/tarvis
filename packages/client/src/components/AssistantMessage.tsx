import { ChatUiContext } from '@tarvis/shared/src/types/chat-ui-context.model';
import { useState, useEffect } from 'preact/hooks';
import type { AssistantMessage } from '@tarvis/shared/src/types/conversations';
import { randomStringId } from '../utils';
import { Remarkable } from 'remarkable';

const MessageContent = ({ contentToShow }: { contentToShow: string }) => {
  const remarkable = new Remarkable();

  return (
    <div className="flex flex-col gap-2">
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: remarkable.render(contentToShow) }}
      />
    </div>
  );
};

type AssistantMessageProps = {
  message: AssistantMessage;
  isLoading: boolean;
  messageVersions: { [key: string]: number };
  ctx: ChatUiContext;
  onVersionChange: (messageId: string, newIndex: number) => void;
  onRetry: (message: AssistantMessage) => void;
};

export default function AssistantMessage({
  message,
  isLoading,
  messageVersions,
  ctx,
  onVersionChange,
  onRetry,
}: AssistantMessageProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const contentToShow = message.content[messageVersions[message.id] ?? 0] || '';

  const handleCopyMessage = async (message: AssistantMessage) => {
    try {
      await navigator.clipboard.writeText(
        message.content[message.currentlySelectedVersionIndex!] || message.content[0]
      );
      setCopiedMessageId(message.id);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const customComponentFn = ctx.customComponents.AssistantMessage;
  const customComponentId = useState(customComponentFn ? randomStringId() : undefined)[0];

  useEffect(() => {
    if (!customComponentId || !customComponentFn) return;

    const containerEl = document.querySelector(`[data-ccid="${customComponentId}"]`);
    if (!(containerEl instanceof HTMLElement)) return;

    customComponentFn(containerEl, {
      message,
      isLoading,
      contentToShow,
      copiedMessageId,
      onVersionChange,
      retry: onRetry,
    });
  }, [
    customComponentId,
    customComponentFn,
    message,
    isLoading,
    contentToShow,
    copiedMessageId,
    onVersionChange,
    onRetry,
  ]);

  return (
    <div className="tarvis__message tarvis__message--assistant" data-ccid={customComponentId}>
      {!customComponentFn && (
        <div className="tarvis__message-inner">
          <div className="tarvis__avatar">A</div>
          <div className="tarvis__message-content">
            <MessageContent contentToShow={contentToShow} />
            {isLoading && (!contentToShow || contentToShow.trim().length === 0) && (
              <div className="tarvis__typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div className="tarvis__message-actions">
              {message.content.length > 1 && (
                <div className="tarvis__version-navigation">
                  <button
                    className="tarvis__action-button"
                    title="Previous version"
                    onClick={() => {
                      const currentIndex = messageVersions[message.id] ?? 0;
                      if (currentIndex > 0) {
                        onVersionChange(message.id, currentIndex - 1);
                      }
                    }}
                    disabled={(messageVersions[message.id] ?? 0) <= 0}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style="stroke-width: 2;"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <span className="tarvis__version-number">
                    {(messageVersions[message.id] ?? 0) + 1}/{message.content.length}
                  </span>
                  <button
                    className="tarvis__action-button"
                    title="Next version"
                    onClick={() => {
                      const currentIndex = messageVersions[message.id] ?? 0;
                      if (currentIndex < message.content.length - 1) {
                        onVersionChange(message.id, currentIndex + 1);
                      }
                    }}
                    disabled={(messageVersions[message.id] ?? 0) >= message.content.length - 1}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style="stroke-width: 2;"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}
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
              <button
                className="tarvis__action-button"
                title="Retry message"
                onClick={() => onRetry(message)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style="stroke-width: 2;"
                >
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
              {message.usage_metadata && (
                <div className="tarvis__usage-info">
                  <button className="tarvis__action-button" title="Token usage information">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style="stroke-width: 2;"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </button>
                  <div className="tarvis__usage-tooltip">
                    {message.usage_metadata.input_tokens !== undefined && (
                      <div>Input tokens: {message.usage_metadata.input_tokens}</div>
                    )}
                    {message.usage_metadata.output_tokens !== undefined && (
                      <div>Output tokens: {message.usage_metadata.output_tokens}</div>
                    )}
                    {message.usage_metadata.total_tokens !== undefined && (
                      <div>Total tokens: {message.usage_metadata.total_tokens}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

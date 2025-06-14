import { ChatUiContext } from '../types/chat-ui-context.model';
import { useState, useRef, useEffect } from 'preact/hooks';
import type { KeyboardEvent, ChangeEvent } from 'preact/compat';
import { useComputed } from '@preact/signals';
import { convertToLangChainMessages } from '../services/langchain-service';
import { AssistantMessage, SystemMessage, Thread, UserMessage } from '../types/conversations';
import { ChatResponse } from '@tarvis/shared/src';
import { Model } from '@tarvis/shared/src/available-models';
import AssistantMessageComponent from './AssistantMessage';
import UserMessageComponent from './UserMessage';
import ModelSelector from './ModelSelector';
import ModelSettings from './ModelSettings';
import { randomStringId } from '../utils';

type ChatUIProps = {
  ctx: ChatUiContext;
};

export default function ChatUIComponent({ ctx }: ChatUIProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageVersions, setMessageVersions] = useState<{ [key: string]: number }>({});
  const [selectedModel, setSelectedModel] = useState<string>(
    ctx.model.value || Model.GPT_3_5_TURBO
  );
  const [temperature, setTemperature] = useState<number>(ctx.temperature.value || 0.7);

  // Initialize current thread
  useEffect(() => {
    if (ctx.threads.value.length > 0 && !ctx.currentThread.value) {
      ctx.currentThread.value = ctx.threads.value[0];
    }
  }, []);

  // Check for small screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 700);
      if (window.innerWidth > 700) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const scrollToBottom = () => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const createNewChat = () => {
    const newThread: Thread = {
      id: randomStringId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
    };

    if (ctx.systemPrompt.value.length) {
      newThread.messages.push({
        id: `system-${randomStringId()}`,
        type: 'system',
        content: [ctx.systemPrompt.value],
        timestamp: new Date(),
      });
    }

    ctx.threads.value = [newThread, ...ctx.threads.value];
    ctx.currentThread.value = newThread;

    // Close sidebar on small screens
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setInputValue(value);

    if (value.trim() && ctx.threads.value.length === 0 && !ctx.currentThread.value) {
      createNewChat();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      }

      if (inputValue.trim()) {
        e.preventDefault();
        e.stopPropagation();
        handleSendMessage();
      }
    }
  };

  const parseSSEMessage = (line: string): ChatResponse | null => {
    if (!line.trim()) return null;
    try {
      // Remove the 'data: ' prefix if present
      const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
      return JSON.parse(jsonStr) as ChatResponse;
    } catch (error) {
      console.error('Error parsing SSE data:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    setErrorMessage(null); // Clear any existing error
    if (!ctx.currentThread.value) {
      createNewChat();
    }

    const userMessage: UserMessage = {
      id: randomStringId(),
      content: [inputValue],
      type: 'user',
      timestamp: new Date(),
    };

    const updatedThread = {
      ...ctx.currentThread.value!,
      messages: [...ctx.currentThread.value!.messages, userMessage],
      title:
        ctx.currentThread.value!.messages.length === 0
          ? inputValue.slice(0, 30)
          : ctx.currentThread.value!.title,
    };

    // Update thread with user message
    ctx.currentThread.value = updatedThread;
    ctx.threads.value = ctx.threads.value.map(thread =>
      thread.id === ctx.currentThread.value!.id ? updatedThread : thread
    );
    setInputValue('');
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessage: AssistantMessage = {
      id: randomStringId(),
      content: [''],
      type: 'assistant',
      timestamp: new Date(),
      currentlySelectedVersionIndex: 0,
    };

    // Add assistant message placeholder to thread
    const threadWithAssistant = {
      ...updatedThread,
      messages: [...updatedThread.messages, assistantMessage],
    };

    /**
     * wait one tick, before scrolling to bottom
     * an effect for messages can't be used here, because the chat should not be scrolled to bottom on adding retry messages
     * */
    setTimeout(() => {
      scrollToBottom();
    });

    // Update thread with assistant's response placeholder
    ctx.currentThread.value = threadWithAssistant;
    ctx.threads.value = ctx.threads.value.map(thread =>
      thread.id === ctx.currentThread.value!.id ? threadWithAssistant : thread
    );

    // Convert thread to LangChain messages
    const langChainMessages = convertToLangChainMessages(threadWithAssistant);

    try {
      const response = await fetch(`${ctx.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: ctx.currentThread.value!.id,
          messages: langChainMessages,
          modelId: selectedModel,
          temperature: temperature,
          messageId: assistantMessage.id,
          isRetry: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          const data = parseSSEMessage(line);
          if (!data) continue;

          if (data.type === 'message') {
            if (ctx.currentThread.value) {
              const updatedThread: Thread = {
                ...ctx.currentThread.value,
                messages: ctx.currentThread.value.messages.map(
                  (m: AssistantMessage | UserMessage | SystemMessage) => {
                    if (m.id === data.messageId && m.type === 'assistant') {
                      return {
                        ...m,
                        content:
                          m.content.length > 0
                            ? [
                                ...m.content.slice(0, -1),
                                m.content[m.content.length - 1] + (data.content || ''),
                              ]
                            : [data.content || ''],
                        usage_metadata: data.usage_metadata,
                      };
                    }
                    return m;
                  }
                ),
              };

              ctx.currentThread.value = updatedThread;
              ctx.threads.value = ctx.threads.value.map(thread =>
                thread.id === updatedThread.id ? updatedThread : thread
              );
              if (!data.isRetry) {
                scrollToBottom();
              }
            }
          } else if (data.type === 'complete') {
            setIsLoading(false);

            if (ctx.onMessageComplete.value && ctx.currentThread.value) {
              const targetMessage = ctx.currentThread.value.messages.find(
                m => m.id === data.messageId
              );
              if (targetMessage?.type === 'assistant') {
                // Update usage metadata on completion
                if (data.usage_metadata) {
                  targetMessage.usage_metadata = data.usage_metadata;
                }
                ctx.onMessageComplete.value(targetMessage, ctx.currentThread.value);
              }
            }

            if (data.threadTitle && ctx.currentThread.value) {
              const updatedThread: Thread = {
                ...ctx.currentThread.value,
                title: data.threadTitle,
              };
              ctx.currentThread.value = updatedThread;
              ctx.threads.value = ctx.threads.value.map(thread =>
                thread.id === updatedThread.id ? updatedThread : thread
              );
            }
          } else if (data.type === 'error') {
            console.error('Error:', data.error);
            setErrorMessage(data.error || 'Something went wrong');
            if (ctx.currentThread.value) {
              const messages = ctx.currentThread.value.messages.slice(0, -1);
              ctx.currentThread.value = {
                ...ctx.currentThread.value,
                messages,
              };
              ctx.threads.value = ctx.threads.value.map(thread =>
                thread.id === ctx.currentThread.value!.id ? ctx.currentThread.value! : thread
              );
            }
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('Something went wrong while sending your message');
      if (ctx.currentThread.value) {
        const messages = ctx.currentThread.value.messages.slice(0, -1);
        ctx.currentThread.value = {
          ...ctx.currentThread.value,
          messages,
        };
        ctx.threads.value = ctx.threads.value.map(thread =>
          thread.id === ctx.currentThread.value!.id ? ctx.currentThread.value! : thread
        );
      }
      setIsLoading(false);
    }
  };

  const retryMessage = async (message: AssistantMessage) => {
    setErrorMessage(null); // Clear any existing error
    message.content.push('');
    setIsLoading(true);

    // Set the selected version to the last one
    handleVersionChange(message.id, message.content.length - 1);

    // thread to send now, should only be every message UP UNTIL the assistant message, but not the assistant message itself or messages after it
    const msgIndex = ctx.currentThread.value?.messages.findIndex(m => m.id === message.id);
    if (msgIndex === undefined || msgIndex === -1) return;

    const messagesToSend = ctx.currentThread.value?.messages.slice(0, msgIndex + 1) || [];
    const langChainMessages = convertToLangChainMessages({
      ...ctx.currentThread.value!,
      messages: messagesToSend,
    });

    if (ctx.endpoint) {
      try {
        const response = await fetch(`${ctx.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId: ctx.currentThread.value!.id,
            messages: langChainMessages,
            modelId: selectedModel,
            temperature: temperature,
            messageId: message.id,
            isRetry: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            const data = parseSSEMessage(line);
            if (!data) continue;

            if (data.type === 'message') {
              if (!data.isRetry) {
                scrollToBottom();
              }
              if (ctx.currentThread.value) {
                const updatedThread: Thread = {
                  ...ctx.currentThread.value,
                  messages: ctx.currentThread.value.messages.map(m => {
                    if (m.type === 'assistant' && m.id === data.messageId) {
                      const assistantMessage = m as AssistantMessage;
                      return {
                        ...assistantMessage,
                        content:
                          assistantMessage.content.length > 0
                            ? [
                                ...assistantMessage.content.slice(0, -1),
                                assistantMessage.content[assistantMessage.content.length - 1] +
                                  (data.content || ''),
                              ]
                            : [data.content || ''],
                        usage_metadata: data.usage_metadata,
                      };
                    }
                    return m;
                  }),
                };

                ctx.currentThread.value = updatedThread;
                ctx.threads.value = ctx.threads.value.map(thread =>
                  thread.id === updatedThread.id ? updatedThread : thread
                );
              }
            } else if (data.type === 'complete') {
              setIsLoading(false);

              if (ctx.onMessageComplete.value && ctx.currentThread.value) {
                const targetMessage = ctx.currentThread.value.messages.find(
                  m => m.id === data.messageId
                );
                if (targetMessage?.type === 'assistant') {
                  // Update usage metadata on completion
                  if (data.usage_metadata) {
                    targetMessage.usage_metadata = data.usage_metadata;
                  }
                  ctx.onMessageComplete.value(targetMessage, ctx.currentThread.value);
                }
              }

              if (data.threadTitle && ctx.currentThread.value) {
                const updatedThread: Thread = {
                  ...ctx.currentThread.value,
                  title: data.threadTitle,
                };
                ctx.currentThread.value = updatedThread;
                ctx.threads.value = ctx.threads.value.map(thread =>
                  thread.id === updatedThread.id ? updatedThread : thread
                );
              }
            } else if (data.type === 'error') {
              console.error('Error:', data.error);
              setErrorMessage(data.error || 'Something went wrong');
              if (ctx.currentThread.value) {
                const messages = ctx.currentThread.value.messages.slice(0, -1);
                ctx.currentThread.value = {
                  ...ctx.currentThread.value,
                  messages,
                };
                ctx.threads.value = ctx.threads.value.map(thread =>
                  thread.id === ctx.currentThread.value!.id ? ctx.currentThread.value! : thread
                );
              }
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Error sending retry message:', error);
        setIsLoading(false);
      }
    }
  };

  const handleVersionChange = (messageId: string, newIndex: number) => {
    setMessageVersions(prev => ({
      ...prev,
      [messageId]: newIndex,
    }));
  };

  const groupThreadsByMonth = useComputed(() => {
    const groups: { [key: string]: Thread[] } = {};

    ctx.threads.value.forEach(thread => {
      const month = thread.createdAt.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(thread);
    });

    // Sort threads within each month by date (newest first)
    Object.values(groups).forEach(threads => {
      threads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });

    // Sort months by the most recent thread in each month
    return Object.entries(groups).sort((a, b) => {
      const aLatest = Math.max(...a[1].map(thread => thread.createdAt.getTime()));
      const bLatest = Math.max(...b[1].map(thread => thread.createdAt.getTime()));
      return bLatest - aLatest;
    });
  });

  return (
    <div
      className={`tarvis__layout is-${ctx.theme.value} ${isSmallScreen ? 'tarvis__is-small' : ''} ${isSidebarOpen ? 'tarvis__sidebar-open' : ''}`}
    >
      <div className="tarvis__sidebar">
        <button className="tarvis__new-chat-button" onClick={createNewChat}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </button>
        <div className="tarvis__conversations">
          {groupThreadsByMonth.value.map(([month, threads]) => (
            <div key={month} className="tarvis__conversation-group">
              <div className="tarvis__conversation-month">{month}</div>
              {threads.map(thread => (
                <div
                  key={thread.id}
                  className={`tarvis__conversation-item ${thread.id === ctx.currentThread.value?.id ? 'tarvis__conversation-item--active' : ''}`}
                  onClick={() => {
                    ctx.currentThread.value = thread;
                    if (isSmallScreen) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  {thread.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="tarvis__chat-container">
        <div className="tarvis__chat-header">
          {isSmallScreen && (
            <button
              className="tarvis__sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          <h2>{ctx.currentThread.value?.title || 'New Chat'}</h2>
          <div className="tarvis__model-controls">
            <ModelSelector
              models={ctx.availableModels.value}
              selectedModelId={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isLoading}
            />
            <ModelSettings temperature={temperature} onTemperatureChange={setTemperature} />
          </div>
        </div>

        <div className="tarvis__chat-messages">
          {errorMessage && (
            <div className="tarvis__error-message">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errorMessage}
              <button
                className="tarvis__error-close"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error message"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
          {ctx.currentThread.value?.messages
            .filter(message => message.type !== 'system')
            .map(message =>
              message.type === 'assistant' ? (
                <AssistantMessageComponent
                  key={message.id}
                  message={message as AssistantMessage}
                  isLoading={isLoading}
                  messageVersions={messageVersions}
                  ctx={ctx}
                  onVersionChange={handleVersionChange}
                  onRetry={retryMessage}
                />
              ) : (
                <UserMessageComponent
                  key={message.id}
                  message={message as UserMessage}
                  messageVersions={messageVersions}
                  ctx={ctx}
                />
              )
            )}
          <div ref={messagesEndRef} />
        </div>

        <div className="tarvis__input-area">
          <div className="tarvis__input-container">
            <textarea
              className="tarvis__input"
              value={inputValue}
              onKeyUp={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={'Message Chat Assistant...'}
              rows={1}
            />
            <button
              className="tarvis__send-button"
              onClick={handleSendMessage}
              disabled={isLoading}
              title={'Send message'}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

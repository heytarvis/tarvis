import {
  createChatUIContext,
  ChatUI,
  model_claude_3_5_sonnet,
  model_llama_3_3_70b_versatile,
  model_gpt_3_5_turbo,
} from '../../packages/client/src';
import '../../packages/client/src/styles/index.scss';
import '@fontsource/open-sans';
import '@fontsource/open-sans/300.css';
import '@fontsource/open-sans/500-italic.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/700-italic.css';
import { Thread, AssistantMessage } from '../../packages/shared/src/types/conversations';
import { ChatUiConfig } from '../../packages/client/src/types/chat-ui-config.model';
import PersistencePlugin from '../../packages/client-persistence/src';

const appEl = document.getElementById('app');

if (!appEl) {
  throw new Error('No element with id "app" found');
}

// Sample conversations from previous months
const sampleConversations: Thread[] = [
  {
    id: '1',
    title: 'Project Planning Discussion',
    messages: [
      {
        id: '1-1',
        content: ["Let's plan out the next sprint"],
        type: 'user',
        timestamp: new Date('2024-02-15T10:00:00'),
      },
      {
        id: '1-2',
        content: ["I'll help you organize the tasks and priorities for the upcoming sprint."],
        type: 'assistant',
        timestamp: new Date('2024-02-15T10:01:00'),
        currentlySelectedVersionIndex: 0,
      },
    ],
    createdAt: new Date('2024-02-15T10:00:00'),
  },
  {
    id: '2',
    title: 'Code Review Session',
    messages: [
      {
        id: '2-1',
        content: ['Can you review this pull request?'],
        type: 'user' as const,
        timestamp: new Date('2024-01-20T14:30:00'),
      },
      {
        id: '2-2',
        content: ["I've reviewed the changes and here are my suggestions..."],
        type: 'assistant',
        timestamp: new Date('2024-01-20T14:35:00'),
      },
    ],
    createdAt: new Date('2024-01-20T14:30:00'),
  },
  {
    id: '3',
    title: 'Bug Investigation',
    messages: [
      {
        id: '3-1',
        content: ["We're seeing an error in production"],
        type: 'user',
        timestamp: new Date('2023-12-10T09:15:00'),
      },
      {
        id: '3-2',
        content: ["Let's analyze the error logs and trace the issue."],
        type: 'assistant',
        timestamp: new Date('2023-12-10T09:16:00'),
      },
    ],
    createdAt: new Date('2023-12-10T09:15:00'),
  },
];

const config: ChatUiConfig = {
  isLoading: true,
  endpoint: 'http://localhost:3001/chat',
  theme: 'light',
  onMessageComplete: (message: AssistantMessage, conversation?: Thread) => {
    console.log('Message completed:', message);
    console.log('Current conversation:', conversation);
  },
  temperature: 0.5,
  availableModels: [model_llama_3_3_70b_versatile, model_gpt_3_5_turbo, model_claude_3_5_sonnet],
  // availableModels: [
  //   {
  //     name: 'Mock GPT-3.5',
  //     description: 'Mock model simulating GPT-3.5 capabilities',
  //     id: 'mock-gpt-3.5',
  //   },
  //   model_llama_3_3_70b_versatile,
  // ],
  // model: 'mock-gpt-3.5',
  plugins: [new PersistencePlugin()],
};

const ctx = createChatUIContext(config);
// ctx.threads.value = sampleConversations;
ctx.theme.value = 'light';

const chatUI = new ChatUI(ctx);
chatUI.render(appEl);

setTimeout(() => {
  ctx.isLoading.value = false;
}, 1800)

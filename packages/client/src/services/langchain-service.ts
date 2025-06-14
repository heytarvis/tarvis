import { Thread } from '../types/conversations';
import { LangChainMessage } from '../../../shared/src';

export function convertToLangChainMessages(thread: Thread): LangChainMessage[] {
  return thread.messages.map(msg => {
    const isAssistantMessage = msg.type === 'assistant';
    const selectedContent =
      isAssistantMessage && msg.currentlySelectedVersionIndex !== undefined
        ? msg.content[msg.currentlySelectedVersionIndex]
        : msg.content[0];

    return {
      type: getType(msg.type),
      content: selectedContent,
    };
  });
}

const getType = (role: 'assistant' | 'user' | 'system') => {
  switch (role) {
    case 'assistant':
      return 'ai';
    case 'user':
      return 'human';
    case 'system':
      return 'system';
    default:
      throw new Error(`Unknown role: ${role}`);
  }
};

export interface Message<T extends 'user' | 'assistant' | 'system'> {
  id: string;
  type: T;
  timestamp: Date;
  content: string[];
}

export interface UserMessage extends Message<'user'> {}

export interface SystemMessage extends Message<'system'> {}

export interface AssistantMessage extends Message<'assistant'> {
  currentlySelectedVersionIndex?: number;
  usage_metadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

export interface Thread {
  id: string;
  title: string;
  messages: (UserMessage | AssistantMessage | SystemMessage)[];
  createdAt: Date;
}

export interface LangChainMessage {
  type: 'human' | 'ai' | 'system';
  content: string;
}

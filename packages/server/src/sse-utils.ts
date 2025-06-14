import { ChatResponse } from '@tarvis/shared/src';

/**
 * Formats a ChatResponse into an SSE message
 * @param response The ChatResponse to format
 * @returns The formatted SSE message string
 */
export function formatSSEMessage(response: ChatResponse): string {
  return `data: ${JSON.stringify(response)}\n\n`;
}

/**
 * Parses an SSE message string into a ChatResponse
 * @param message The raw SSE message string
 * @returns The parsed ChatResponse or null if invalid
 */
export function parseSSEMessage(message: string): ChatResponse | null {
  if (!message.trim()) return null;

  try {
    // Remove the 'data: ' prefix if present
    const jsonStr = message.startsWith('data: ') ? message.slice(6) : message;
    return JSON.parse(jsonStr) as ChatResponse;
  } catch (error) {
    console.error('Error parsing SSE message:', error);
    return null;
  }
}

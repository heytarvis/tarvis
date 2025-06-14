import { LangChainMessage } from './types/langchain';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Different response templates
const responseTemplates = [
  // Template 1: Standard response
  (userMessage: string) => [
    "I understand you're asking about ",
    userMessage,
    '. Let me think about that... ',
    "Here's what I can tell you: ",
    'This is a mock response that simulates streaming. ',
    'You can use this while developing without making actual API calls. ',
    'The response is broken into chunks to simulate the real streaming behavior.',
  ],
  // Template 2: Technical response
  (userMessage: string) => [
    'Analyzing your query about ',
    userMessage,
    '... ',
    'Processing input parameters... ',
    'Generating response based on available data... ',
    "Here's the technical breakdown: ",
    'This is a simulated response for development purposes.',
  ],
  // Template 3: Friendly response
  (userMessage: string) => [
    'Hey! Thanks for asking about ',
    userMessage,
    '! ',
    "That's a great question. ",
    'Let me share my thoughts with you... ',
    "Here's what I think you should know: ",
    'Hope this helps! 😊',
  ],
  // Template 4: Professional response
  (userMessage: string) => [
    'Regarding your inquiry about ',
    userMessage,
    ', ',
    "I've conducted a thorough analysis. ",
    'Based on the available information: ',
    'Here are the key points to consider: ',
    'Please let me know if you need any clarification.',
  ],
  // Template 5: Creative response
  (userMessage: string) => [
    '✨ Exploring your question about ',
    userMessage,
    ' ✨ ',
    "Let's dive into this together! ",
    "Here's a creative perspective: ",
    'Imagine if we looked at it this way... ',
    'What do you think about this approach?',
  ],
];

export async function* streamMockResponse(
  messages: LangChainMessage[]
): AsyncGenerator<{ content: string }, void, unknown> {
  // Get the last user message
  const lastUserMessage = messages.filter(m => m.type === 'human').pop();
  if (!lastUserMessage) return;

  // Randomly select a response template
  const randomTemplate = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];
  const mockResponses = randomTemplate(lastUserMessage.content);

  // Stream the mock response with delays
  for (const chunk of mockResponses) {
    await delay(200); // Simulate network delay
    yield { content: chunk };
  }
}

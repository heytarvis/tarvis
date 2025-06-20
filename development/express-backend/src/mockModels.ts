import { CustomModelInstance } from '../../../packages/server/src/index.js';

interface MockResponse {
  content: string;
  usage_metadata: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

const mockConversations: MockResponse[][] = [
  // Conversation 1: General greeting (short)
  [
    {
      content: '# Hello! 👋\n\nHow can I help you today?',
      usage_metadata: { input_tokens: 5, output_tokens: 8, total_tokens: 13 },
    },
    {
      content: '## I can assist with various tasks and answer your questions.',
      usage_metadata: { input_tokens: 8, output_tokens: 12, total_tokens: 20 },
    },
    {
      content: '### What would you like to know more about?',
      usage_metadata: { input_tokens: 10, output_tokens: 8, total_tokens: 18 },
    },
  ],
  // Conversation 2: Technical support (long)
  [
    {
      content: '# Technical Support\n\nI understand you need technical support.',
      usage_metadata: { input_tokens: 7, output_tokens: 10, total_tokens: 17 },
    },
    {
      content: "## Issue Description\n\nCould you please describe the issue you're experiencing?",
      usage_metadata: { input_tokens: 10, output_tokens: 12, total_tokens: 22 },
    },
    {
      content: "I'll help you troubleshoot this step by step.",
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: "### First Steps\n\nLet's check if the issue is reproducible.",
      usage_metadata: { input_tokens: 9, output_tokens: 11, total_tokens: 20 },
    },
    {
      content: "Can you tell me what steps you've already taken?",
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content:
        '## Potential Solutions\n\nBased on your description, here are a few potential solutions:',
      usage_metadata: { input_tokens: 10, output_tokens: 12, total_tokens: 22 },
    },
    {
      content: '1. Check your system logs for any error messages',
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: '2. Verify that all dependencies are up to date',
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: '3. Try clearing your cache and restarting the application',
      usage_metadata: { input_tokens: 9, output_tokens: 12, total_tokens: 21 },
    },
  ],
  // Conversation 3: Code assistance (long)
  [
    {
      content: '# Code Assistance\n\nI see you need help with code.',
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: '## Language Selection\n\nWhat programming language are you working with?',
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: 'I can help you debug or optimize your code.',
      usage_metadata: { input_tokens: 7, output_tokens: 10, total_tokens: 17 },
    },
    {
      content: "### Code Review\n\nLet's start by reviewing your code structure.",
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: '## Suggested Improvements\n\nI notice a few potential improvements we could make:',
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: '1. Consider implementing error handling for edge cases',
      usage_metadata: { input_tokens: 9, output_tokens: 11, total_tokens: 20 },
    },
    {
      content: '2. The function could benefit from better documentation',
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: '3. We might want to add some unit tests for this functionality',
      usage_metadata: { input_tokens: 9, output_tokens: 11, total_tokens: 20 },
    },
    {
      content: 'Would you like me to help you implement any of these suggestions?',
      usage_metadata: { input_tokens: 10, output_tokens: 12, total_tokens: 22 },
    },
  ],
  // Conversation 4: Data analysis (long)
  [
    {
      content: "# Data Analysis\n\nLet's analyze your data together.",
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: '## Goals\n\nWhat kind of insights are you looking for?',
      usage_metadata: { input_tokens: 8, output_tokens: 9, total_tokens: 17 },
    },
    {
      content: 'I can help you interpret the patterns and trends.',
      usage_metadata: { input_tokens: 7, output_tokens: 11, total_tokens: 18 },
    },
    {
      content: "### Initial Analysis\n\nFirst, let's look at the data distribution.",
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
    {
      content: '## Key Findings\n\nI notice some interesting patterns in your dataset:',
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: "1. There's a clear correlation between variables A and B",
      usage_metadata: { input_tokens: 9, output_tokens: 11, total_tokens: 20 },
    },
    {
      content: '2. The data shows seasonal patterns that we should account for',
      usage_metadata: { input_tokens: 9, output_tokens: 11, total_tokens: 20 },
    },
    {
      content: '3. We might want to consider outlier detection',
      usage_metadata: { input_tokens: 8, output_tokens: 9, total_tokens: 17 },
    },
    {
      content: 'Would you like me to help you visualize these patterns?',
      usage_metadata: { input_tokens: 9, output_tokens: 10, total_tokens: 19 },
    },
  ],
  // Conversation 5: Project planning (short)
  [
    {
      content: "# Project Planning\n\nI'll help you plan your project.",
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: '## Objectives\n\nWhat are your main objectives?',
      usage_metadata: { input_tokens: 5, output_tokens: 6, total_tokens: 11 },
    },
    {
      content: "### Task Breakdown\n\nLet's break this down into manageable tasks.",
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
  ],
  // Conversation 6: Learning assistance (long)
  [
    {
      content: "# Learning Assistance\n\nI'm here to help you learn.",
      usage_metadata: { input_tokens: 5, output_tokens: 7, total_tokens: 12 },
    },
    {
      content: '## Topic Selection\n\nWhat topic would you like to explore?',
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: 'I can provide explanations and examples.',
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: "### Getting Started\n\nLet's start with the fundamentals.",
      usage_metadata: { input_tokens: 6, output_tokens: 7, total_tokens: 13 },
    },
    {
      content: "## Learning Path\n\nHere's a step-by-step approach to learning this topic:",
      usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
    },
    {
      content: '1. First, understand the basic concepts',
      usage_metadata: { input_tokens: 7, output_tokens: 8, total_tokens: 15 },
    },
    {
      content: '2. Practice with simple examples',
      usage_metadata: { input_tokens: 6, output_tokens: 7, total_tokens: 13 },
    },
    {
      content: '3. Gradually move to more complex scenarios',
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
    {
      content: 'Would you like to start with some practice exercises?',
      usage_metadata: { input_tokens: 8, output_tokens: 9, total_tokens: 17 },
    },
  ],
  // Conversation 7: Problem solving (short)
  [
    {
      content: "# Problem Solving\n\nLet's solve this problem together.",
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: '## Current Progress\n\nWhat have you tried so far?',
      usage_metadata: { input_tokens: 5, output_tokens: 6, total_tokens: 11 },
    },
    {
      content: "I'll help you find the best solution.",
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
  ],
  // Conversation 8: Research assistance (long)
  [
    {
      content: '# Research Assistance\n\nI can help with your research.',
      usage_metadata: { input_tokens: 5, output_tokens: 7, total_tokens: 12 },
    },
    {
      content: '## Research Area\n\nWhat specific area are you researching?',
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: 'I can help you find relevant information.',
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
    {
      content: "### Source Identification\n\nLet's start by identifying key sources.",
      usage_metadata: { input_tokens: 7, output_tokens: 8, total_tokens: 15 },
    },
    {
      content: '## Recommended Approaches\n\nHere are some recommended approaches:',
      usage_metadata: { input_tokens: 6, output_tokens: 7, total_tokens: 13 },
    },
    {
      content: '1. Review recent academic papers in the field',
      usage_metadata: { input_tokens: 8, output_tokens: 9, total_tokens: 17 },
    },
    {
      content: '2. Check industry reports and whitepapers',
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
    {
      content: '3. Look for case studies and practical examples',
      usage_metadata: { input_tokens: 8, output_tokens: 9, total_tokens: 17 },
    },
    {
      content: 'Would you like me to help you analyze any specific sources?',
      usage_metadata: { input_tokens: 9, output_tokens: 10, total_tokens: 19 },
    },
  ],
  // Conversation 9: Writing assistance (short)
  [
    {
      content: "# Writing Assistance\n\nI'll help you with your writing.",
      usage_metadata: { input_tokens: 5, output_tokens: 7, total_tokens: 12 },
    },
    {
      content: '## Content Type\n\nWhat type of content are you working on?',
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
    {
      content: 'I can help with structure and clarity.',
      usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
    },
  ],
  // Conversation 10: Decision making (long)
  [
    {
      content: "# Decision Making\n\nLet's work through this decision.",
      usage_metadata: { input_tokens: 5, output_tokens: 7, total_tokens: 12 },
    },
    {
      content: "## Options\n\nWhat are the options you're considering?",
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
    {
      content: "I'll help you evaluate the pros and cons.",
      usage_metadata: { input_tokens: 6, output_tokens: 9, total_tokens: 15 },
    },
    {
      content: "### Analysis\n\nLet's analyze each option systematically.",
      usage_metadata: { input_tokens: 7, output_tokens: 8, total_tokens: 15 },
    },
    {
      content: '## Considerations\n\nFor each option, we should consider:',
      usage_metadata: { input_tokens: 7, output_tokens: 8, total_tokens: 15 },
    },
    {
      content: '1. Short-term impact and feasibility',
      usage_metadata: { input_tokens: 7, output_tokens: 8, total_tokens: 15 },
    },
    {
      content: '2. Long-term consequences and sustainability',
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
    {
      content: '3. Resource requirements and constraints',
      usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    },
    {
      content: 'Would you like to start with a detailed analysis of the first option?',
      usage_metadata: { input_tokens: 10, output_tokens: 12, total_tokens: 22 },
    },
  ],
];

const plainTextResponses: MockResponse[] = [
  {
    content: 'Hello! How can I help you today?',
    usage_metadata: { input_tokens: 5, output_tokens: 8, total_tokens: 13 },
  },
  {
    content:
      "I understand you need technical support. Could you please describe the issue you're experiencing?",
    usage_metadata: { input_tokens: 10, output_tokens: 12, total_tokens: 22 },
  },
  {
    content: 'I see you need help with code. What programming language are you working with?',
    usage_metadata: { input_tokens: 8, output_tokens: 10, total_tokens: 18 },
  },
  {
    content: "Let's analyze your data together. What kind of insights are you looking for?",
    usage_metadata: { input_tokens: 8, output_tokens: 9, total_tokens: 17 },
  },
  {
    content: "I'll help you plan your project. What are your main objectives?",
    usage_metadata: { input_tokens: 5, output_tokens: 6, total_tokens: 11 },
  },
  {
    content: "I'm here to help you learn. What topic would you like to explore?",
    usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
  },
  {
    content: "Let's solve this problem together. What have you tried so far?",
    usage_metadata: { input_tokens: 5, output_tokens: 6, total_tokens: 11 },
  },
  {
    content: 'I can help with your research. What specific area are you researching?',
    usage_metadata: { input_tokens: 6, output_tokens: 8, total_tokens: 14 },
  },
  {
    content: "I'll help you with your writing. What type of content are you working on?",
    usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
  },
  {
    content: "Let's work through this decision. What are the options you're considering?",
    usage_metadata: { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
  },
];

export const mockGpt35Model: CustomModelInstance = {
  stream: async function* () {
    // Randomly select a conversation
    const selectedConversation =
      mockConversations[Math.floor(Math.random() * mockConversations.length)];

    for (const response of selectedConversation) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield { content: response.content + ' ' };
    }

    // Add usage metadata at the end
    yield {
      usage_metadata: selectedConversation[selectedConversation.length - 1].usage_metadata,
      content: '',
    };
  },

  invoke: async () => {
    // Randomly select a plain text response
    return plainTextResponses[Math.floor(Math.random() * plainTextResponses.length)];
  },
};

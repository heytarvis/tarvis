import type { ModelInfo } from './types/index';

export const Model = {
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  GPT_4: 'gpt-4',
  LLAMA_3_3_70B_VERSATILE: 'llama-3.3-70b-versatile',
  LLAMA_4_SCOUT_17B: 'meta-llama/llama-4-scout-17b-16e-instruct',
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20240620',
  GEMINI_2_0_FLASH: 'gemini-2.0-flash',
} as const;

export const ModelProvider = {
  OPENAI: 'OpenAI',
  GROQ: 'Groq',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
};

export const model_gpt_3_5_turbo = {
  id: Model.GPT_3_5_TURBO,
  name: 'GPT-3.5 Turbo',
  provider: ModelProvider.OPENAI,
  description: 'Fast and efficient model for most tasks',
};

export const model_gpt_4 = {
  id: Model.GPT_4,
  name: 'GPT-4',
  provider: ModelProvider.OPENAI,
  description: 'Most capable model, better for complex tasks',
};

export const model_llama_3_3_70b_versatile = {
  id: Model.LLAMA_3_3_70B_VERSATILE,
  name: 'Llama 3.3 70B',
  provider: ModelProvider.GROQ,
  description: 'Powerful 70B parameter model for complex tasks',
};

export const model_llama_4_scout_17b = {
  id: Model.LLAMA_4_SCOUT_17B,
  name: 'Llama 4 Scout 17B',
  provider: ModelProvider.GROQ,
  description: 'Versatile 17B parameter model for a wide range of tasks',
};

export const model_claude_3_5_sonnet = {
  id: Model.CLAUDE_3_5_SONNET,
  name: 'Claude 3.5 Sonnet',
  provider: ModelProvider.ANTHROPIC,
  description: "Anthropic's latest model, excelling at complex reasoning and analysis",
};
export const model_gemini_2_0_flash = {
  id: Model.GEMINI_2_0_FLASH,
  name: 'Gemini 2.0 Flash',
  provider: ModelProvider.GOOGLE,
  description: "Google's fast and efficient model for real-time interactions",
};

export const availableModels: ModelInfo[] = [
  model_gpt_3_5_turbo,
  model_gpt_4,
  model_llama_3_3_70b_versatile,
  model_llama_4_scout_17b,
  model_claude_3_5_sonnet,
  model_gemini_2_0_flash,
];

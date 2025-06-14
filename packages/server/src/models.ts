import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { availableModels, ModelProvider } from '../../shared/src/available-models';

// Model configuration types
interface ModelConfig {
  temperature?: number;
  streaming?: boolean;
}

// Supported model types
export type SupportedModel = ChatOpenAI | ChatGroq | ChatAnthropic | ChatGoogleGenerativeAI;

// Model factory function
export function createModel(modelId: string, config: ModelConfig = {}): SupportedModel {
  const modelConfig = {
    temperature: 0.7,
    streaming: true,
    ...config,
  };

  const selectedModel = availableModels.find(model => model.id === modelId);
  if (!selectedModel) {
    throw new Error(`Model with ID ${modelId} not found`);
  }

  if (selectedModel.provider === ModelProvider.OPENAI) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for OpenAI models');
    }
    return new ChatOpenAI({
      model: modelId,
      ...modelConfig,
    });
  }

  if (selectedModel.provider === ModelProvider.GROQ) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key is required for Groq models');
    }
    return new ChatGroq({
      model: modelId,
      ...modelConfig,
    });
  }

  if (selectedModel.provider === ModelProvider.ANTHROPIC) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key is required for Anthropic models');
    }
    return new ChatAnthropic({
      model: modelId,
      ...modelConfig,
    });
  }

  if (selectedModel.provider === ModelProvider.GOOGLE) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('Google API key is required for Google models');
    }
    return new ChatGoogleGenerativeAI({
      model: modelId,
      ...modelConfig,
    });
  }

  throw new Error(`Unsupported model: ${modelId}`);
}

// Helper function to check if a model is supported
export function isModelSupported(modelId: string): boolean {
  const supportedModels = [
    'gpt-3.5-turbo',
    'gpt-4',
    'llama-3.3-70b-versatile',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'claude-3-5-sonnet-20240620',
    'gemini-2.0-flash',
  ];
  return supportedModels.includes(modelId);
}

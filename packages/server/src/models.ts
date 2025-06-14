import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ModelProvider } from '../../shared/src/available-models';
import {CustomModelInstance, ModelInfo} from "@tarvis/shared/src";

// Model configuration types
interface ModelConfig {
  temperature?: number;
  streaming?: boolean;
}

// Supported model types
export type SupportedModel = ChatOpenAI | ChatGroq | ChatAnthropic | ChatGoogleGenerativeAI | CustomModelInstance;

// Model factory function
export function createOrGetModel(
  availableModels: ModelInfo[],
  modelId: string,
  config: ModelConfig = {}
): SupportedModel {
  const modelConfig = {
    temperature: 0.7,
    streaming: true,
    ...config,
  };

  const selectedModel = availableModels.find(model => model.id === modelId);

  if (!selectedModel) {
    throw new Error(`Model with ID ${modelId} not found`);
  }

  if (typeof selectedModel.ModelInstance !== 'undefined') {
    return selectedModel.ModelInstance
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

export function isModelSupported(
  availableModels: ModelInfo[],
  modelId: string
): boolean {
  return availableModels.some(model => model.id === modelId)
}

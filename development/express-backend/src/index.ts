import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TarvisClient, CustomModelInstance, model_gpt_4 } from '../../../packages/server/src/index.js';
import { ChatResponse } from '@tarvis/shared/src/index.js';

// Load environment variables
dotenv.config();

const app = express();

// Create TarvisClient instance
const tarvisClient = new TarvisClient({
  availableModels: [
    model_gpt_4,
    {
      name: 'Mock GPT-3.5',
      description: 'Mock model simulating GPT-3.5 capabilities',
      id: 'mock-gpt-3.5',
      ModelInstance: {
        // create a mock method "stream" which streams 7 chunks before ending, and on the last call
        // adds some usage metadata
        // @ts-ignore
        stream: async function* (messages) {
          const responses = [
            'Hello, how can I assist you today?',
            'I can help with a variety of tasks.',
            'What specific information are you looking for?',
            'Feel free to ask me anything.',
            'I am here to provide support.',
            'Let me know if you need assistance with something specific.',
            'Thank you for reaching out!'
          ];

          for (const response of responses) {
            await new Promise(resolve => setTimeout(resolve, 100));
            yield { content: response };
          }

          yield {
            usage_metadata: {
              input_tokens: 10,
              output_tokens: 50,
              total_tokens: 60
            },
            content: ''
          };
        },

        // @ts-ignore
        invoke: async (messages) => {
          return {
            content: 'Mock title',
            usage_metadata: {
              input_tokens: 10,
              output_tokens: 50,
              total_tokens: 60
            }
          };
        }
      }
    }
  ]
});

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Get available models endpoint
app.get('/models', async (req: Request, res: Response) => {
  try {
    const models = await tarvisClient.getAvailableModels();
    res.json(models);
  } catch (error) {
    console.error('Error getting available models:', error);
    res.status(500).json({ error: 'Failed to get available models' });
  }
});

// Chat endpoint
app.post('/chat', async (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected');
  });

  try {
    await tarvisClient.streamChatResponse(
      req.body,
      (sseMessage: string) => {
        res.write(sseMessage);
      },
      (sseMessage: string) => {
        res.write(sseMessage);
        res.end();
      },
      (sseMessage: string) => {
        res.write(sseMessage);
        res.end();
      }
    );
  } catch (error) {
    console.error('Error handling chat request:', error);
    const errorResponse: ChatResponse = {
      type: 'error',
      error: 'Internal server error',
      threadId: req.body.threadId,
    };
    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

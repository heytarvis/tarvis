import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TarvisClient, model_gpt_4 } from '../../../packages/server/src/index.js';
import { mockGpt35Model } from './mockModels.js';
import { Readable } from 'node:stream';

// Load environment variables
dotenv.config();

const app = express();

// Create TarvisClient instance
const tarvisClient = new TarvisClient({
  // availableModels: [
  //   model_gpt_4,
  //   {
  //     name: 'Mock GPT-3.5',
  //     description: 'Mock model simulating GPT-3.5 capabilities',
  //     id: 'mock-gpt-3.5',
  //     ModelInstance: mockGpt35Model,
  //   },
  // ],
});

// Add some example tools to the client
import { createTextTool, createMultiParamTool } from '../../../packages/server/src/index.js';
import { z } from 'zod';

// Example calculator tool
const calculatorTool = createMultiParamTool(
  'calculator',
  'Perform mathematical calculations',
  {
    expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")'),
  },
  ['expression']
);

// Example echo tool
const echoTool = createTextTool(
  'echo',
  'Echo back the input text',
  'text',
  'Text to echo back'
);

// Add tools to the client
tarvisClient.addTool(calculatorTool, async (args: Record<string, any>) => {
  try {
    const expression = args.expression as string;
    console.log(expression)
    const result = eval(expression); // Note: In production, use a safe evaluation library
    console.log(result)
    return {
      content: [{ type: 'text', text: `Result: ${result}` }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error evaluating expression: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
    };
  }
});

tarvisClient.addTool(echoTool, async (args: Record<string, any>) => ({
  content: [{ type: 'text', text: `Echo: ${args.text}` }],
}));

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Chat endpoint
app.post('/chat', async (req: Request, res: Response) => {
  const stream = await tarvisClient.streamChatResponse(req.body);
  Readable.fromWeb(stream).pipe(res);
});

// Tool endpoint
app.post('/tool', async (req: Request, res: Response) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name) {
      return res.status(400).json({
        content: [{ type: 'text', text: 'Tool name is required' }],
        isError: true,
      });
    }

    // Execute the tool
    const result = await tarvisClient.callTool({ name, arguments: args });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error executing tool:', error);

    const errorResult = {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred'
      }],
      isError: true,
    };

    res.status(400).json(errorResult);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

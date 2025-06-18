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
  availableModels: [
    model_gpt_4,
    {
      name: 'Mock GPT-3.5',
      description: 'Mock model simulating GPT-3.5 capabilities',
      id: 'mock-gpt-3.5',
      ModelInstance: mockGpt35Model,
    },
  ],
});

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Chat endpoint
app.post('/chat', async (req: Request, res: Response) => {
  const stream = await tarvisClient.streamChatResponse(req.body);
  Readable.fromWeb(stream).pipe(res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

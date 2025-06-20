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

// Translation tool
const translateTool = createMultiParamTool(
  'translate',
  'Translate text between languages',
  {
    text: z.string().describe('Text to translate'),
    from: z.string().describe('Source language code (e.g., "en", "es", "fr", "de", "it")'),
    to: z.string().describe('Target language code (e.g., "en", "es", "fr", "de", "it")'),
  },
  ['text', 'from', 'to']
);

// Number-based tool - Currency converter
const currencyConverterTool = createMultiParamTool(
  'currency_converter',
  'Convert between different currencies',
  {
    amount: z.number().describe('Amount to convert'),
    from_currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']).describe('Source currency'),
    to_currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']).describe('Target currency'),
    include_fees: z.boolean().optional().describe('Include conversion fees in calculation'),
  },
  ['amount', 'from_currency', 'to_currency']
);

// Boolean-based tool - Text formatter
const textFormatterTool = createMultiParamTool(
  'text_formatter',
  'Format text with various options',
  {
    text: z.string().describe('Text to format'),
    uppercase: z.boolean().describe('Convert to uppercase'),
    remove_spaces: z.boolean().describe('Remove all spaces'),
    reverse: z.boolean().describe('Reverse the text'),
    add_prefix: z.string().optional().describe('Add prefix to text'),
  },
  ['text', 'uppercase', 'remove_spaces', 'reverse']
);

// Mixed types tool - File processor
const fileProcessorTool = createMultiParamTool(
  'file_processor',
  'Process files with various options',
  {
    filename: z.string().describe('Name of the file to process'),
    operation: z.enum(['compress', 'encrypt', 'backup', 'validate']).describe('Operation to perform'),
    priority: z.enum(['low', 'medium', 'high']).describe('Processing priority'),
    overwrite: z.boolean().describe('Overwrite existing files'),
    max_size: z.number().optional().describe('Maximum file size in MB'),
  },
  ['filename', 'operation', 'priority', 'overwrite']
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

tarvisClient.addTool(translateTool, async (args: Record<string, any>) => {
  try {
    const { text, from, to } = args;
    
    // Mock translation - in a real app, you'd call a translation API
    const mockTranslations: Record<string, Record<string, string>> = {
      'hello': {
        'es': 'hola',
        'fr': 'bonjour',
        'de': 'hallo',
        'it': 'ciao',
        'en': 'hello'
      },
      'goodbye': {
        'es': 'adiós',
        'fr': 'au revoir',
        'de': 'auf wiedersehen',
        'it': 'arrivederci',
        'en': 'goodbye'
      },
      'thank you': {
        'es': 'gracias',
        'fr': 'merci',
        'de': 'danke',
        'it': 'grazie',
        'en': 'thank you'
      },
      'how are you': {
        'es': '¿cómo estás?',
        'fr': 'comment allez-vous?',
        'de': 'wie geht es dir?',
        'it': 'come stai?',
        'en': 'how are you'
      }
    };

    const lowerText = text.toLowerCase();
    let translatedText = text; // Default to original text

    // Check if we have a mock translation
    if (mockTranslations[lowerText] && mockTranslations[lowerText][to]) {
      translatedText = mockTranslations[lowerText][to];
    } else {
      // Generate a mock translation based on language codes
      const languageNames: Record<string, string> = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian'
      };
      
      const fromLang = languageNames[from] || from;
      const toLang = languageNames[to] || to;
      
      translatedText = `[Mock translation from ${fromLang} to ${toLang}: "${text}"]`;
    }

    return {
      content: [{ 
        type: 'text', 
        text: `Translation (${from} → ${to}): ${translatedText}` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `Translation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }],
      isError: true,
    };
  }
});

tarvisClient.addTool(currencyConverterTool, async (args: Record<string, any>) => {
  try {
    const { amount, from_currency, to_currency, include_fees } = args;
    
    // Mock exchange rates
    const rates: Record<string, number> = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.73,
      'JPY': 110.0,
      'CAD': 1.25,
      'AUD': 1.35
    };
    
    const fromRate = rates[from_currency];
    const toRate = rates[to_currency];
    
    if (!fromRate || !toRate) {
      throw new Error('Unsupported currency');
    }
    
    let convertedAmount = (amount / fromRate) * toRate;
    let feeAmount = 0;
    
    if (include_fees) {
      feeAmount = convertedAmount * 0.02; // 2% fee
      convertedAmount += feeAmount;
    }
    
    const result = `$${amount.toFixed(2)} ${from_currency} = $${convertedAmount.toFixed(2)} ${to_currency}`;
    const feeInfo = include_fees ? ` (includes $${feeAmount.toFixed(2)} fee)` : '';
    
    return {
      content: [{ 
        type: 'text', 
        text: `${result}${feeInfo}` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `Currency conversion error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }],
      isError: true,
    };
  }
});

tarvisClient.addTool(textFormatterTool, async (args: Record<string, any>) => {
  try {
    const { text, uppercase, remove_spaces, reverse, add_prefix } = args;
    
    let formattedText = text;
    
    if (uppercase) {
      formattedText = formattedText.toUpperCase();
    }
    
    if (remove_spaces) {
      formattedText = formattedText.replace(/\s/g, '');
    }
    
    if (reverse) {
      formattedText = formattedText.split('').reverse().join('');
    }
    
    if (add_prefix) {
      formattedText = `${add_prefix}${formattedText}`;
    }
    
    return {
      content: [{ 
        type: 'text', 
        text: `Formatted text: "${formattedText}"` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `Text formatting error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }],
      isError: true,
    };
  }
});

tarvisClient.addTool(fileProcessorTool, async (args: Record<string, any>) => {
  try {
    const { filename, operation, priority, overwrite, max_size } = args;
    
    const operations: Record<string, string> = {
      compress: 'compressing',
      encrypt: 'encrypting',
      backup: 'creating backup of',
      validate: 'validating'
    };
    
    const priorities: Record<string, string> = {
      low: 'low priority',
      medium: 'medium priority',
      high: 'high priority'
    };
    
    let result = `Started ${operations[operation as string]} "${filename}" with ${priorities[priority as string]} priority`;
    
    if (overwrite) {
      result += ' (overwrite enabled)';
    }
    
    if (max_size) {
      result += ` (max size: ${max_size}MB)`;
    }
    
    result += '. Processing complete!';
    
    return {
      content: [{ 
        type: 'text', 
        text: result 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `File processing error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }],
      isError: true,
    };
  }
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

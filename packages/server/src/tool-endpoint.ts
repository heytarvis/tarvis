import { TarvisClient } from './tarvis-client';
import { MCPCallToolRequest, MCPCallToolResult } from '@tarvis/shared/src';

export interface ToolEndpointOptions {
  client: TarvisClient;
}

export function createToolEndpoint(options: ToolEndpointOptions) {
  const { client } = options;

  return async function handleToolRequest(request: Request): Promise<Response> {
    try {
      const body = await request.json() as MCPCallToolRequest;
      
      // Execute the tool
      const result = await client.callTool(body);
      console.log(result)
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error executing tool:', error);
      
      const errorResult: MCPCallToolResult = {
        content: [{ 
          type: 'text', 
          text: error instanceof Error ? error.message : 'Unknown error occurred' 
        }],
        isError: true,
      };
      
      return new Response(JSON.stringify(errorResult), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
} 

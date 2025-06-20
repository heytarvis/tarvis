import { MCPTool } from '@tarvis/shared/src';
import { z } from 'zod';

/**
 * Create a simple text-based tool
 * @param name Tool name
 * @param description Tool description
 * @param parameterName Name of the input parameter
 * @param parameterDescription Description of the input parameter
 * @returns MCPTool definition
 */
export function createTextTool(
  name: string,
  description: string,
  parameterName: string,
  parameterDescription: string
): MCPTool {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties: {
        [parameterName]: z.string().describe(parameterDescription),
      },
      required: [parameterName],
    },
  };
}

/**
 * Create a tool with multiple parameters
 * @param name Tool name
 * @param description Tool description
 * @param properties Parameter definitions with Zod schemas
 * @param required Required parameter names
 * @returns MCPTool definition
 */
export function createMultiParamTool(
  name: string,
  description: string,
  properties: Record<string, any>,
  required: string[]
): MCPTool {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required,
    },
  };
}

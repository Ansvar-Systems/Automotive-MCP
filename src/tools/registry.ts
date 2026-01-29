/**
 * Shared tool registry for the Automotive Cybersecurity MCP server.
 * Single source of truth for tool definitions and handlers.
 *
 * Pattern: Based on EU Compliance MCP architecture
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type Database from 'better-sqlite3';
import {
  CallToolRequest,
  CallToolResult,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listSources } from './list.js';
import type { ListSourcesInput } from '../types/index.js';

/**
 * Tool definition with name, description, input schema, and handler function
 */
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (db: Database.Database, args: unknown) => unknown;
}

/**
 * Registry of all available tools
 */
const TOOLS: ToolDefinition[] = [
  {
    name: 'list_sources',
    description:
      'List available automotive cybersecurity regulations and standards. Returns metadata including version, type (regulation/standard), item counts, and whether full text is available.',
    inputSchema: {
      type: 'object',
      properties: {
        source_type: {
          type: 'string',
          enum: ['regulation', 'standard', 'all'],
          description:
            'Filter by source type. "regulation" returns UNECE regulations, "standard" returns ISO standards, "all" returns both.',
        },
      },
    },
    handler: (db: Database.Database, args: unknown) => {
      const input = args as ListSourcesInput;
      return listSources(db, input);
    },
  },
];

/**
 * Register all tool handlers with the MCP server.
 *
 * @param server - MCP server instance
 * @param db - SQLite database connection
 */
export function registerTools(server: Server, db: Database.Database): void {
  // Register ListToolsRequest handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  // Register CallToolRequest handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    // Find tool by name
    const tool = TOOLS.find((t) => t.name === name);

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Execute tool handler
      const result = tool.handler(db, args ?? {});

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });
}

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
import { getRequirement } from './get.js';
import type { ListSourcesInput, GetRequirementInput } from '../types/index.js';

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
  {
    name: 'get_requirement',
    description:
      'Retrieve a specific regulation article or standard clause. For regulations (UNECE R155/R156), returns full text. For standards (ISO 21434), returns guidance and work products only (full text requires paid license). Optionally includes cross-framework mappings.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description:
            'Source ID (e.g., "r155", "r156", "iso_21434"). Use list_sources to see available sources.',
        },
        reference: {
          type: 'string',
          description:
            'Reference identifier within the source (e.g., "7.2.2.2" for regulation article, "9.3" for standard clause).',
        },
        include_mappings: {
          type: 'boolean',
          description:
            'Include cross-framework mappings to related requirements in other regulations/standards. Default: false.',
        },
      },
      required: ['source', 'reference'],
    },
    handler: (db: Database.Database, args: unknown) => {
      const input = args as GetRequirementInput;
      return getRequirement(db, input);
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

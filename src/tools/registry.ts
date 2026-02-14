/**
 * Shared tool registry for the Automotive Cybersecurity MCP server.
 * Single source of truth for tool definitions and handlers.
 *
 * Pattern: Based on EU Compliance MCP architecture
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type Database from '@ansvar/mcp-sqlite';
import {
  CallToolRequest,
  CallToolResult,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listSources } from './list.js';
import { getRequirement } from './get.js';
import { searchRequirements } from './search.js';
import { listWorkProducts } from './workproducts.js';
import { exportComplianceMatrix } from './export.js';
import { getAbout, type AboutContext } from './about.js';
import type { ListSourcesInput, GetRequirementInput, SearchRequirementsInput, ListWorkProductsInput, ExportComplianceMatrixInput } from '../types/index.js';

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
  handler: (db: InstanceType<typeof Database>, args: unknown) => unknown;
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
    handler: (db: InstanceType<typeof Database>, args: unknown) => {
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
    handler: (db: InstanceType<typeof Database>, args: unknown) => {
      const input = args as GetRequirementInput;
      return getRequirement(db, input);
    },
  },
  {
    name: 'search_requirements',
    description:
      'Full-text search across all regulations and standards using FTS5 with BM25 ranking. Search regulations (UNECE R155/R156 full text) and standards (ISO 21434 guidance). Returns results sorted by relevance with highlighted snippets. Useful for finding requirements by topic, keyword, or concept.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query text. Can be a single word, phrase, or multiple terms. FTS5 will tokenize and rank results by relevance.',
        },
        sources: {
          type: 'array',
          items: {
            type: 'string',
          },
          description:
            'Optional: Filter to specific sources (e.g., ["r155", "iso_21434"]). Omit to search all sources.',
        },
        limit: {
          type: 'number',
          description:
            'Maximum number of results to return. Default: 10. Results are ranked by BM25 relevance score.',
        },
      },
      required: ['query'],
    },
    handler: (db: InstanceType<typeof Database>, args: unknown) => {
      const input = args as SearchRequirementsInput;
      return searchRequirements(db, input);
    },
  },
  {
    name: 'list_work_products',
    description:
      'List ISO 21434 work products (deliverables) required for cybersecurity engineering. Shows which artifacts to produce for each clause, whether CAL-dependent, and which R155 requirements they help satisfy. Filter by specific clause or lifecycle phase.',
    inputSchema: {
      type: 'object',
      properties: {
        clause_id: {
          type: 'string',
          description:
            'Filter to a specific ISO 21434 clause (e.g., "15" for TARA, "6" for cybersecurity case). Omit for all clauses.',
        },
        phase: {
          type: 'string',
          enum: ['organizational', 'project', 'continual', 'concept', 'development', 'validation', 'production', 'operations', 'decommissioning', 'tara'],
          description:
            'Filter by lifecycle phase. Options: organizational, project, continual, concept, development, validation, production, operations, decommissioning, tara.',
        },
      },
    },
    handler: (db: InstanceType<typeof Database>, args: unknown) => {
      const input = args as ListWorkProductsInput;
      return listWorkProducts(db, input);
    },
  },
  {
    name: 'export_compliance_matrix',
    description:
      'Generate a compliance traceability matrix showing regulation requirements mapped to ISO 21434 clauses and work products. Export as Markdown table or CSV for spreadsheet import. Useful for audit documentation, gap analysis, and compliance tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        regulation: {
          type: 'string',
          enum: ['r155', 'r156'],
          description:
            'Regulation to generate matrix for. Default: "r155".',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'csv'],
          description:
            'Output format. "markdown" for documentation, "csv" for spreadsheet import. Default: "markdown".',
        },
        include_guidance: {
          type: 'boolean',
          description:
            'Include ISO 21434 guidance summaries in output. Default: false.',
        },
      },
    },
    handler: (db: InstanceType<typeof Database>, args: unknown) => {
      const input = args as ExportComplianceMatrixInput;
      return exportComplianceMatrix(db, input);
    },
  },
];

function createAboutTool(context: AboutContext): ToolDefinition {
  return {
    name: 'about',
    description:
      'Server metadata, dataset statistics, freshness, and provenance. ' +
      'Call this to verify data coverage, currency, and content basis before relying on results.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: (db) => {
      return getAbout(db, context);
    },
  };
}

export function buildTools(context: AboutContext): ToolDefinition[] {
  return [...TOOLS, createAboutTool(context)];
}

/**
 * Register all tool handlers with the MCP server.
 *
 * @param server - MCP server instance
 * @param db - SQLite database connection
 * @param context - Optional about context for metadata tool
 */
export function registerTools(server: Server, db: InstanceType<typeof Database>, context?: AboutContext): void {
  const allTools = context ? buildTools(context) : TOOLS;
  // Register ListToolsRequest handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  // Register CallToolRequest handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    // Find tool by name
    const tool = allTools.find((t) => t.name === name);

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

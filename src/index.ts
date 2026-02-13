#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import Database from '@ansvar/mcp-sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerTools } from './tools/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - can be overridden with env var
const DB_PATH = process.env.AUTOMOTIVE_CYBERSEC_DB_PATH || join(__dirname, '..', 'data', 'automotive.db');

function getDatabase(): InstanceType<typeof Database> {
  try {
    return new Database(DB_PATH, { readonly: true });
  } catch (error) {
    throw new Error(`Failed to open database at ${DB_PATH}: ${error}`);
  }
}

const db = getDatabase();
const server = new Server(
  {
    name: 'automotive-cybersecurity-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools via shared registry
registerTools(server, db);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Automotive Cybersecurity MCP server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

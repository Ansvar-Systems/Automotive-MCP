#!/usr/bin/env node

/**
 * HTTP Server entry point for the Automotive Cybersecurity MCP server.
 * Provides StreamableHTTP transport for Docker container deployment.
 *
 * Usage:
 *   PORT=3000 node dist/http-server.js
 *   AUTOMOTIVE_CYBERSEC_DB_PATH=/path/to/db.sqlite node dist/http-server.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { createHash, randomUUID } from 'crypto';
import { readFileSync, statSync } from 'fs';
import Database from '@ansvar/mcp-sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerTools } from './tools/registry.js';
import type { AboutContext } from './tools/about.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SERVER_NAME = 'automotive-cybersecurity-mcp';
const PKG_PATH = join(__dirname, '..', 'package.json');
const pkgVersion: string = JSON.parse(readFileSync(PKG_PATH, 'utf-8')).version;
const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_PATH =
  process.env.AUTOMOTIVE_CYBERSEC_DB_PATH ||
  join(__dirname, '..', 'data', 'automotive.db');

// Database connection
function getDatabase(): InstanceType<typeof Database> {
  try {
    return new Database(DB_PATH, { readonly: true });
  } catch (error) {
    throw new Error(`Failed to open database at ${DB_PATH}: ${error}`);
  }
}

function computeAboutContext(): AboutContext {
  let fingerprint = 'unknown';
  let dbBuilt = new Date().toISOString();
  try {
    const dbBuffer = readFileSync(DB_PATH);
    fingerprint = createHash('sha256').update(dbBuffer).digest('hex').slice(0, 12);
    const dbStat = statSync(DB_PATH);
    dbBuilt = dbStat.mtime.toISOString();
  } catch {
    // Non-fatal
  }
  return { version: pkgVersion, fingerprint, dbBuilt };
}

const aboutContext = computeAboutContext();
const db = getDatabase();

// Session management
const sessions = new Map<string, StreamableHTTPServerTransport>();

/**
 * Create a new MCP server instance with tools registered.
 */
function createMCPServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: pkgVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register all tools via shared registry (with about context)
  registerTools(server, db, aboutContext);

  return server;
}

/**
 * Handle health check requests.
 */
function handleHealthCheck(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'ok',
      server: SERVER_NAME,
      version: pkgVersion,
    }),
  );
}

/**
 * Handle CORS preflight requests.
 */
function handleCORS(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
  });
  res.end();
}

/**
 * Handle MCP requests via StreamableHTTPServerTransport.
 */
async function handleMCPRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // Set CORS headers for all MCP responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, mcp-session-id',
  );

  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // If we have a session ID, try to reuse the existing transport
  if (sessionId && sessions.has(sessionId)) {
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }

  // For new sessions (no session ID or unknown session ID on POST),
  // create a new transport and server
  if (req.method === 'POST') {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    const server = createMCPServer();

    // Clean up session on close
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        sessions.delete(sid);
        console.log(`Session closed: ${sid}`);
      }
    };

    await server.connect(transport);

    // Store the session
    const sid = transport.sessionId;
    if (sid) {
      sessions.set(sid, transport);
      console.log(`New session created: ${sid}`);
    }

    await transport.handleRequest(req, res);
    return;
  }

  // GET or DELETE with unknown session ID
  if (sessionId) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session not found' }));
    return;
  }

  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Missing mcp-session-id header' }));
}

/**
 * Handle 404 Not Found.
 */
function handleNotFound(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Create HTTP server
const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      handleCORS(req, res);
      return;
    }

    // Health check
    if (url.pathname === '/health' && req.method === 'GET') {
      handleHealthCheck(req, res);
      return;
    }

    // MCP endpoint
    if (url.pathname === '/mcp') {
      await handleMCPRequest(req, res);
      return;
    }

    // Everything else
    handleNotFound(req, res);
  } catch (error) {
    console.error('Request error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Internal server error',
        }),
      );
    }
  }
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`${SERVER_NAME} v${pkgVersion} HTTP server listening on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  MCP:    http://localhost:${PORT}/mcp`);
  console.log(`  DB:     ${DB_PATH}`);
});

// Graceful shutdown
function shutdown(signal: string): void {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Close all active sessions
  for (const [sid, transport] of sessions) {
    console.log(`Closing session: ${sid}`);
    transport.close().catch((err) => {
      console.error(`Error closing session ${sid}:`, err);
    });
  }
  sessions.clear();

  // Close database
  try {
    db.close();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Error closing database:', err);
  }

  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

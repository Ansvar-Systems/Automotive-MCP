#!/usr/bin/env node

/**
 * Simple MCP client to test the server manually
 * This spawns the server and sends test requests
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_PATH = join(__dirname, 'dist', 'index.js');

console.log('='.repeat(80));
console.log('MCP Server Manual Client Test');
console.log('='.repeat(80));

// Simple JSON-RPC request builder
function createRequest(id, method, params = {}) {
  return {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
}

// Spawn the server
const server = spawn('node', [SERVER_PATH], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let requestId = 1;
const pendingRequests = new Map();
let buffer = '';

// Handle server output
server.stdout.on('data', (data) => {
  buffer += data.toString();

  // Try to parse complete JSON-RPC messages
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const response = JSON.parse(line);
      console.log('\n📥 Response:', JSON.stringify(response, null, 2));

      if (response.id && pendingRequests.has(response.id)) {
        const resolve = pendingRequests.get(response.id);
        pendingRequests.delete(response.id);
        resolve(response);
      }
    } catch (e) {
      // Not valid JSON, might be error output
      console.log('Server output:', line);
    }
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code || 0);
});

// Send request and wait for response
function sendRequest(method, params) {
  return new Promise((resolve, reject) => {
    const id = requestId++;
    const request = createRequest(id, method, params);

    console.log('\n📤 Request:', JSON.stringify(request, null, 2));

    pendingRequests.set(id, resolve);

    server.stdin.write(JSON.stringify(request) + '\n');

    // Timeout after 5 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Request ${id} timed out`));
      }
    }, 5000);
  });
}

// Run tests
async function runTests() {
  try {
    console.log('\n1. Initialize connection...');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });

    console.log('\n2. List available tools...');
    await sendRequest('tools/list', {});

    console.log('\n3. Test list_sources...');
    await sendRequest('tools/call', {
      name: 'list_sources',
      arguments: {}
    });

    console.log('\n4. Test list_sources with filter...');
    await sendRequest('tools/call', {
      name: 'list_sources',
      arguments: { source_type: 'regulation' }
    });

    console.log('\n5. Test get_requirement for R155...');
    await sendRequest('tools/call', {
      name: 'get_requirement',
      arguments: {
        source: 'r155',
        reference: '7.2.2.2'
      }
    });

    console.log('\n6. Test get_requirement for ISO 21434...');
    await sendRequest('tools/call', {
      name: 'get_requirement',
      arguments: {
        source: 'iso_21434',
        reference: '9.3'
      }
    });

    console.log('\n7. Test search_requirements for "cyber attack"...');
    await sendRequest('tools/call', {
      name: 'search_requirements',
      arguments: {
        query: 'cyber attack'
      }
    });

    console.log('\n8. Test search_requirements for "risk assessment"...');
    await sendRequest('tools/call', {
      name: 'search_requirements',
      arguments: {
        query: 'risk assessment',
        limit: 5
      }
    });

    console.log('\n9. Test search_requirements for "vulnerability"...');
    await sendRequest('tools/call', {
      name: 'search_requirements',
      arguments: {
        query: 'vulnerability',
        sources: ['iso_21434']
      }
    });

    console.log('\n✅ All tests completed successfully!');

    // Give time for final responses
    setTimeout(() => {
      server.kill();
    }, 1000);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    server.kill();
    process.exit(1);
  }
}

// Wait a bit for server to start
setTimeout(runTests, 500);

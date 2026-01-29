# Automotive Cybersecurity MCP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready MCP server providing automotive cybersecurity regulations (UNECE R155/R156), ISO 21434 guidance, and TARA methodology with cross-framework mappings.

**Architecture:** TypeScript MCP server with SQLite database, FTS5 full-text search, and shared tool registry pattern. Database built from seed JSON files via build scripts. Follows EU compliance MCP patterns for consistency.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, better-sqlite3, vitest

---

## Phase 1: Project Foundation (Tasks 1-2)

These tasks establish the basic TypeScript project structure, dependencies, and type definitions that all subsequent work will build upon.

### Task 1: Initialize TypeScript Project

Initialize the Node.js/TypeScript project with MCP dependencies, configure compilation, and verify the setup works.

**Files to create:**
- `package.json` - Project metadata and dependencies
- `tsconfig.json` - TypeScript compiler configuration
- `vitest.config.ts` - Test configuration

**Why this order:** Must have working TypeScript compilation before writing any code.

**Step 1: Create package.json**

```bash
cat > package.json << 'EOF'
{
  "name": "@ansvar/automotive-cybersecurity-mcp",
  "version": "0.1.0",
  "description": "MCP server for automotive cybersecurity regulations, standards, and TARA methodology",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "automotive-cybersecurity-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "build:db": "tsx scripts/build-db.ts",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build && npm run build:db"
  },
  "keywords": [
    "mcp",
    "automotive",
    "cybersecurity",
    "unece",
    "r155",
    "r156",
    "iso21434",
    "tara"
  ],
  "author": "Jeffrey von Rotz <jeffrey@ansvar.ai>",
  "license": "Apache-2.0",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "better-sqlite3": "^11.8.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.10.5",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
EOF
```

**Step 2: Create tsconfig.json**

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "lib": ["ES2022"],
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
```

**Step 3: Create vitest.config.ts**

```bash
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/**', 'scripts/**', '**/*.config.ts']
    }
  }
});
EOF
```

**Step 4: Install dependencies**

Run: `npm install`

Expected output: "added XX packages" with no errors

**Step 5: Verify TypeScript compilation**

Run: `npm run build`

Expected output: TypeScript compiles with no errors (dist/ folder created but empty)

**Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "feat: initialize TypeScript project

- Add MCP SDK and SQLite dependencies
- Configure TypeScript for Node16 ES modules
- Set up vitest for testing
- Add npm scripts for build and development

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create Type Definitions

Define all TypeScript interfaces for database records, tool inputs, and tool outputs. This provides type safety throughout the implementation.

**Files to create:**
- `src/types/index.ts` - All type definitions

**Why this order:** Type definitions must exist before writing any implementation code that uses them.

**Step 1: Create directory structure**

Run: `mkdir -p src/types tests/tools`

**Step 2: Create type definitions file**

Content too long to include inline - see design document for full `src/types/index.ts` content with:
- Database record types (Regulation, RegulationContent, Standard, etc.)
- Tool input types (GetRequirementInput, SearchRequirementsInput, etc.)
- Tool output types (GetRequirementOutput, SearchResult, etc.)

**Step 3: Verify compilation**

Run: `npm run build`

Expected: Compiles successfully, `dist/types/index.d.ts` and `dist/types/index.js` created

**Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions

- Database record types for all tables
- Tool input/output interfaces
- Type-safe API contracts for all 7 tools

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Database Schema & Build System (Tasks 3-5)

These tasks create the SQLite database schema, build system, and populate it with minimal test data.

### Task 3: Create Database Schema

Create the SQLite database schema with all tables, FTS5 indexes, and triggers. This is the data foundation for the entire server.

**Files to create:**
- `scripts/build-db.ts` - Database build script

**Why this order:** Schema must exist before we can populate data.

**Step 1: Create scripts directory**

Run: `mkdir -p scripts data/seed`

**Step 2: Create build-db.ts**

See full script in design document - creates:
- regulations table
- regulation_content table + FTS5
- standards table
- standard_clauses table + FTS5
- work_products table
- threat_scenarios, damage_scenarios, cybersecurity_goals tables
- framework_mappings table with indexes

**Step 3: Run build script**

Run: `npm run build:db`

Expected output: "Database ready at: data/automotive.db"

**Step 4: Verify database created**

Run: `file data/automotive.db`

Expected: "SQLite 3.x database"

**Step 5: Verify schema**

Run: `sqlite3 data/automotive.db ".tables"`

Expected: List of all table names

**Step 6: Commit**

```bash
git add scripts/build-db.ts
git commit -m "feat: add database schema and build script

- Complete SQLite schema for all tables
- FTS5 full-text search indexes
- Triggers to keep FTS5 in sync
- Cross-framework mapping structure
- Build script generates database from schema

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Create Minimal Seed Data

Create minimal JSON seed data files for testing. Just enough to verify database population works.

**Files to create:**
- `data/seed/regulations.json` - R155/R156 metadata + 1 sample article
- `data/seed/standards.json` - ISO 21434 metadata + 1 sample clause

**Why this order:** Need seed data before we can test database population.

**Step 1: Create regulations seed file**

```bash
cat > data/seed/regulations.json << 'EOF'
{
  "regulations": [
    {
      "id": "r155",
      "full_name": "UN Regulation No. 155",
      "title": "Cyber Security and Cyber Security Management System",
      "version": "Revision 2",
      "effective_date": "2024-07-07",
      "source_url": "https://unece.org/transport/documents/2021/03/standards/un-regulation-no-155",
      "applies_to": ["M1", "M2", "M3", "N1", "N2", "N3", "O3", "O4"],
      "regulation_type": "unece"
    },
    {
      "id": "r156",
      "full_name": "UN Regulation No. 156",
      "title": "Software Update and Software Updates Management System",
      "version": "Revision 2",
      "effective_date": "2024-07-07",
      "source_url": "https://unece.org/transport/documents/2021/03/standards/un-regulation-no-156",
      "applies_to": ["M1", "M2", "M3", "N1", "N2", "N3", "O3", "O4"],
      "regulation_type": "unece"
    }
  ],
  "content": [
    {
      "regulation": "r155",
      "content_type": "article",
      "reference": "7.2.2.2",
      "title": "Cyber Security Management System Requirements",
      "text": "The Cyber Security Management System shall be appropriate to the type of vehicle and shall address the following areas as they apply to the vehicle type: (a) vehicle type related risk assessment in relation to cyber-attacks...",
      "parent_reference": null
    }
  ]
}
EOF
```

**Step 2: Create standards seed file**

```bash
cat > data/seed/standards.json << 'EOF'
{
  "standards": [
    {
      "id": "iso_21434",
      "full_name": "ISO/SAE 21434:2021",
      "title": "Road vehicles — Cybersecurity engineering",
      "version": "2021",
      "note": "Standard text requires paid license. Clause IDs and expert guidance provided."
    }
  ],
  "clauses": [
    {
      "standard": "iso_21434",
      "clause_id": "9.3",
      "title": "Vulnerability analysis",
      "guidance": "Monitor for vulnerabilities in components throughout vehicle lifetime. Establish processes for vulnerability disclosure, triage, and remediation. Interface with PSIRT for coordination.",
      "work_products": ["[WP-09-03]"],
      "cal_relevant": 1
    }
  ]
}
EOF
```

**Step 3: Commit seed data**

```bash
git add data/seed/
git commit -m "feat: add minimal seed data for testing

- R155 and R156 regulation metadata
- Sample R155 article for testing search
- ISO 21434 metadata and sample clause
- Minimal but sufficient for development

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Implement Database Population

Extend the build script to load seed data from JSON files and populate the database tables.

**Files to modify:**
- `scripts/build-db.ts` - Add data loading logic

**Why this order:** Schema exists, seed files exist, now connect them.

**Step 1: Add seed loading to build-db.ts**

Add data loading functions after schema creation (see full implementation in earlier plan section).

**Step 2: Rebuild database with data**

Run: `rm data/automotive.db && npm run build:db`

Expected output:
```
✓ Schema created
✓ Loaded 2 regulations
✓ Loaded 1 content items
✓ Loaded 1 standards
✓ Loaded 1 clauses
✓ Database populated successfully
```

**Step 3: Verify data**

Run: `sqlite3 data/automotive.db "SELECT id, title FROM regulations;"`

Expected: 2 rows (r155, r156)

Run: `sqlite3 data/automotive.db "SELECT standard, clause_id FROM standard_clauses;"`

Expected: 1 row (iso_21434, 9.3)

**Step 4: Test FTS5 search**

Run: `sqlite3 data/automotive.db "SELECT reference FROM regulation_content_fts WHERE regulation_content_fts MATCH 'vulnerability';"`

Expected: Returns "7.2.2.2"

**Step 5: Commit**

```bash
git add scripts/build-db.ts
git commit -m "feat: implement database population from seed files

- Load regulations and content from JSON
- Load standards and clauses from JSON
- Transactional inserts for integrity
- FTS5 indexes automatically populated

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: MCP Server & Core Tools (Tasks 6-9)

These tasks implement the MCP server and the first three core tools.

### Task 6: Create Basic MCP Server

Create the main MCP server with stdio transport and database connection. This is the entry point for the entire service.

**Files to create:**
- `src/index.ts` - Main server file

**Why this order:** Need working server before adding tools.

**Step 1: Create src/index.ts**

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - can be overridden with env var
const DB_PATH = process.env.AUTOMOTIVE_CYBERSEC_DB_PATH || join(__dirname, '..', 'data', 'automotive.db');

function getDatabase(): Database.Database {
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

// List tools (empty for now, will add registry later)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [],
}));

// Call tool (returns error for now, will add registry later)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}`,
      },
    ],
    isError: true,
  };
});

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
```

**Step 2: Build**

Run: `npm run build`

Expected: Compiles successfully

**Step 3: Make executable**

Run: `chmod +x dist/index.js`

**Step 4: Test server starts**

Run: `timeout 2 node dist/index.js || true`

Expected: stderr shows "Automotive Cybersecurity MCP server started"

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: create basic MCP server

- Initialize MCP server with stdio transport
- Open SQLite database in read-only mode
- Empty tool handlers (registry added next)
- Server starts successfully

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Implement list_sources Tool

Implement the `list_sources` tool with tests and wire it up via a shared registry pattern.

**Files to create:**
- `src/tools/list.ts` - Tool implementation
- `src/tools/registry.ts` - Shared tool registry
- `tests/tools/list.test.ts` - Tests

**Files to modify:**
- `src/index.ts` - Wire up registry

**Why this order:** Simplest tool, establishes patterns for remaining tools.

**Step 1: Write test first (TDD)**

Create `tests/tools/list.test.ts` with tests for:
- List all sources
- Filter to regulations only
- Filter to standards only
- Include item counts

(See full test in plan section above)

**Step 2: Run test to verify failure**

Run: `npm test`

Expected: FAIL - "Cannot find module"

**Step 3: Implement list.ts**

Create `src/tools/list.ts` with implementation (see full code in plan)

**Step 4: Run test to verify pass**

Run: `npm test`

Expected: PASS - All tests pass

**Step 5: Create registry.ts**

Create `src/tools/registry.ts` with shared tool registry pattern (see full code in plan)

**Step 6: Wire up registry in index.ts**

Modify `src/index.ts`:
- Import `registerTools`
- Replace tool handlers with `registerTools(server, db)`

**Step 7: Build and verify**

Run: `npm run build`

Expected: Compiles successfully

**Step 8: Commit**

```bash
git add src/tools/list.ts src/tools/registry.ts tests/tools/list.test.ts src/index.ts
git commit -m "feat: implement list_sources tool with registry

- Add list_sources tool with filtering
- Create shared tool registry (EU MCP pattern)
- Wire registry to main server
- Comprehensive tests with in-memory DB

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Implement get_requirement Tool

Implement the `get_requirement` tool with support for both regulations (full text) and standards (guidance only).

**Files to create:**
- `src/tools/get-requirement.ts` - Tool implementation
- `tests/tools/get-requirement.test.ts` - Tests

**Files to modify:**
- `src/tools/registry.ts` - Add tool definition

**Why this order:** Core retrieval tool, needed for other tools.

**Step 1: Write test**

Create `tests/tools/get-requirement.test.ts` (see full test in plan)

Tests:
- Get regulation with full text
- Get standard with guidance only
- Include mappings
- Error on unknown source

**Step 2: Run test to verify failure**

Run: `npm test get-requirement`

Expected: FAIL - Module not found

**Step 3: Implement get-requirement.ts**

Create `src/tools/get-requirement.ts` (see full implementation in plan)

**Step 4: Run test to verify pass**

Run: `npm test get-requirement`

Expected: PASS

**Step 5: Add to registry**

Modify `src/tools/registry.ts`:
- Import getRequirement
- Add tool definition to TOOLS array

**Step 6: Build and test**

Run: `npm run build && npm test`

Expected: All tests pass

**Step 7: Commit**

```bash
git add src/tools/get-requirement.ts tests/tools/get-requirement.test.ts src/tools/registry.ts
git commit -m "feat: implement get_requirement tool

- Retrieve regulation content with full text
- Retrieve standard clauses with guidance only
- Include cross-framework mappings optionally
- Comprehensive error handling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Implement search_requirements Tool

Implement full-text search using FTS5 with BM25 ranking across regulations and standards.

**Files to create:**
- `src/tools/search.ts` - Tool implementation
- `tests/tools/search.test.ts` - Tests

**Files to modify:**
- `src/tools/registry.ts` - Add tool definition

**Why this order:** Primary discovery tool, uses FTS5 indexes we created.

**Step 1: Write test**

Create `tests/tools/search.test.ts` (see full test in plan)

Tests:
- Search across all sources
- Filter to specific sources
- Respect limit parameter
- Return empty for no matches

**Step 2: Run test to verify failure**

Run: `npm test search`

Expected: FAIL

**Step 3: Implement search.ts**

Create `src/tools/search.ts` with FTS5 queries (see full implementation in plan)

**Step 4: Run test to verify pass**

Run: `npm test search`

Expected: PASS

**Step 5: Add to registry**

Modify `src/tools/registry.ts` to add search_requirements tool definition

**Step 6: Build and test**

Run: `npm run build && npm test`

Expected: All tests pass

**Step 7: Commit**

```bash
git add src/tools/search.ts tests/tools/search.test.ts src/tools/registry.ts
git commit -m "feat: implement search_requirements with FTS5

- Full-text search across all content
- FTS5 BM25 ranking for relevance
- Source filtering and result limits
- Snippet generation with highlighting

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Documentation & Testing (Task 10)

### Task 10: Create README and Final Verification

Create comprehensive documentation and verify all components work together.

**Files to create:**
- `README.md` - Project documentation

**Why this order:** Core functionality complete, ready to document.

**Step 1: Create README.md**

(See full README content in plan above with sections for:
- Overview
- Installation for Claude Desktop
- Available tools
- Use cases
- Integration with other MCPs
- Development setup)

**Step 2: Test with MCP Inspector**

Run: `npx @modelcontextprotocol/inspector node dist/index.js`

Expected: Inspector opens, tools are listed, can execute list_sources

**Step 3: Verify all tests pass**

Run: `npm test`

Expected: All tests pass

**Step 4: Verify build works**

Run: `npm run build && npm run build:db`

Expected: Both succeed with no errors

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README

- Installation instructions
- Tool descriptions and examples
- Use cases for type approval, compliance mapping
- Integration patterns with other MCPs
- Development setup

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Implementation Complete - Phase 1

At this point you have:

✅ Working TypeScript project with MCP SDK
✅ SQLite database with FTS5 search
✅ 3 core tools: list_sources, get_requirement, search_requirements
✅ Comprehensive tests
✅ Complete documentation

**Remaining Work (Future Phases):**

Phase 2 would add:
- `get_tara_guidance` - TARA methodology tool
- `map_standards` - Cross-framework mapping tool
- `get_work_products` - ISO 21434 work products
- `get_type_approval_checklist` - R155/R156 checklists

Phase 3 would add:
- Full R155/R156 regulation content
- Complete ISO 21434 guidance for all clauses
- TARA threat scenario library
- Cross-framework mapping data

**Estimated Time:**
- This plan (Phase 1): 4-6 hours
- Phase 2 (4 more tools): 4-6 hours
- Phase 3 (complete data): 2-3 weeks

---

**END OF IMPLEMENTATION PLAN**

# Automotive Cybersecurity MCP Server

A Model Context Protocol (MCP) server providing access to automotive cybersecurity regulations (UNECE R155/R156), ISO 21434 standard guidance, and threat analysis and risk assessment (TARA) methodology.

## Overview

This MCP server enables AI assistants to access and reason about automotive cybersecurity requirements, helping with:

- **Type approval preparation** - Access UNECE R155/R156 requirements for cybersecurity type approval
- **Compliance verification** - Map requirements across different frameworks (UNECE regulations, ISO standards)
- **Security analysis** - Search for relevant requirements by topic or keyword
- **Documentation** - Generate compliance evidence and traceability matrices

The server uses a read-only SQLite database with full-text search (FTS5) to provide fast, accurate access to regulatory content.

## Features

### Phase 1 (Current)

- **3 core tools** for requirement access and search
- **UNECE R155/R156** regulation text (sample data)
- **ISO 21434** guidance and work products (full text requires license)
- **Full-text search** with BM25 ranking
- **Cross-framework mappings** (partial - to be expanded)

### Future Phases

- TARA methodology tools and threat scenario library
- Complete regulation/standard content
- Advanced mapping between frameworks
- Type approval checklist generation

## Installation

### Prerequisites

- Node.js 18 or higher
- Claude Desktop or compatible MCP client

### Option 1: Install from npm (when published)

```bash
npm install -g @ansvar/automotive-cybersecurity-mcp
```

### Option 2: Install from source

```bash
# Clone the repository
git clone https://github.com/ansvar-ai/automotive-mcp.git
cd automotive-mcp

# Install dependencies
npm install

# Build the database and TypeScript
npm run build:db
npm run build
```

### Configure Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "automotive-cybersecurity": {
      "command": "node",
      "args": ["/absolute/path/to/automotive-mcp/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/automotive-mcp` with the actual path to your installation.

After updating the configuration, restart Claude Desktop.

## Available Tools

### 1. list_sources

List available automotive cybersecurity regulations and standards.

**Input:**
- `source_type` (optional): Filter by type - "regulation", "standard", or "all" (default: "all")

**Example:**
```json
{
  "source_type": "regulation"
}
```

**Returns:**
```json
{
  "sources": [
    {
      "id": "r155",
      "name": "UN Regulation No. 155",
      "full_name": "Uniform provisions concerning the approval of vehicles with regards to cyber security and cyber security management system",
      "version": "2021",
      "type": "regulation",
      "issuing_body": "UNECE WP.29",
      "item_count": 15,
      "has_full_text": true
    }
  ]
}
```

### 2. get_requirement

Retrieve a specific regulation article or standard clause with optional cross-framework mappings.

**Input:**
- `source` (required): Source ID (e.g., "r155", "r156", "iso_21434")
- `reference` (required): Article/clause reference (e.g., "7.2.2.2", "9.3")
- `include_mappings` (optional): Include related requirements (default: false)

**Example:**
```json
{
  "source": "r155",
  "reference": "7.2.2.2",
  "include_mappings": true
}
```

**Returns:**
```json
{
  "requirement": {
    "source": "r155",
    "reference": "7.2.2.2",
    "title": "Cybersecurity processes",
    "text": "The manufacturer shall demonstrate that the vehicle type...",
    "section": "7.2.2.2"
  },
  "mappings": [
    {
      "target_source": "iso_21434",
      "target_reference": "9.3",
      "relationship": "implements"
    }
  ]
}
```

### 3. search_requirements

Full-text search across all regulations and standards using FTS5 with BM25 ranking.

**Input:**
- `query` (required): Search query text
- `sources` (optional): Filter to specific sources (e.g., ["r155", "iso_21434"])
- `limit` (optional): Maximum results (default: 10)

**Example:**
```json
{
  "query": "vulnerability management",
  "sources": ["r155"],
  "limit": 5
}
```

**Returns:**
```json
{
  "results": [
    {
      "source": "r155",
      "reference": "7.2.2.2",
      "title": "Cybersecurity processes",
      "snippet": "...processes for vulnerability management and...",
      "rank": 1.245
    }
  ],
  "total": 5
}
```

## Use Cases

### 1. Type Approval Preparation

**Scenario:** Automotive OEM preparing for UNECE R155 type approval needs to understand all requirements.

```
User: "What are all the requirements in UNECE R155 for vulnerability management?"

Assistant uses:
1. search_requirements with query "vulnerability management" and sources ["r155"]
2. get_requirement for each result to see full context
3. Provides summary with article references
```

### 2. Compliance Mapping

**Scenario:** Security engineer needs to map ISO 21434 clauses to UNECE R155 requirements.

```
User: "Show me how ISO 21434 clause 9.3 relates to R155 requirements"

Assistant uses:
1. get_requirement with source "iso_21434", reference "9.3", include_mappings true
2. get_requirement for each mapped R155 article
3. Explains relationships between frameworks
```

### 3. Requirement Analysis

**Scenario:** Security architect needs to understand incident response requirements across frameworks.

```
User: "What do R155, R156, and ISO 21434 say about incident response?"

Assistant uses:
1. search_requirements with query "incident response"
2. Filters results by source to group by framework
3. Compares and contrasts requirements
```

### 4. Documentation Generation

**Scenario:** Compliance team needs to generate a traceability matrix.

```
User: "Create a traceability matrix showing how our CSMS addresses R155 Article 7"

Assistant uses:
1. list_sources to confirm R155 is available
2. get_requirement for "7.2.2.2" and related articles
3. For each requirement, includes cross-mappings
4. Formats as markdown table
```

## Integration with Other MCPs

This server works well with other MCP servers:

### With GitHub MCP
```
"Export R155 requirements as GitHub issues for our compliance tracking"
```
- Use `search_requirements` to find relevant requirements
- GitHub MCP creates issues with requirement text and references

### With Filesystem MCP
```
"Save all ISO 21434 work products to a structured directory"
```
- Use `list_sources` and `get_requirement` to retrieve content
- Filesystem MCP writes to organized folder structure

### With Brave Search MCP
```
"Find industry best practices for implementing R155 vulnerability management"
```
- Use `get_requirement` to understand R155 requirements
- Brave Search finds implementation guidance and tools

## Development

### Project Structure

```
automotive-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   └── tools/                # Tool implementations
│       ├── registry.ts       # Shared tool registry
│       ├── list.ts          # list_sources tool
│       ├── get.ts           # get_requirement tool
│       └── search.ts        # search_requirements tool
├── data/
│   ├── seed/                # JSON seed data
│   │   ├── regulations.json
│   │   └── standards.json
│   └── automotive.db        # Generated SQLite database (not in git)
├── scripts/
│   └── build-db.ts          # Database build script
├── tests/                   # Vitest tests
└── dist/                    # Compiled TypeScript (not in git)
```

### Building

```bash
# Compile TypeScript
npm run build

# Build database from seed data
npm run build:db

# Both
npm run build && npm run build:db
```

### Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Development Mode

```bash
# Run with auto-reload on file changes
npm run dev
```

### Testing with MCP Inspector

The MCP Inspector provides a visual interface for testing tools:

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web interface where you can:
- View all available tools
- Test tool calls with different inputs
- Inspect responses

### Database Schema

The database uses SQLite with FTS5 for full-text search:

**Tables:**
- `sources` - Regulation/standard metadata
- `requirements` - Individual articles/clauses
- `requirements_fts` - FTS5 virtual table for search
- `mappings` - Cross-framework relationships (future)

**Key Features:**
- BM25 ranking for search relevance
- Foreign key constraints for data integrity
- Indexes for fast lookups by source and reference

### Adding Content

To add new regulations or standards:

1. Add JSON file to `data/seed/`:
```json
{
  "id": "new_regulation",
  "name": "New Regulation",
  "full_name": "Full title...",
  "version": "2024",
  "type": "regulation",
  "issuing_body": "Authority",
  "items": [
    {
      "reference": "1.1",
      "title": "Scope",
      "text": "Full text...",
      "section": "1"
    }
  ]
}
```

2. Rebuild database:
```bash
npm run build:db
```

3. Run tests to verify:
```bash
npm test
```

## Environment Variables

- `AUTOMOTIVE_CYBERSEC_DB_PATH` - Override database location (default: `data/automotive.db`)

## Data Sources and Licensing

### UNECE Regulations (R155/R156)
- **License:** Public domain (UN documents)
- **Source:** [UNECE WP.29](https://unece.org/transport/vehicle-regulations)
- **Status in MCP:** Sample/subset data (Phase 1)

### ISO 21434
- **License:** Paid standard (copyright ISO)
- **What we include:** Guidance, work products, clause structure (no full text)
- **What we don't include:** Full standard text (requires license)
- **How to get full text:** Purchase from [ISO](https://www.iso.org/standard/70918.html)

## License

This MCP server is licensed under the Apache License 2.0. See [LICENSE](LICENSE) file for details.

**Important:** This license covers the software only. Regulatory content and standards have their own licensing terms as described above.

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure `npm test` passes
5. Submit a pull request

## Support

For issues, questions, or contributions:
- GitHub Issues: [https://github.com/ansvar-ai/automotive-mcp/issues](https://github.com/ansvar-ai/automotive-mcp/issues)
- Email: jeffrey@ansvar.ai

## Roadmap

### Phase 1 (Current) - Core Functionality
- ✅ Basic MCP server with 3 tools
- ✅ SQLite database with FTS5 search
- ✅ Sample R155/R156 data
- ✅ ISO 21434 clause structure

### Phase 2 - Enhanced Tools
- TARA methodology guidance tool
- Advanced cross-framework mapping
- ISO 21434 work products tool
- Type approval checklist generation

### Phase 3 - Complete Content
- Full R155/R156 regulation text
- Comprehensive ISO 21434 guidance
- TARA threat scenario library
- Complete cross-framework mappings

### Phase 4 - Advanced Features
- Requirement change tracking
- Compliance evidence management
- Report generation
- Integration with compliance tools

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- Follows patterns from the EU Compliance MCP reference implementation
- Regulatory content from UNECE and ISO (with appropriate licensing)

## Version History

### 0.1.0 (2026-01-29)
- Initial release
- Phase 1 implementation complete
- 3 core tools: list_sources, get_requirement, search_requirements
- Sample data for R155, R156, ISO 21434

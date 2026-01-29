# Automotive Cybersecurity MCP - Design Document

**Date:** 2026-01-29
**Author:** Jeffrey von Rotz / Ansvar Systems
**Status:** Approved
**Implementation:** TypeScript + SQLite

---

## Executive Summary

An MCP server providing AI agents access to automotive cybersecurity regulations (UNECE R155/R156), standards guidance (ISO/SAE 21434), and TARA methodology. Built following established patterns from security-controls-mcp, EU regulations MCP, and nordic-law-mcp.

**Key Design Decisions:**
- **Language:** TypeScript (matches regulatory MCP pattern)
- **Database:** SQLite with FTS5 full-text search
- **Architecture:** Shared registry pattern (like EU compliance MCP)
- **Integration:** Direct cross-references to security-controls-mcp via SCF mappings

---

## Architecture Overview

### Technology Stack

- **@modelcontextprotocol/sdk** - MCP server implementation
- **better-sqlite3** - SQLite database with read-only access
- **SQLite FTS5** - Full-text search with BM25 ranking
- **TypeScript** - Type-safe implementation
- **vitest** - Testing framework

### Core Patterns

Following established patterns from existing Ansvar MCPs:

| Pattern | Source MCP | Applied To |
|---------|------------|------------|
| Shared tool registry | EU compliance | All tool definitions |
| SQLite + FTS5 | EU compliance | Search functionality |
| Build scripts | EU compliance | Database generation |
| Seed JSON files | EU compliance | Source data management |
| stdio + HTTP servers | EU compliance | Server options |
| Token awareness | EU compliance | Response truncation |
| Data loader class | Security controls | Data access layer |
| Framework mappings | Security controls | Cross-framework links |

---

## Database Schema

### Core Tables

#### regulations
Stores regulation metadata (UNECE, EU implementing rules)

```sql
CREATE TABLE regulations (
  id TEXT PRIMARY KEY,              -- 'r155', 'r156', 'eu_2022_1426'
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT,
  effective_date TEXT,
  source_url TEXT,
  applies_to TEXT,                  -- JSON array: ["M1", "M2", ...]
  regulation_type TEXT              -- 'unece', 'eu_implementing', 'national'
);
```

#### regulation_content
All regulation content (articles, annexes, paragraphs)

```sql
CREATE TABLE regulation_content (
  rowid INTEGER PRIMARY KEY,
  regulation TEXT NOT NULL REFERENCES regulations(id),
  content_type TEXT NOT NULL,       -- 'article', 'annex', 'paragraph'
  reference TEXT NOT NULL,          -- '7.2.2.2', 'Annex 5 Part A'
  title TEXT,
  text TEXT NOT NULL,               -- Full text (regulations are free)
  parent_reference TEXT,
  UNIQUE(regulation, content_type, reference)
);

-- FTS5 for full-text search
CREATE VIRTUAL TABLE regulation_content_fts USING fts5(
  regulation,
  reference,
  title,
  text,
  content='regulation_content',
  content_rowid='rowid'
);
```

### Standards Tables

#### standards
Standards metadata (reference only - no copyrighted text)

```sql
CREATE TABLE standards (
  id TEXT PRIMARY KEY,              -- 'iso_21434', 'iso_24089'
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT,
  note TEXT                         -- Copyright notice
);
```

#### standard_clauses
Clause IDs with expert guidance (no copyrighted text)

```sql
CREATE TABLE standard_clauses (
  id INTEGER PRIMARY KEY,
  standard TEXT NOT NULL REFERENCES standards(id),
  clause_id TEXT NOT NULL,          -- '9.3', '15.8'
  title TEXT NOT NULL,
  guidance TEXT NOT NULL,           -- Jeffrey's expert interpretation
  work_products TEXT,               -- JSON: ["[WP-09-03]"]
  cal_relevant INTEGER DEFAULT 0,
  UNIQUE(standard, clause_id)
);

-- FTS5 for searching guidance
CREATE VIRTUAL TABLE standard_clauses_fts USING fts5(
  standard,
  clause_id,
  title,
  guidance,
  content='standard_clauses',
  content_rowid='id'
);
```

#### work_products
ISO 21434 work product definitions

```sql
CREATE TABLE work_products (
  id TEXT PRIMARY KEY,              -- '[WP-09-01]'
  name TEXT NOT NULL,
  phase TEXT NOT NULL,              -- 'concept', 'development', etc.
  iso_clause TEXT NOT NULL,
  description TEXT NOT NULL,
  contents TEXT NOT NULL,           -- JSON array
  template_available INTEGER DEFAULT 0
);
```

### TARA Methodology Tables

#### threat_scenarios
Threat library (Jeffrey's IP from Volvo assessments)

```sql
CREATE TABLE threat_scenarios (
  id TEXT PRIMARY KEY,              -- 'TS-001'
  category TEXT NOT NULL,           -- 'Spoofing', 'Tampering', etc.
  asset_type TEXT NOT NULL,         -- 'ECU', 'gateway', 'telematics'
  threat TEXT NOT NULL,
  attack_path TEXT,
  stride TEXT,                      -- 'S', 'T', 'R', 'I', 'D', 'E'
  attack_feasibility TEXT NOT NULL, -- JSON: {elapsed_time, expertise, ...}
  risk_rating TEXT NOT NULL,        -- 'Low', 'Medium', 'High', 'Very High'
  treatment TEXT NOT NULL           -- 'Avoid', 'Reduce', 'Share', 'Retain'
);
```

#### damage_scenarios
Impact scenarios with severity ratings

```sql
CREATE TABLE damage_scenarios (
  id TEXT PRIMARY KEY,              -- 'DS-001'
  description TEXT NOT NULL,
  impact_category TEXT NOT NULL,    -- 'Safety', 'Financial', 'Operational', 'Privacy'
  severity TEXT NOT NULL,
  impact_rating TEXT NOT NULL
);
```

#### cybersecurity_goals
Risk treatment goals with CAL ratings

```sql
CREATE TABLE cybersecurity_goals (
  id TEXT PRIMARY KEY,              -- 'CG-001'
  description TEXT NOT NULL,
  property TEXT NOT NULL,           -- 'Confidentiality', 'Integrity', 'Availability', 'Authenticity'
  cal TEXT NOT NULL,                -- 'CAL-1' to 'CAL-4'
  controls TEXT NOT NULL            -- JSON array of example controls
);
```

#### Relationship Tables

```sql
CREATE TABLE threat_damage_links (
  threat_id TEXT REFERENCES threat_scenarios(id),
  damage_id TEXT REFERENCES damage_scenarios(id),
  PRIMARY KEY (threat_id, damage_id)
);

CREATE TABLE threat_goal_links (
  threat_id TEXT REFERENCES threat_scenarios(id),
  goal_id TEXT REFERENCES cybersecurity_goals(id),
  PRIMARY KEY (threat_id, goal_id)
);
```

### Cross-Framework Mappings

#### framework_mappings
Bidirectional mappings between all frameworks

```sql
CREATE TABLE framework_mappings (
  id INTEGER PRIMARY KEY,
  source_type TEXT NOT NULL,        -- 'regulation', 'standard', 'framework'
  source_id TEXT NOT NULL,          -- 'r155', 'iso_21434', 'scf'
  source_ref TEXT NOT NULL,         -- '7.2.2.2', '9.3', 'VPM-01'
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  relationship TEXT NOT NULL,       -- 'satisfies', 'partial', 'related'
  notes TEXT,
  UNIQUE(source_type, source_id, source_ref, target_type, target_id, target_ref)
);

CREATE INDEX idx_mappings_source ON framework_mappings(source_type, source_id, source_ref);
CREATE INDEX idx_mappings_target ON framework_mappings(target_type, target_id, target_ref);
```

---

## MCP Tools (7 Total)

### 1. get_requirement
Get specific requirement with full text, guidance, and mappings

**Input:**
- `source` (required): 'r155', 'r156', 'eu_2022_1426', 'iso_21434', 'iso_24089'
- `reference` (required): '7.2.2.2', '9.3', 'Annex 5 Part A'
- `include_mappings` (optional, default: true): Include cross-framework mappings

**Output:**
```json
{
  "source": "r155",
  "reference": "7.2.2.2",
  "title": "Cyber Security Management System",
  "text": "...",  // Full text for regulations, null for standards
  "guidance": "...",  // Always present
  "maps_to": [
    {
      "target_type": "standard",
      "target_id": "iso_21434",
      "target_ref": "9.3",
      "relationship": "satisfies"
    }
  ],
  "work_products": ["[WP-09-03]"]
}
```

### 2. search_requirements
Full-text search with FTS5 BM25 ranking

**Input:**
- `query` (required): Search string
- `sources` (optional): Filter to specific sources
- `limit` (optional, default: 10, max: 50)

**Output:** Array of matches with snippets

### 3. list_sources
List available regulations and standards

**Input:**
- `source_type` (optional): 'regulation', 'standard', 'all'

**Output:** Source metadata with item counts

### 4. get_tara_guidance
Get TARA methodology guidance

**Input:**
- `asset_type` (optional): 'ECU', 'gateway', 'telematics', 'OBD', 'V2X', 'infotainment'
- `threat_category` (optional): STRIDE categories
- `phase` (optional): 'threat_identification', 'impact_assessment', 'attack_feasibility', 'risk_treatment'

**Output:** Relevant threat scenarios, feasibility methods, risk matrices, example goals

### 5. map_standards
Cross-reference between frameworks

**Input:**
- `source` (required): Source identifier
- `source_reference` (optional): Specific reference
- `target` (required): Target identifier (including 'scf', 'nist_csf_2.0')

**Output:** Mapping relationships

**Example flow:**
```
R155 7.2.2.2(g)
  → ISO 21434 clause 9.3
    → SCF VPM-01, VPM-02, VPM-04
      → (use security-controls-mcp for full control details)
```

### 6. get_work_products
Get ISO 21434 work product requirements

**Input:**
- `phase` (optional): Lifecycle phase
- `iso_clause` (optional): ISO 21434 clause

**Output:** Work product definitions with contents

### 7. get_type_approval_checklist
Get vehicle type approval checklist

**Input:**
- `regulation` (required): 'r155', 'r156'
- `vehicle_category` (optional): 'M1', 'M2', 'M3', 'N1', 'N2', 'N3', 'O3', 'O4'

**Output:** Checklist items with evidence requirements, common gaps, audit expectations

---

## Project Structure

```
automotive-cybersecurity-mcp/
├── src/
│   ├── index.ts                    # Main MCP server (stdio)
│   ├── http-server.ts              # Optional HTTP server
│   ├── tools/
│   │   ├── registry.ts             # Shared tool definitions
│   │   ├── get-requirement.ts
│   │   ├── search.ts
│   │   ├── list.ts
│   │   ├── tara.ts
│   │   ├── map-standards.ts
│   │   ├── work-products.ts
│   │   └── type-approval.ts
│   └── types/
│       └── index.ts
│
├── data/
│   ├── automotive.db               # Generated SQLite database
│   └── seed/                       # Source JSON files
│       ├── r155.json
│       ├── r156.json
│       ├── iso21434-guidance.json
│       ├── tara-library.json
│       ├── work-products.json
│       └── mappings.json
│
├── scripts/
│   ├── build-db.ts                 # Build SQLite from seed
│   ├── ingest-unece.ts             # Parse UNECE regulations
│   └── validate-mappings.ts        # Check mapping integrity
│
├── tests/
│   ├── tools/
│   └── integration/
│
├── docs/
│   ├── README.md
│   ├── TARA-GUIDE.md
│   ├── TYPE-APPROVAL.md
│   └── INTEGRATION.md
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── LICENSE (Apache 2.0)
```

---

## Data Sources & Licensing

### Full Text (Free to Include)

| Source | License | Status |
|--------|---------|--------|
| UNECE R155 | UN Treaty | Public domain |
| UNECE R156 | UN Treaty | Public domain |
| EU 2022/1426 | EUR-Lex | Public domain |

### Reference Only (Paid Standards)

| Source | What to Include |
|--------|-----------------|
| ISO/SAE 21434 | Clause IDs, titles, Jeffrey's guidance |
| ISO 24089 | Clause IDs, titles, Jeffrey's guidance |

### Proprietary Content (Full Inclusion)

| Content | Owner |
|---------|-------|
| TARA methodology | Jeffrey von Rotz / Ansvar Systems |
| Threat scenario library | Jeffrey von Rotz / Ansvar Systems |
| Expert guidance text | Jeffrey von Rotz / Ansvar Systems |
| Framework mappings | Jeffrey von Rotz / Ansvar Systems |

---

## Integration with Existing MCPs

### With security-controls-mcp

```typescript
// User: "What controls satisfy R155 vulnerability management?"

// Step 1: automotive-mcp.get_requirement
{
  source: "r155",
  reference: "7.2.2.2(g)"
}
// Returns: R155 text about vulnerabilities

// Step 2: automotive-mcp.map_standards
{
  source: "r155",
  source_reference: "7.2.2.2(g)",
  target: "iso_21434"
}
// Returns: ISO 21434 clause 9.3

// Step 3: automotive-mcp.map_standards
{
  source: "iso_21434",
  source_reference: "9.3",
  target: "scf"
}
// Returns: SCF VPM-01, VPM-02, VPM-04

// Step 4: security-controls-mcp.get_control
{
  control_id: "VPM-01"
}
// Returns: Full control with NIST/ISO mappings
```

### With eu-regulations-mcp

```typescript
// User: "How does DORA apply to connected vehicle services?"

// Step 1: eu-regulations-mcp.search_regulations
{
  query: "connected vehicle financial third-party ICT"
}
// Returns: DORA scope, third-party requirements

// Step 2: automotive-mcp.get_requirement
{
  source: "r155",
  reference: "7.2.2.2(e)"
}
// Returns: R155 supply chain requirements

// Step 3: Compare/contrast for fleet management fintech
```

---

## Build Process

### Database Generation

```typescript
// scripts/build-db.ts

1. Initialize SQLite database
2. Create schema (tables + FTS5 indexes)
3. Load seed files:
   - regulations.json → regulations table
   - r155.json → regulation_content (parse structure)
   - r156.json → regulation_content
   - iso21434-guidance.json → standards, standard_clauses
   - tara-library.json → threat/damage/goal tables
   - work-products.json → work_products table
   - mappings.json → framework_mappings
4. Build FTS5 triggers
5. Create indexes
6. Validate:
   - All mappings reference valid sources/targets
   - All work_products reference valid clauses
   - All threat-damage-goal links are valid
7. Generate statistics
```

### Seed File Format Examples

**r155.json:**
```json
{
  "id": "r155",
  "full_name": "UN Regulation No. 155",
  "version": "Revision 2",
  "effective_date": "2024-07-07",
  "source_url": "https://unece.org/...",
  "applies_to": ["M1", "M2", "M3", "N1", "N2", "N3", "O3", "O4"],
  "content": [
    {
      "type": "article",
      "reference": "7.2.2.2",
      "title": "CSMS Requirements",
      "text": "...",
      "subsections": [...]
    },
    {
      "type": "annex",
      "reference": "Annex 5 Part A",
      "title": "...",
      "text": "..."
    }
  ]
}
```

**iso21434-guidance.json:**
```json
{
  "id": "iso_21434",
  "full_name": "ISO/SAE 21434:2021",
  "note": "Standard text requires paid license. IDs and guidance provided.",
  "clauses": [
    {
      "clause_id": "9.3",
      "title": "Vulnerability analysis",
      "guidance": "Monitor for vulnerabilities...",
      "work_products": ["[WP-09-03]"],
      "cal_relevant": true
    }
  ]
}
```

---

## Testing Strategy

### Unit Tests
- Each tool handler independently
- Database queries with mock data
- Mapping logic validation

### Integration Tests
- Full tool execution with real database
- Cross-MCP integration scenarios
- Search relevance quality

### Data Validation Tests
- Mapping integrity (all references valid)
- Schema compliance
- FTS5 index quality

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Project setup (TypeScript, dependencies)
- Database schema implementation
- Build script for SQLite generation
- Basic stdio server

### Phase 2: Regulations (Week 1-2)
- Download and parse UNECE R155, R156
- Create seed JSON files
- Implement tools: get_requirement, search_requirements, list_sources
- FTS5 search optimization

### Phase 3: ISO 21434 Guidance (Week 2-3)
- Write guidance for ISO 21434 clauses
- Create work products database
- Implement tools: get_work_products
- R155 → ISO 21434 mappings

### Phase 4: TARA Methodology (Week 3-4)
- Document TARA approach
- Build threat scenario library (10-20 scenarios)
- Create damage scenarios and cybersecurity goals
- Implement tool: get_tara_guidance

### Phase 5: Type Approval (Week 4)
- Build type approval checklists
- Add audit expectations and common gaps
- Implement tool: get_type_approval_checklist
- ISO 21434 → SCF mappings

### Phase 6: Cross-Framework Integration (Week 5)
- Complete all mappings
- Implement tool: map_standards
- Integration tests with security-controls-mcp
- Documentation

### Phase 7: Polish & Launch (Week 5-6)
- README with examples
- HTTP server option
- Publishing to npm
- Submit to awesome-mcp, mcpservers.org

---

## Configuration

### Claude Desktop

```json
{
  "mcpServers": {
    "automotive-cybersecurity": {
      "command": "npx",
      "args": ["-y", "@ansvar/automotive-cybersecurity-mcp"]
    },
    "security-controls": {
      "command": "uvx",
      "args": ["security-controls-mcp"]
    },
    "eu-regulations": {
      "command": "npx",
      "args": ["-y", "@ansvar/eu-regulations-mcp"]
    }
  }
}
```

### Environment Variables

```bash
# Optional: Custom database path
AUTOMOTIVE_CYBERSEC_DB_PATH=/custom/path/automotive.db
```

---

## Success Criteria

1. **Queryable Requirements**
   - All R155/R156 articles accessible
   - Full-text search with relevant results
   - ISO 21434 guidance for all major clauses

2. **TARA Support**
   - 10+ threat scenarios per asset type
   - Complete attack feasibility rating method
   - Example cybersecurity goals with CAL ratings

3. **Cross-Framework Integration**
   - R155 → ISO 21434 → SCF mapping chain works
   - Compatible with security-controls-mcp queries
   - Type approval checklist generated

4. **Performance**
   - Search results in <200ms
   - Database size <10MB
   - Token-efficient responses

5. **Quality**
   - All tests passing
   - No copyrighted text included
   - Clear documentation

---

## Open Questions for Future Phases

1. **GB/T Chinese Standards** - Add in Phase 8?
2. **ISO 26262 Interface** - How deep on safety-security?
3. **AUTOSAR Modules** - Include SecOC, HSM specs?
4. **Templates** - Offer downloadable TARA templates?
5. **Ansvar AI Integration** - Direct handoff to threat modeling service?

---

**END OF DESIGN DOCUMENT**

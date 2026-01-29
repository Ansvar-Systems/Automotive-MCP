# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-29

### Added
- Complete UNECE R155 regulation content (12 articles + 5 annexes)
  - Article 7: Full 22KB CSMS specifications
  - Annex 5: Comprehensive 148KB threat catalog
  - All official annexes (communication forms, approval marks, certificates)
- Complete UNECE R156 regulation content (12 articles + 4 annexes)
  - Article 7: SUMS requirements
  - All official annexes
- SQLite database with FTS5 full-text search (620KB)
- Three MCP tools: `list_sources`, `get_requirement`, `search_requirements`
- Comprehensive test suite (91 tests, 100% pass rate)
- TypeScript with strict type checking
- Complete documentation:
  - README.md with quick start
  - QUICK_START.md for 5-minute setup
  - docs/USAGE_GUIDE.md with role-specific scenarios
  - R155_R156_INTEGRATION_SUMMARY.md with technical details
- CI/CD pipeline with:
  - Multi-platform testing (Ubuntu, macOS, Windows)
  - Multi-version Node.js support (18, 20, 22)
  - Gitleaks secret scanning
  - CodeQL security analysis
  - Automated npm publishing

### Changed
- Database structure: Hierarchical (43 items) → Flat (33 items) with complete text
- Content source: Manual summaries → Official UNECE text via EU Compliance MCP
- Database size: 152KB → 620KB (4x increase)
- Content size: ~50KB → 294KB (6x increase)

### Attribution
- R155/R156 content sourced from [EU Compliance MCP](https://github.com/Ansvar-Systems/EU_compliance_MCP)
- License: Apache 2.0 (compatible)
- Data: Official UNECE regulations from EUR-Lex

### Technical
- Node.js: 18+ required
- Database: SQLite 3 with FTS5
- Query performance: <1ms average
- Package size: ~650KB (includes 620KB database)

## [0.0.1] - 2026-01-28 (Initial Development)

### Added
- Initial MCP server structure
- Sample R155 content (hierarchical structure)
- ISO 21434 Clause 9.3 guidance
- Basic testing framework

[Unreleased]: https://github.com/Ansvar-Systems/Automotive-MCP/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Ansvar-Systems/Automotive-MCP/releases/tag/v0.1.0
[0.0.1]: https://github.com/Ansvar-Systems/Automotive-MCP/releases/tag/v0.0.1

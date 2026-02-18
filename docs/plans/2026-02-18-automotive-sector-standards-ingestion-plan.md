# Automotive Sector Standards Expansion and Ingestion Plan

Date: 2026-02-18
Owner: Automotive-MCP
Status: Implemented (Initial Full Pass)

## Goal
Expand Automotive-MCP from cybersecurity-centered coverage to a whole-sector standards index with phased, queryable ingestion. The immediate target is to ingest source metadata and overview guidance for core diagnostics, software-defined vehicle, safety, EV charging, and automation frameworks.

## Current State
- Full regulation text: UNECE R155, UNECE R156.
- Deep standard guidance: ISO/SAE 21434.
- Limited metadata entries for TISAX, SAE J3061, AUTOSAR, and GB/T set.

## Implementation Snapshot (2026-02-18)
- Phase 1 complete:
  metadata + queryable `Overview` clauses are ingested for all targeted sector standards.
- Phase 2 complete (initial deep pass):
  clause/part-level entries were added for diagnostics, SOVD, update lifecycle, EV charging, safety, AD, networking, and aftermarket groups.
- Phase 3 complete (initial mapping pass):
  cross-framework mappings now include standard-to-regulation and standard-to-standard links in seed data.
- Phase 4 complete (initial operational pass):
  `scripts/check-source-updates.ts` added with report output at `data/source-updates-report.json`.

## Scope to Add
1. Diagnostics and service access:
- ISO 17978 (SOVD)
- ISO 14229 (UDS)
- ISO 15765-2 (DoCAN)
- ISO 13400-2 (DoIP)
- ISO 22901-1 (ODX)
- ISO 13209 (OTX)
- ISO 22900 series (MVCI)
- ISO 15031, ISO 27145, SAE J1979-DA, SAE J2534-1

2. Extended vehicle and data APIs:
- ISO 20077, ISO 20078
- ASAM MCD-2 D
- COVESA VSS

3. Software update and cyber lifecycle:
- ISO 24089
- Existing UNECE R155/R156 and ISO/SAE 21434 remain anchor frameworks

4. Functional safety and AD safety:
- ISO 26262
- ISO 21448
- ISO 34501, ISO 34502, ISO 22737

5. EV charging and interoperability:
- ISO 15118
- IEC 61851-1
- IEC 62196-2
- ISO 17409

6. Network and aftermarket foundations:
- ISO 11898 (CAN)
- ISO 17987 (LIN)
- ISO 18541 (RMI)

## Ingestion Policy
- Public regulations with reusable terms: ingest structured full text where licensing permits.
- Copyrighted standards/specs: ingest only metadata, clause/part identifiers, and expert-authored guidance.
- Maintain source provenance in `sources.yml` and seed JSON notes.

## Phase Plan
### Phase 1: Foundation (This change set)
- Add all target standards as source metadata in `data/seed/standards.json`.
- Add one `Overview` clause per standard so each source is queryable by MCP tools.
- Keep existing R155/R156 and ISO 21434 behavior unchanged.
- Make population tests count-driven by seed files instead of hard-coded totals.

Exit criteria:
- `list_sources` includes the new standards.
- `get_requirement` works for `reference=Overview` on each new standard.
- `search_requirements` returns matches from overview guidance.

### Phase 2: Clause/Part Expansion by Domain
- Diagnostics deep ingestion: UDS/DoIP/DoCAN/SOVD/ODX/OTX/MVCI with part-level nodes.
- EV and charging deep ingestion: ISO 15118, IEC 61851, IEC 62196, ISO 17409.
- Safety deep ingestion: ISO 26262 and ISO 21448 artifact-level guidance.

Exit criteria:
- 8 to 15 clause/part nodes per priority standard family.
- Cross-framework mappings into R155/R156/21434 where relevant.

### Phase 3: Cross-Framework Mapping Layer
- Add mappings from diagnostics and update standards into R156 and ISO 24089.
- Add mappings from safety/automation standards into 26262/21448 anchors.
- Add mappings for EV charging controls into update/cybersecurity controls where applicable.

Exit criteria:
- Bidirectional mappings available for top 5 workflows:
  diagnostics, OTA/update, vulnerability management, EV charging, AD validation.

### Phase 4: Operationalize Updates
- Add scripted ingestion checks for source drift and version changes.
- Add lightweight periodic review workflow for standard version metadata.
- Add changelog entries per source family update.

Exit criteria:
- Repeatable update process with documented quality gates.

## Data Model and Tooling Notes
- No schema change required for Phase 1.
- Existing `standards` and `standard_clauses` tables are sufficient for metadata plus guidance ingestion.
- `framework_mappings` remains the mechanism for future cross-domain links.

## Risks and Controls
- Risk: Scope explosion across too many standards at once.
- Control: Keep Phase 1 to overview-level entries and execute deep ingestion in domain batches.

- Risk: Licensing mistakes.
- Control: Preserve "no full text" rule for copyrighted standards and keep guidance expert-authored.

- Risk: Regression from seed growth.
- Control: Replace static test counts with seed-derived expected values.

## Immediate Next Execution Batch
1. Diagnostics deep ingestion pack:
- ISO 17978, ISO 14229, ISO 15765-2, ISO 13400-2, ISO 22901-1, ISO 13209, ISO 22900.

2. Update lifecycle pack:
- ISO 24089 + mapping glue to R156 and ISO/SAE 21434.

3. EV interop pack:
- ISO 15118, IEC 61851-1, IEC 62196-2, ISO 17409.

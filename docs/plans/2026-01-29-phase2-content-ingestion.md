# Phase 2: Complete Content Ingestion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ingest complete UNECE R155, R156, and ISO 21434 content to transform the MCP from a sample demonstration to a production-ready compliance tool with 80+ requirements accessible via AI.

**Architecture:** Download official UNECE regulation PDFs, extract/structure content into JSON seed files, write expert ISO 21434 guidance for key clauses, rebuild database, verify with comprehensive tests. Each regulation/standard is an independent task executed by separate subagents in parallel.

**Tech Stack:** TypeScript, better-sqlite3, WebFetch for PDF download, manual expert content authoring for ISO 21434

**Content Targets:**
- UNECE R155: 30+ articles/annexes (public domain, full text)
- UNECE R156: 20+ articles/annexes (public domain, full text)
- ISO 21434: 30+ clauses with expert guidance (copyrighted, guidance only)

**Total Estimated Time:** 40-60 hours (parallelizable across 3 subagents)

---

## Task 1: Download and Structure UNECE R155 Complete Content

**Goal:** Download official UNECE R155 PDF, extract all articles and annexes, structure into comprehensive JSON seed data.

**Files:**
- Modify: `data/seed/regulations.json` (expand R155 content array)
- Reference: https://unece.org/transport/documents/2021/03/standards/un-regulation-no-155

**Estimated Time:** 12-16 hours (PDF download, content extraction, structuring, verification)

**Step 1: Download UNECE R155 Official PDF**

Use WebFetch or manual download to get the complete R155 regulation text:

```bash
# Official source (check current URL)
curl -o /tmp/r155.pdf "https://unece.org/sites/default/files/2021-03/R155e.pdf"
```

**Step 2: Extract Key Articles**

Extract the following critical R155 sections (article numbers may vary by revision):

**Required Articles:**
- Article 1: Scope
- Article 2: Definitions
- Article 5: Application for approval
- Article 6: Approval
- Article 7: CSMS requirements (MOST IMPORTANT)
  - 7.1: General requirements
  - 7.2: Organizational processes
    - 7.2.1: Risk management
    - 7.2.2: CSMS requirements (subdivide into a-j)
    - 7.2.3: Testing
  - 7.3: Monitoring and detection
  - 7.4: Response and recovery
- Article 8: Vehicle type approval requirements
- Article 9: Modifications and extensions
- Article 10: Conformity of production
- Article 11: Penalties for non-conformity
- Article 12: Production definitely discontinued
- Annex 5: Type Approval Documentation

**Step 3: Structure Content in regulations.json**

For each article, create a JSON object in the "content" array:

```json
{
  "regulation": "r155",
  "content_type": "article",
  "reference": "7.2.2.2",
  "title": "Cyber Security Management System Requirements",
  "text": "[FULL TEXT FROM PDF - all subsections (a) through (j)]",
  "parent_reference": "7.2.2"
}
```

**Key structuring rules:**
- Top-level articles: `reference` = "7", `parent_reference` = null
- Sub-articles: `reference` = "7.2.2.2", `parent_reference` = "7.2.2"
- Annexes: `content_type` = "annex", `reference` = "Annex 5"
- Preserve all text verbatim (public domain)
- Include subsections (a), (b), (c) etc. in the text

**Step 4: Expand regulations.json with Complete R155**

Read current file:
```bash
cat data/seed/regulations.json
```

Add 30+ content entries for all R155 articles. Example structure:

```json
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
    ...
  ],
  "content": [
    {
      "regulation": "r155",
      "content_type": "article",
      "reference": "1",
      "title": "Scope",
      "text": "[Full Article 1 text from PDF]",
      "parent_reference": null
    },
    {
      "regulation": "r155",
      "content_type": "article",
      "reference": "2",
      "title": "Definitions",
      "text": "[Full Article 2 text with all definitions]",
      "parent_reference": null
    },
    {
      "regulation": "r155",
      "content_type": "article",
      "reference": "7.2.2.2",
      "title": "CSMS Processes - Risk Assessment",
      "text": "The CSMS shall include processes for: (a) vehicle type related risk assessment in relation to cyber-attacks... [complete text for all subsections a-j]",
      "parent_reference": "7.2.2"
    },
    ... (30+ total entries)
  ]
}
```

**Step 5: Write Test for R155 Content Completeness**

Create test file `tests/content-completeness.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '..', 'data', 'automotive.db');

describe('R155 Content Completeness', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  it('should have at least 30 R155 articles/annexes', () => {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM regulation_content WHERE regulation = ?'
    ).get('r155') as { count: number };

    expect(result.count).toBeGreaterThanOrEqual(30);
  });

  it('should include critical Article 7.2.2.2', () => {
    const result = db.prepare(
      'SELECT * FROM regulation_content WHERE regulation = ? AND reference = ?'
    ).get('r155', '7.2.2.2');

    expect(result).toBeDefined();
    expect(result.text).toContain('vehicle type related risk assessment');
  });

  it('should include Annex 5', () => {
    const result = db.prepare(
      'SELECT * FROM regulation_content WHERE regulation = ? AND content_type = ? AND reference LIKE ?'
    ).get('r155', 'annex', 'Annex 5%');

    expect(result).toBeDefined();
  });
});
```

**Step 6: Rebuild Database and Verify**

```bash
# Rebuild database with new content
npm run build:db

# Run completeness tests
npm test tests/content-completeness.test.ts

# Expected output: All tests pass, database size increases to ~400-600KB
```

**Step 7: Manual Verification - Spot Check**

```bash
# Check total R155 items
sqlite3 data/automotive.db "SELECT COUNT(*) FROM regulation_content WHERE regulation='r155';"
# Expected: 30-50

# Sample a specific article
sqlite3 data/automotive.db "SELECT reference, title, substr(text, 1, 100) FROM regulation_content WHERE regulation='r155' AND reference='7.2.2.2';"
# Expected: Full row with truncated text preview
```

**Step 8: Commit R155 Content**

```bash
git add data/seed/regulations.json tests/content-completeness.test.ts
git commit -m "feat: add complete UNECE R155 regulation content (30+ articles)

- Downloaded official R155 Revision 2 PDF from UNECE
- Extracted all articles 1-12 and Annex 5
- Structured into JSON seed format
- Added completeness tests
- Database expands from 152KB to ~400KB
- Content is public domain (UN treaty text)"
```

**Acceptance Criteria:**
- ✅ regulations.json contains 30+ R155 content entries
- ✅ All critical articles present (1, 2, 5, 6, 7.x, 8-12, Annex 5)
- ✅ Article 7.2.2.2 includes all subsections (a) through (j)
- ✅ Tests pass confirming ≥30 items
- ✅ Database rebuilds without errors
- ✅ Search works for R155 content

---

## Task 2: Download and Structure UNECE R156 Complete Content

**Goal:** Download official UNECE R156 PDF, extract all articles and annexes, structure into comprehensive JSON seed data.

**Files:**
- Modify: `data/seed/regulations.json` (expand R156 content array)
- Reference: https://unece.org/transport/documents/2021/03/standards/un-regulation-no-156

**Estimated Time:** 10-12 hours (similar to R155 but slightly shorter regulation)

**Step 1: Download UNECE R156 Official PDF**

```bash
curl -o /tmp/r156.pdf "https://unece.org/sites/default/files/2021-03/R156e.pdf"
```

**Step 2: Extract Key Articles**

**Required R156 Articles:**
- Article 1: Scope
- Article 2: Definitions
- Article 5: Application for approval
- Article 6: Approval
- Article 7: SUMS requirements (Software Update Management System)
  - 7.1: General requirements
  - 7.2: Software update identification
  - 7.3: Software update assessment
  - 7.4: Software update execution
  - 7.5: Post-update verification
- Article 8: Vehicle type approval requirements
- Article 9: Modifications and extensions
- Article 10: Conformity of production
- Annex 4: SUMS Documentation Requirements

**Step 3: Structure Content in regulations.json**

Add R156 content entries to the same regulations.json file:

```json
{
  "regulations": [...],
  "content": [
    ... (existing R155 entries),
    {
      "regulation": "r156",
      "content_type": "article",
      "reference": "1",
      "title": "Scope",
      "text": "[Full R156 Article 1 text]",
      "parent_reference": null
    },
    {
      "regulation": "r156",
      "content_type": "article",
      "reference": "7.3",
      "title": "Software Update Assessment",
      "text": "[Full text about update risk assessment, security validation]",
      "parent_reference": "7"
    },
    ... (20+ R156 entries)
  ]
}
```

**Step 4: Update Completeness Tests**

Add to `tests/content-completeness.test.ts`:

```typescript
describe('R156 Content Completeness', () => {
  it('should have at least 20 R156 articles/annexes', () => {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM regulation_content WHERE regulation = ?'
    ).get('r156') as { count: number };

    expect(result.count).toBeGreaterThanOrEqual(20);
  });

  it('should include critical Article 7.3 (SUMS assessment)', () => {
    const result = db.prepare(
      'SELECT * FROM regulation_content WHERE regulation = ? AND reference = ?'
    ).get('r156', '7.3');

    expect(result).toBeDefined();
    expect(result.text).toContain('software update');
  });

  it('should include Annex 4', () => {
    const result = db.prepare(
      'SELECT * FROM regulation_content WHERE regulation = ? AND content_type = ? AND reference LIKE ?'
    ).get('r156', 'annex', 'Annex 4%');

    expect(result).toBeDefined();
  });
});
```

**Step 5: Rebuild Database and Verify**

```bash
npm run build:db
npm test tests/content-completeness.test.ts
```

Expected: All R155 + R156 tests pass, database ~600-800KB

**Step 6: Commit R156 Content**

```bash
git add data/seed/regulations.json tests/content-completeness.test.ts
git commit -m "feat: add complete UNECE R156 regulation content (20+ articles)

- Downloaded official R156 Revision 2 PDF from UNECE
- Extracted all articles and Annex 4
- Focus on Software Update Management System (SUMS)
- Database expands to ~600-800KB
- Content is public domain (UN treaty text)"
```

**Acceptance Criteria:**
- ✅ regulations.json contains 20+ R156 content entries
- ✅ All critical articles present (1, 2, 5, 6, 7.x, 8-10, Annex 4)
- ✅ Article 7.3 includes software update assessment details
- ✅ Tests pass confirming ≥20 R156 items
- ✅ Database rebuilds without errors
- ✅ R155 + R156 content both searchable

---

## Task 3: Write Comprehensive ISO 21434 Expert Guidance

**Goal:** Author expert guidance for 30+ critical ISO 21434 clauses based on Jeffrey's automotive cybersecurity expertise (Volvo, ISO 21434 implementation experience).

**Files:**
- Modify: `data/seed/standards.json` (expand clauses array)
- Reference: ISO/SAE 21434:2021 standard (clause structure, no full text due to copyright)

**Estimated Time:** 20-30 hours (manual expert authoring - cannot be automated)

**Step 1: Identify Priority ISO 21434 Clauses**

**Must-have clauses (30+):**

**Concept Phase (Clause 5-8):**
- 5.4.2: Item definition
- 6.4.2: Cybersecurity goals
- 7.4.2: Cybersecurity concept
- 8.5: Risk assessment (TARA)

**Product Development (Clause 9-11):**
- 9.3: Vulnerability analysis ✅ (already done)
- 9.4: Cybersecurity requirements
- 9.5: Cybersecurity architecture
- 10.4.2: Integration verification
- 11.4.2: Cybersecurity validation

**Production, Operation, Maintenance (Clause 12-14):**
- 12.4.2: Production control
- 13.3: Cybersecurity monitoring
- 13.4: Cybersecurity event assessment
- 14.4.2: Decommissioning

**Support Processes (Clause 15):**
- 15.7: Configuration management
- 15.8: Cybersecurity assurance
- 15.9: Cybersecurity assessment
- 15.11: Tool qualification

**Step 2: Create Guidance Template**

For each clause, provide:
1. **What:** Plain English summary of the clause requirement
2. **Why:** Purpose and benefit
3. **How:** Practical implementation guidance based on real automotive projects
4. **Work Products:** Expected outputs (use ISO 21434 WP codes)
5. **Common Pitfalls:** Mistakes to avoid
6. **CAL Relevance:** Whether this affects Cybersecurity Assurance Level determination

**Example structure for Clause 9.4 (Cybersecurity Requirements):**

```json
{
  "standard": "iso_21434",
  "clause_id": "9.4",
  "title": "Cybersecurity requirements specification",
  "guidance": "Derive detailed technical security requirements from cybersecurity goals. Each requirement must be testable, traceable to a goal/threat, and assigned a CAL. Common categories: authentication (CAN message authentication), authorization (diagnostic access control), cryptography (secure boot), monitoring (intrusion detection), secure communication (TLS for V2X). Link each requirement to specific threats it mitigates. Priority: Start with CAL-3/4 requirements (safety-critical), then CAL-1/2. Tool: Polarion, Jama, or Excel with columns: Req-ID, Description, CAL, Threat-ID, Goal-ID, Verification-Method.",
  "work_products": ["[WP-09-04] Cybersecurity requirements specification"],
  "cal_relevant": 1
}
```

**Step 3: Write Guidance for Concept Phase Clauses**

Add to `data/seed/standards.json`:

```json
{
  "standards": [...],
  "clauses": [
    ... (existing 9.3 entry),
    {
      "standard": "iso_21434",
      "clause_id": "5.4.2",
      "title": "Item definition",
      "guidance": "Define the system boundary for cybersecurity analysis. Specify: ECUs in scope, vehicle functions, communication interfaces (CAN, Ethernet, cellular, V2X), external connections (OBD, USB, wireless), assets (keys, data, algorithms), assumptions about environment. Example: 'The item is the infotainment system consisting of head unit ECU, display, cellular modem, and WiFi module. Interfaces: CAN gateway to vehicle network, USB ports (2), Bluetooth, 4G LTE. Assets: user PII, payment credentials, vehicle location data.' Exclude out-of-scope: engine ECU, brake ECU (different item).",
      "work_products": ["[WP-05-01] Item definition"],
      "cal_relevant": 0
    },
    {
      "standard": "iso_21434",
      "clause_id": "6.4.2",
      "title": "Cybersecurity goals",
      "guidance": "For each damage scenario with Medium+ severity, define a cybersecurity goal to prevent or mitigate the damage. Format: 'Prevent unauthorized [action] that could lead to [damage scenario].' Assign CAL based on attack feasibility + impact. Example: Damage = 'Loss of vehicle control', Goal = 'Prevent unauthorized modification of steering ECU software', CAL = CAL-4 (safety-critical). Goals must be verifiable (how will you test it?), traceable to damage scenarios, and assigned to system components.",
      "work_products": ["[WP-06-02] Cybersecurity goals"],
      "cal_relevant": 1
    },
    {
      "standard": "iso_21434",
      "clause_id": "7.4.2",
      "title": "Cybersecurity concept",
      "guidance": "Define high-level security architecture and controls to satisfy cybersecurity goals. Specify: network segmentation (safety CAN vs infotainment CAN), gateways/firewalls, authentication mechanisms (secure boot, message authentication), cryptography (key storage, algorithms), security monitoring (IDS placement), update mechanisms. Example: 'Goal CG-001 (CAL-4) satisfied by: (1) CAN gateway with whitelist filtering, (2) MAC authentication for safety-critical messages, (3) HSM for key storage, (4) Secure boot chain from bootloader to application.' Document why this concept is sufficient for each CAL level.",
      "work_products": ["[WP-07-01] Cybersecurity concept"],
      "cal_relevant": 1
    },
    {
      "standard": "iso_21434",
      "clause_id": "8.5",
      "title": "Threat analysis and risk assessment",
      "guidance": "Identify threats to item/components, analyze attack paths, rate attack feasibility per ISO 21434 Annex G (elapsed time, specialist expertise, knowledge of item, window of opportunity, equipment). Calculate risk = impact × feasibility. Example threat: 'T-042: Attacker reverse-engineers CAN messages via OBD port to inject spoofed steering commands.' Feasibility: Moderate (6 months, expert, public docs, unlimited time, <$10k equipment) = High feasibility. Impact: Severe (steering loss). Risk: TREAT. Document: threat scenario, attack path diagram, feasibility rating breakdown, risk decision (avoid/reduce/share/retain).",
      "work_products": ["[WP-08-05] Threat analysis and risk assessment"],
      "cal_relevant": 1
    }
  ]
}
```

**Step 4: Write Guidance for Product Development Clauses**

Continue adding clauses 9-11:

```json
{
  "standard": "iso_21434",
  "clause_id": "9.4",
  "title": "Cybersecurity requirements specification",
  "guidance": "Derive detailed technical security requirements from cybersecurity goals. Each requirement must be testable, traceable to a goal/threat, and assigned a CAL. Common categories: authentication (CAN message authentication), authorization (diagnostic access control), cryptography (secure boot), monitoring (intrusion detection), secure communication (TLS for V2X). Link each requirement to specific threats it mitigates. Priority: Start with CAL-3/4 requirements (safety-critical), then CAL-1/2. Tool: Polarion, Jama, or Excel with columns: Req-ID, Description, CAL, Threat-ID, Goal-ID, Verification-Method.",
  "work_products": ["[WP-09-04] Cybersecurity requirements specification"],
  "cal_relevant": 1
},
{
  "standard": "iso_21434",
  "clause_id": "9.5",
  "title": "Cybersecurity architecture",
  "guidance": "Design detailed security architecture showing: hardware components (HSM, secure element, TPM), software components (crypto library, bootloader, update agent, IDS), interfaces (authenticated APIs, encrypted channels), data flows (key provisioning, log forwarding), trust boundaries. Document security properties of each component. Example: 'Secure Boot Chain: (1) ROM bootloader (immutable, public key hardcoded) validates Stage 2 signature → (2) Stage 2 bootloader validates OS kernel signature → (3) OS validates application signatures. Keys stored in HSM, SHA-256 + RSA-2048.' Include architecture diagrams (block diagram, sequence diagrams for critical flows).",
  "work_products": ["[WP-09-05] Cybersecurity architecture"],
  "cal_relevant": 1
},
{
  "standard": "iso_21434",
  "clause_id": "10.4.2",
  "title": "Integration and verification",
  "guidance": "Test that integrated system satisfies cybersecurity requirements. Methods: (1) Functional testing (does secure boot reject unsigned images?), (2) Penetration testing (can attacker bypass authentication?), (3) Fuzz testing (does parser crash on malformed input?), (4) Code review for security bugs. Document: test cases per requirement (Req-ID → Test-ID), test results (pass/fail/NA), penetration test report with findings severity (Critical/High/Medium/Low), remediation plan. CAL-4 requirements need most rigorous testing (independent pentest team).",
  "work_products": ["[WP-10-04] Integration and verification report"],
  "cal_relevant": 1
}
```

**Step 5: Write Guidance for Operational Clauses**

Add clauses 12-14:

```json
{
  "standard": "iso_21434",
  "clause_id": "13.3",
  "title": "Cybersecurity monitoring",
  "guidance": "Monitor vehicles in field for security events. Implement: (1) Vehicle-side: IDS logs (intrusion attempts, failed auth, anomalies), security event logging (update installations, config changes, diagnostic access), (2) Backend: SIEM aggregation, correlation, alerting. Example events to monitor: >10 failed OBD authentication attempts in 1 hour, unexpected CAN messages, firmware downgrade attempts, geofence violations. Define: event severity levels, escalation thresholds, response SLAs. Integrate with PSIRT for vulnerability coordination. Tools: Splunk, ELK stack, custom vehicle telemetry.",
  "work_products": ["[WP-13-03] Cybersecurity monitoring concept"],
  "cal_relevant": 0
},
{
  "standard": "iso_21434",
  "clause_id": "13.4",
  "title": "Cybersecurity event assessment and response",
  "guidance": "When security events detected: (1) Triage (severity, affected vehicles, exploit available?), (2) Investigate (logs, forensics, reproduce), (3) Respond (patch development, OTA update, customer notification, regulatory reporting per UNECE R155). Example workflow: Event 'Suspicious CAN traffic detected on 50 Model X vehicles' → Severity: High → Investigation: Aftermarket device sending malformed messages → Response: Customer advisory to remove device + CAN filter update via OTA. Document: incident timeline, root cause, affected VINs, remediation actions, lessons learned.",
  "work_products": ["[WP-13-04] Cybersecurity incident response"],
  "cal_relevant": 0
}
```

**Step 6: Write Guidance for Support Processes**

Add clause 15 sub-sections:

```json
{
  "standard": "iso_21434",
  "clause_id": "15.7",
  "title": "Configuration management",
  "guidance": "Track all security-relevant items throughout lifecycle: software versions, crypto keys, certificates, security configurations, approved components. Enable: (1) Traceability (which vehicle VINs have firmware v2.3.1?), (2) Rollback (revert to known-good configuration), (3) Audit (prove compliance to auditor). Tools: Git for code, Vault for secrets, asset inventory DB for deployed versions. Example: 'Vehicle VIN W1234 has Gateway ECU firmware v3.1.0 (released 2024-01-15, SHA256: abc123...), root cert expires 2026-12-31, secure boot enabled.' Critical for incident response and type approval.",
  "work_products": ["[WP-15-07] Configuration management"],
  "cal_relevant": 0
},
{
  "standard": "iso_21434",
  "clause_id": "15.11",
  "title": "Tool qualification",
  "guidance": "If using automated tools for security-critical tasks (static analysis, crypto libraries, code generators), qualify them: (1) Identify tool impact on safety/security, (2) Define required confidence level, (3) Validate tool accuracy (false positives/negatives for SAST, crypto validation for libraries). Example: Using Coverity for CAL-4 code analysis → Validate on benchmark with known vulnerabilities → Document tool version, configuration, validation results. Lower-risk: manual review supplements tool findings. Document qualified tools, versions, validation evidence.",
  "work_products": ["[WP-15-11] Tool qualification report"],
  "cal_relevant": 0
}
```

**Step 7: Add Comprehensive Tests for ISO 21434 Content**

Update `tests/content-completeness.test.ts`:

```typescript
describe('ISO 21434 Content Completeness', () => {
  it('should have at least 30 ISO 21434 clauses', () => {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM standard_clauses WHERE standard = ?'
    ).get('iso_21434') as { count: number };

    expect(result.count).toBeGreaterThanOrEqual(30);
  });

  it('should cover concept phase (clauses 5-8)', () => {
    const conceptClauses = ['5.4.2', '6.4.2', '7.4.2', '8.5'];

    for (const clauseId of conceptClauses) {
      const result = db.prepare(
        'SELECT * FROM standard_clauses WHERE standard = ? AND clause_id = ?'
      ).get('iso_21434', clauseId);

      expect(result).toBeDefined();
      expect(result.guidance).toBeTruthy();
      expect(result.guidance.length).toBeGreaterThan(100); // Substantive guidance
    }
  });

  it('should cover product development (clauses 9-11)', () => {
    const devClauses = ['9.3', '9.4', '9.5', '10.4.2', '11.4.2'];

    for (const clauseId of devClauses) {
      const result = db.prepare(
        'SELECT * FROM standard_clauses WHERE standard = ? AND clause_id = ?'
      ).get('iso_21434', clauseId);

      expect(result).toBeDefined();
    }
  });

  it('should cover operational phase (clauses 12-14)', () => {
    const opsClauses = ['13.3', '13.4'];

    for (const clauseId of opsClauses) {
      const result = db.prepare(
        'SELECT * FROM standard_clauses WHERE standard = ? AND clause_id = ?'
      ).get('iso_21434', clauseId);

      expect(result).toBeDefined();
    }
  });

  it('should mark CAL-relevant clauses correctly', () => {
    // Clauses that affect CAL determination should have cal_relevant = 1
    const calRelevantClauses = ['6.4.2', '8.5', '9.4', '9.5'];

    for (const clauseId of calRelevantClauses) {
      const result = db.prepare(
        'SELECT * FROM standard_clauses WHERE standard = ? AND clause_id = ?'
      ).get('iso_21434', clauseId);

      expect(result.cal_relevant).toBe(1);
    }
  });

  it('should include work product references', () => {
    const result = db.prepare(
      'SELECT * FROM standard_clauses WHERE standard = ? AND clause_id = ?'
    ).get('iso_21434', '9.4');

    expect(result.work_products).toBeTruthy();
    expect(result.work_products).toContain('[WP-09-04]');
  });
});
```

**Step 8: Rebuild Database and Verify**

```bash
npm run build:db
npm test tests/content-completeness.test.ts

# Check ISO 21434 clause count
sqlite3 data/automotive.db "SELECT COUNT(*) FROM standard_clauses WHERE standard='iso_21434';"
# Expected: 30+

# Sample a clause
sqlite3 data/automotive.db "SELECT clause_id, title, substr(guidance, 1, 150) FROM standard_clauses WHERE clause_id='9.4';"
# Expected: Full guidance preview
```

**Step 9: Commit ISO 21434 Guidance**

```bash
git add data/seed/standards.json tests/content-completeness.test.ts
git commit -m "feat: add comprehensive ISO 21434 expert guidance (30+ clauses)

- Authored guidance for concept, development, operational, support phases
- Covers clauses 5-15 with practical implementation advice
- Based on real automotive cybersecurity project experience
- Includes work product references and CAL relevance flags
- No copyrighted ISO text included (guidance only)
- Database expands to ~800KB-1MB with all content"
```

**Acceptance Criteria:**
- ✅ standards.json contains 30+ ISO 21434 clause entries
- ✅ Coverage across concept (5-8), development (9-11), operations (12-14), support (15)
- ✅ Each clause has substantive guidance (>100 characters, actionable advice)
- ✅ Work products referenced using ISO 21434 WP codes
- ✅ CAL-relevant clauses marked with cal_relevant=1
- ✅ Tests pass confirming ≥30 clauses
- ✅ Database rebuilds without errors
- ✅ All 3 sources (R155, R156, ISO 21434) fully searchable

---

## Task 4: Add Cross-Framework Mappings (Optional Enhancement)

**Goal:** Create bidirectional mappings between R155 ↔ ISO 21434 to enable compliance queries like "which ISO clauses satisfy R155 7.2.2.2?"

**Files:**
- Create: `data/seed/mappings.json`
- Modify: `scripts/build-db.ts` (add mapping ingestion logic)

**Estimated Time:** 4-6 hours

**Note:** This is optional for Phase 2 initial release but adds significant value.

**Step 1: Create mappings.json Structure**

```json
{
  "mappings": [
    {
      "source_type": "regulation",
      "source_id": "r155",
      "source_ref": "7.2.2.2",
      "target_type": "standard",
      "target_id": "iso_21434",
      "target_ref": "8.5",
      "relationship": "implements",
      "notes": "TARA (ISO 21434 8.5) implements R155 requirement for risk assessment"
    },
    {
      "source_type": "regulation",
      "source_id": "r155",
      "source_ref": "7.2.2.2",
      "target_type": "standard",
      "target_id": "iso_21434",
      "target_ref": "9.3",
      "relationship": "implements",
      "notes": "Vulnerability analysis (ISO 9.3) implements R155 vulnerability management requirement"
    },
    {
      "source_type": "regulation",
      "source_id": "r155",
      "source_ref": "7.2.2.2",
      "target_type": "standard",
      "target_id": "iso_21434",
      "target_ref": "13.4",
      "relationship": "implements",
      "notes": "Incident response (ISO 13.4) implements R155 security event management"
    }
  ]
}
```

**Key mappings to create (10-15 most important):**
- R155 7.2.2.2(a) risk assessment → ISO 21434 8.5 TARA
- R155 7.2.2.2(b) risk treatment → ISO 21434 6.4.2 goals, 7.4.2 concept
- R155 7.2.2.2(g) vulnerability mgmt → ISO 21434 9.3
- R155 7.2.2.2(h) security updates → ISO 21434 13.3, R156 7.4
- R155 7.2.3 testing → ISO 21434 10.4.2, 11.4.2
- R156 7.3 update assessment → ISO 21434 9.4 requirements, 8.5 TARA
- R156 7.5 post-update verification → ISO 21434 11.4.2 validation

**Step 2: Update build-db.ts to Ingest Mappings**

Add to `scripts/build-db.ts`:

```typescript
// After loading standards
if (existsSync(join(SEED_DIR, 'mappings.json'))) {
  const mappingsData = JSON.parse(readFileSync(join(SEED_DIR, 'mappings.json'), 'utf-8'));
  const insertMapping = db.prepare(`
    INSERT INTO framework_mappings (source_type, source_id, source_ref, target_type, target_id, target_ref, relationship, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const mapping of mappingsData.mappings) {
    insertMapping.run(
      mapping.source_type,
      mapping.source_id,
      mapping.source_ref,
      mapping.target_type,
      mapping.target_id,
      mapping.target_ref,
      mapping.relationship,
      mapping.notes || null
    );
  }

  console.log(`✓ Loaded ${mappingsData.mappings.length} framework mappings`);
}
```

**Step 3: Update get_requirement Tool to Include Mappings**

Modify `src/tools/get.ts` to optionally return mappings (this is already in the design, just verify):

```typescript
// Fetch mappings if requested
if (include_mappings) {
  const mappings = db.prepare(`
    SELECT target_type, target_id, target_ref, relationship, notes
    FROM framework_mappings
    WHERE source_type = ? AND source_id = ? AND source_ref = ?
  `).all(sourceType, source, reference);

  result.mappings = mappings;
}
```

**Step 4: Test Mapping Functionality**

Add test to `tests/tools/get.test.ts`:

```typescript
it('should include framework mappings when requested', () => {
  const args = {
    source: 'r155',
    reference: '7.2.2.2',
    include_mappings: true
  };

  const result = getTool.handler(args);

  expect(result.mappings).toBeDefined();
  expect(result.mappings.length).toBeGreaterThan(0);
  expect(result.mappings[0]).toHaveProperty('target_id');
  expect(result.mappings[0]).toHaveProperty('target_ref');
  expect(result.mappings[0]).toHaveProperty('relationship');
});
```

**Step 5: Commit Mappings**

```bash
git add data/seed/mappings.json scripts/build-db.ts src/tools/get.ts tests/tools/get.test.ts
git commit -m "feat: add cross-framework mappings (R155 ↔ ISO 21434)

- Created 10-15 key mappings between regulations and standards
- Updated database build script to ingest mappings
- get_requirement tool returns mappings when include_mappings=true
- Enables compliance queries across frameworks
- Tests verify mapping functionality"
```

**Acceptance Criteria:**
- ✅ mappings.json contains 10-15 key framework mappings
- ✅ Database successfully ingests mappings
- ✅ get_requirement returns mappings when requested
- ✅ Tests pass for mapping functionality

---

## Task 5: Final Verification and Documentation

**Goal:** Comprehensive end-to-end testing, performance verification, update README with Phase 2 completion, prepare for v0.2.0 release.

**Files:**
- Update: `README.md` (change Phase 1 → Phase 2 status)
- Update: `package.json` (version 0.1.0 → 0.2.0)
- Create: `CHANGELOG.md`

**Estimated Time:** 2-3 hours

**Step 1: Run Complete Test Suite**

```bash
# Run all tests
npm test

# Expected results:
# - 75+ tests pass (original 75 + new completeness tests)
# - 100% pass rate
# - Database queries working for all sources
```

**Step 2: Performance Verification**

```bash
# Check database size
ls -lh data/automotive.db
# Expected: 800KB - 1.2MB (was 152KB in Phase 1)

# Count total content
sqlite3 data/automotive.db "
  SELECT
    'R155' as source, COUNT(*) as items FROM regulation_content WHERE regulation='r155'
  UNION ALL
  SELECT 'R156', COUNT(*) FROM regulation_content WHERE regulation='r156'
  UNION ALL
  SELECT 'ISO 21434', COUNT(*) FROM standard_clauses WHERE standard='iso_21434';
"
# Expected:
# R155: 30+
# R156: 20+
# ISO 21434: 30+
# Total: 80+ requirements

# Test search performance
time sqlite3 data/automotive.db "SELECT * FROM regulation_content_fts WHERE regulation_content_fts MATCH 'cybersecurity management';"
# Expected: <10ms (sub-second even with full content)
```

**Step 3: Manual Smoke Testing**

Test all 3 tools with real queries:

```bash
# Build and start dev server
npm run build
npm run dev

# In another terminal, use MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Test queries:
# 1. list_sources → Should show 3 sources with accurate item counts
# 2. get_requirement source=r155 reference=7.2.2.2 → Full article text
# 3. search_requirements query="vulnerability management" → Multiple results from R155 and ISO 21434
# 4. get_requirement source=iso_21434 reference=9.4 include_mappings=true → Guidance + mappings to R155
```

**Step 4: Update README.md**

Change Phase 1 markers to Phase 2:

```markdown
# Automotive Cybersecurity MCP Server

> **Phase 2 Release** - Complete content with 80+ requirements from UNECE R155/R156 and ISO 21434.

...

### Phase 2 (Current - v0.2.0) ✅

**Complete Content:**
- ✅ **UNECE R155** - 30+ articles and annexes (complete regulation)
- ✅ **UNECE R156** - 20+ articles and annexes (complete regulation)
- ✅ **ISO 21434** - 30+ clauses with expert guidance
- ✅ **Cross-framework mappings** - R155 ↔ ISO 21434 relationships
- ✅ **80+ requirements** - Comprehensive automotive cybersecurity knowledge base

**Production Infrastructure:**
- ✅ **3 core tools** - `list_sources`, `get_requirement`, `search_requirements`
- ✅ **SQLite database** - FTS5 full-text search with BM25 ranking
- ✅ **MCP protocol** - Full stdio transport support
- ✅ **Type-safe API** - TypeScript with strict mode
- ✅ **Comprehensive tests** - 75+ tests, 100% pass rate
- ✅ **Performance** - Sub-10ms queries even with full content
```

**Step 5: Update package.json Version**

```json
{
  "name": "@ansvar/automotive-cybersecurity-mcp",
  "version": "0.2.0",
  ...
}
```

**Step 6: Create CHANGELOG.md**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.2.0] - 2026-01-29

### Added - Phase 2: Complete Content

**UNECE R155 (30+ articles):**
- Complete regulation text including Articles 1-12
- Annex 5: Type approval documentation requirements
- All CSMS requirements (Article 7.2.2.2 subsections a-j)
- Full-text search across all R155 content

**UNECE R156 (20+ articles):**
- Complete regulation text for software updates
- SUMS requirements (Articles 7.1-7.5)
- Annex 4: SUMS documentation requirements
- Full-text search across all R156 content

**ISO 21434 (30+ clauses with expert guidance):**
- Concept phase: Item definition, goals, concept, TARA
- Development phase: Requirements, architecture, verification, validation
- Operational phase: Monitoring, incident response
- Support processes: Configuration management, tool qualification
- Practical implementation guidance based on real automotive projects
- Work product references for each clause
- CAL relevance indicators

**Cross-Framework Mappings:**
- 10-15 key mappings between R155 ↔ ISO 21434
- Enables compliance queries across frameworks
- `get_requirement` returns mappings when `include_mappings=true`

### Changed
- Database size: 152KB → 800KB-1.2MB
- Total requirements: 2 → 80+
- README updated with Phase 2 status
- Performance remains excellent (<10ms queries)

### Metrics
- **Content:** 80+ requirements
- **Tests:** 75+ passing
- **Code Quality:** A+ (95/100)
- **Query Speed:** <10ms average
- **Database:** 800KB-1.2MB

## [0.1.0] - 2026-01-29

### Added - Phase 1: Foundation
- TypeScript MCP server with stdio transport
- SQLite database with FTS5 full-text search
- 3 core tools: `list_sources`, `get_requirement`, `search_requirements`
- Sample data: R155 (1 article), R156 (metadata), ISO 21434 (1 clause)
- Comprehensive test suite (75 tests, 100% pass rate)
- Production-ready infrastructure
- Apache 2.0 license
```

**Step 7: Final Commit and Tag**

```bash
# Commit version bump
git add package.json README.md CHANGELOG.md
git commit -m "chore: bump version to 0.2.0 - Phase 2 complete

- Updated README to Phase 2 status
- Added comprehensive CHANGELOG
- Version bump 0.1.0 → 0.2.0
- 80+ requirements now available"

# Create git tag
git tag -a v0.2.0 -m "Release v0.2.0 - Phase 2: Complete Content

- UNECE R155: 30+ articles
- UNECE R156: 20+ articles
- ISO 21434: 30+ clauses with expert guidance
- Cross-framework mappings
- 80+ total requirements"

# Push commits and tags
git push origin main
git push origin v0.2.0
```

**Step 8: Prepare for npm Publishing**

```bash
# Verify package contents
npm pack --dry-run

# Should include:
# - dist/ (compiled JS)
# - data/automotive.db (800KB-1.2MB)
# - package.json
# - README.md
# - LICENSE
# - CHANGELOG.md

# Verify database is included (critical!)
tar -tzf automotive-cybersecurity-mcp-0.2.0.tgz | grep automotive.db
# Expected: data/automotive.db

# Run prepublishOnly script to ensure everything builds
npm run prepublishOnly
# Expected: TypeScript compiles, database builds, no errors
```

**Acceptance Criteria:**
- ✅ All 75+ tests pass
- ✅ Database is 800KB-1.2MB with 80+ requirements
- ✅ README reflects Phase 2 completion
- ✅ package.json version is 0.2.0
- ✅ CHANGELOG documents all changes
- ✅ Git tagged with v0.2.0
- ✅ npm pack includes database file
- ✅ Ready for npm publish

---

## Execution Summary

**Total Tasks:** 5 tasks (4 content ingestion + 1 verification)
**Parallelizable:** Tasks 1, 2, 3 can run in parallel (independent sources)
**Sequential:** Task 4 depends on 1-3, Task 5 depends on all
**Estimated Time:** 40-60 hours total, 15-20 hours if parallelized across 3 subagents

**Recommended Execution:**
1. **Parallel:** Launch 3 subagents for Tasks 1, 2, 3 simultaneously
2. **Sequential:** Task 4 (mappings) after content complete
3. **Sequential:** Task 5 (verification) as final step before release

**Output:** Phase 2 complete with v0.2.0 ready for npm publishing - transforms MCP from sample to production-ready compliance tool with 80+ requirements.

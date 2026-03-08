import type Database from '@ansvar/mcp-sqlite';
import type { GetArchitecturePatternInput } from '../types/index.js';

/**
 * Database row shape for architecture_patterns table.
 */
interface ArchitecturePatternRow {
  id: string;
  name: string;
  domain: string;
  description: string;
  components: string;           // JSON array
  trust_boundaries: string;     // JSON array
  applicable_standards: string; // JSON array
  threat_mitigations: string;   // JSON array of {threat, mitigation}
  guidance: string;
  diagram_ascii: string | null;
}

interface ThreatMitigation {
  threat: string;
  mitigation: string;
}

interface PatternSummary {
  id: string;
  name: string;
  domain: string;
  description: string;
}

interface PatternFull {
  id: string;
  name: string;
  domain: string;
  description: string;
  components: string[];
  trust_boundaries: string[];
  applicable_standards: string[];
  threat_mitigations: ThreatMitigation[];
  guidance: string;
  diagram_ascii: string | null;
}

interface DomainGroup {
  domain: string;
  patterns: PatternSummary[];
}

type GetArchitecturePatternOutput =
  | { pattern: PatternFull }
  | { domain: string; patterns: PatternSummary[]; total: number }
  | { domains: DomainGroup[]; total: number };

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toSummary(row: ArchitecturePatternRow): PatternSummary {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    description: row.description,
  };
}

function toFull(row: ArchitecturePatternRow): PatternFull {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    description: row.description,
    components: parseJson<string[]>(row.components, []),
    trust_boundaries: parseJson<string[]>(row.trust_boundaries, []),
    applicable_standards: parseJson<string[]>(row.applicable_standards, []),
    threat_mitigations: parseJson<ThreatMitigation[]>(row.threat_mitigations, []),
    guidance: row.guidance,
    diagram_ascii: row.diagram_ascii,
  };
}

/**
 * Retrieve architecture reference patterns for automotive cybersecurity.
 *
 * - pattern_id provided: return single pattern with full guidance, components,
 *   trust boundaries, threat mitigations, applicable standards, and ASCII diagram.
 * - domain provided: return list of patterns in that domain (name + description only).
 * - Neither: return all patterns grouped by domain (summary listing).
 *
 * @param db - SQLite database connection
 * @param input - Optional pattern_id or domain filter
 * @returns Pattern details or summary listing
 */
export function getArchitecturePattern(
  db: InstanceType<typeof Database>,
  input: GetArchitecturePatternInput,
): GetArchitecturePatternOutput {
  const { pattern_id, domain } = input;

  if (pattern_id) {
    const row = db.prepare(
      'SELECT * FROM architecture_patterns WHERE id = ?',
    ).get(pattern_id) as ArchitecturePatternRow | undefined;

    if (!row) {
      throw new Error(
        `Architecture pattern not found: ${pattern_id}. Use get_architecture_pattern without arguments to list all available patterns.`,
      );
    }

    return { pattern: toFull(row) };
  }

  if (domain) {
    const rows = db.prepare(
      'SELECT * FROM architecture_patterns WHERE domain = ? ORDER BY name',
    ).all(domain) as ArchitecturePatternRow[];

    if (rows.length === 0) {
      const allDomains = db.prepare(
        'SELECT DISTINCT domain FROM architecture_patterns ORDER BY domain',
      ).all() as Array<{ domain: string }>;

      throw new Error(
        `No patterns found for domain: ${domain}. Available domains: ${allDomains.map(d => d.domain).join(', ')}`,
      );
    }

    return {
      domain,
      patterns: rows.map(toSummary),
      total: rows.length,
    };
  }

  // No filters: return all patterns grouped by domain
  const rows = db.prepare(
    'SELECT * FROM architecture_patterns ORDER BY domain, name',
  ).all() as ArchitecturePatternRow[];

  const domainMap = new Map<string, PatternSummary[]>();
  for (const row of rows) {
    const list = domainMap.get(row.domain) ?? [];
    list.push(toSummary(row));
    domainMap.set(row.domain, list);
  }

  const domains: DomainGroup[] = [];
  for (const [dom, patterns] of domainMap) {
    domains.push({ domain: dom, patterns });
  }

  return { domains, total: rows.length };
}

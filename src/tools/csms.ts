import type Database from '@ansvar/mcp-sqlite';
import type { GetCsmsObligationsInput } from '../types/index.js';
import { sanitizeQuery } from './search.js';

/**
 * Database row shape for csms_obligations table.
 */
interface CsmsObligationRow {
  id: string;
  lifecycle_phase: string;
  obligation: string;
  source_regulation: string;
  source_ref: string;
  reporting_timeline: string | null;
  evidence_required: string; // JSON array
  guidance: string;
}

/**
 * Parsed obligation returned to callers.
 */
interface CsmsObligation {
  id: string;
  lifecycle_phase: string;
  obligation: string;
  source_regulation: string;
  source_ref: string;
  reporting_timeline: string | null;
  evidence_required: string[];
  guidance: string;
}

interface PhaseGroup {
  lifecycle_phase: string;
  obligations: CsmsObligation[];
}

interface GetCsmsObligationsOutput {
  phases: PhaseGroup[];
  total: number;
  filters_applied: {
    lifecycle_phase?: string;
    regulation?: string;
    query?: string;
  };
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toObligation(row: CsmsObligationRow): CsmsObligation {
  return {
    id: row.id,
    lifecycle_phase: row.lifecycle_phase,
    obligation: row.obligation,
    source_regulation: row.source_regulation,
    source_ref: row.source_ref,
    reporting_timeline: row.reporting_timeline,
    evidence_required: parseJson<string[]>(row.evidence_required, []),
    guidance: row.guidance,
  };
}

function groupByPhase(obligations: CsmsObligation[]): PhaseGroup[] {
  const map = new Map<string, CsmsObligation[]>();
  for (const o of obligations) {
    const list = map.get(o.lifecycle_phase) ?? [];
    list.push(o);
    map.set(o.lifecycle_phase, list);
  }

  const groups: PhaseGroup[] = [];
  for (const [phase, items] of map) {
    groups.push({ lifecycle_phase: phase, obligations: items });
  }
  return groups;
}

/**
 * Retrieve CSMS operational obligations, optionally filtered by lifecycle phase,
 * source regulation, or full-text search query.
 *
 * - No filters: returns all obligations grouped by lifecycle phase.
 * - lifecycle_phase: filter to a single phase.
 * - regulation: filter to obligations from that source regulation.
 * - query: FTS5 search across obligation text and guidance.
 * - Filters can be combined.
 *
 * @param db - SQLite database connection
 * @param input - Optional filters
 * @returns Obligations grouped by phase with totals
 */
export function getCsmsObligations(
  db: InstanceType<typeof Database>,
  input: GetCsmsObligationsInput,
): GetCsmsObligationsOutput {
  const { lifecycle_phase, regulation, query } = input;

  const filtersApplied: GetCsmsObligationsOutput['filters_applied'] = {};
  if (lifecycle_phase) filtersApplied.lifecycle_phase = lifecycle_phase;
  if (regulation) filtersApplied.regulation = regulation;
  if (query) filtersApplied.query = query;

  // FTS path: when query is provided
  if (query && query.trim() !== '') {
    const sanitized = sanitizeQuery(query);

    const conditions: string[] = [];
    const params: (string | number)[] = [sanitized];

    if (lifecycle_phase) {
      conditions.push('co.lifecycle_phase = ?');
      params.push(lifecycle_phase);
    }
    if (regulation) {
      conditions.push('co.source_regulation = ?');
      params.push(regulation);
    }

    const whereExtra = conditions.length > 0
      ? 'AND ' + conditions.join(' AND ')
      : '';

    const sql = `
      SELECT co.*
      FROM csms_obligations_fts fts
      JOIN csms_obligations co ON co.rowid = fts.rowid
      WHERE csms_obligations_fts MATCH ?
      ${whereExtra}
      ORDER BY bm25(csms_obligations_fts)
    `;

    try {
      const rows = db.prepare(sql).all(...params) as CsmsObligationRow[];
      const obligations = rows.map(toObligation);
      return {
        phases: groupByPhase(obligations),
        total: obligations.length,
        filters_applied: filtersApplied,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('fts5')) {
        return { phases: [], total: 0, filters_applied: filtersApplied };
      }
      throw new Error(
        `CSMS obligations search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Non-FTS path: standard SQL filters
  const conditions: string[] = [];
  const params: string[] = [];

  if (lifecycle_phase) {
    conditions.push('lifecycle_phase = ?');
    params.push(lifecycle_phase);
  }
  if (regulation) {
    conditions.push('source_regulation = ?');
    params.push(regulation);
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const sql = `
    SELECT * FROM csms_obligations
    ${whereClause}
    ORDER BY lifecycle_phase, id
  `;

  const rows = db.prepare(sql).all(...params) as CsmsObligationRow[];
  const obligations = rows.map(toObligation);

  return {
    phases: groupByPhase(obligations),
    total: obligations.length,
    filters_applied: filtersApplied,
  };
}

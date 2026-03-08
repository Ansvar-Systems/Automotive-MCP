import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { join } from 'path';
import { getCsmsObligations } from '../../src/tools/csms.js';
import type { GetCsmsObligationsInput } from '../../src/types/index.js';

describe('get_csms_obligations tool', () => {
  let db: Database;

  beforeAll(() => {
    const dbPath = join(process.cwd(), 'data', 'automotive.db');
    db = new Database(dbPath, { readonly: true });
  });

  afterAll(() => {
    db.close();
  });

  it('should return all obligations grouped by phase when no filters', () => {
    const input: GetCsmsObligationsInput = {};
    const result = getCsmsObligations(db, input);

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(40);
    expect(result.phases.length).toBeGreaterThanOrEqual(5);

    // Every phase group has at least one obligation
    for (const phase of result.phases) {
      expect(phase.lifecycle_phase).toBeTruthy();
      expect(phase.obligations.length).toBeGreaterThan(0);

      // Each obligation has expected fields
      const first = phase.obligations[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('lifecycle_phase');
      expect(first).toHaveProperty('obligation');
      expect(first).toHaveProperty('source_regulation');
      expect(first).toHaveProperty('source_ref');
      expect(first).toHaveProperty('evidence_required');
      expect(first).toHaveProperty('guidance');

      // evidence_required should be parsed JSON array
      expect(Array.isArray(first.evidence_required)).toBe(true);
      expect(first.evidence_required.length).toBeGreaterThan(0);
    }

    // filters_applied should be empty
    expect(Object.keys(result.filters_applied).length).toBe(0);
  });

  it('should filter by lifecycle_phase', () => {
    const input: GetCsmsObligationsInput = { lifecycle_phase: 'operations' };
    const result = getCsmsObligations(db, input);

    expect(result.total).toBeGreaterThan(0);
    expect(result.phases.length).toBe(1);
    expect(result.phases[0].lifecycle_phase).toBe('operations');

    for (const o of result.phases[0].obligations) {
      expect(o.lifecycle_phase).toBe('operations');
    }

    expect(result.filters_applied.lifecycle_phase).toBe('operations');
  });

  it('should filter by regulation', () => {
    const input: GetCsmsObligationsInput = { regulation: 'r155' };
    const result = getCsmsObligations(db, input);

    expect(result.total).toBeGreaterThan(0);

    for (const phase of result.phases) {
      for (const o of phase.obligations) {
        expect(o.source_regulation).toBe('r155');
      }
    }

    expect(result.filters_applied.regulation).toBe('r155');
  });

  it('should perform FTS query across obligation text and guidance', () => {
    const input: GetCsmsObligationsInput = { query: 'incident reporting' };
    const result = getCsmsObligations(db, input);

    expect(result.total).toBeGreaterThan(0);
    expect(result.filters_applied.query).toBe('incident reporting');
  });

  it('should combine lifecycle_phase and query filters', () => {
    const input: GetCsmsObligationsInput = {
      lifecycle_phase: 'operations',
      query: 'incident',
    };
    const result = getCsmsObligations(db, input);

    expect(result.total).toBeGreaterThan(0);
    for (const phase of result.phases) {
      expect(phase.lifecycle_phase).toBe('operations');
    }
  });

  it('should combine lifecycle_phase and regulation filters', () => {
    const input: GetCsmsObligationsInput = {
      lifecycle_phase: 'development',
      regulation: 'r155',
    };
    const result = getCsmsObligations(db, input);

    expect(result.total).toBeGreaterThan(0);
    expect(result.phases.length).toBe(1);
    expect(result.phases[0].lifecycle_phase).toBe('development');

    for (const o of result.phases[0].obligations) {
      expect(o.source_regulation).toBe('r155');
    }
  });

  it('should return empty results for non-matching phase', () => {
    const input: GetCsmsObligationsInput = { lifecycle_phase: 'nonexistent_phase' };
    const result = getCsmsObligations(db, input);

    expect(result.total).toBe(0);
    expect(result.phases.length).toBe(0);
  });

  it('should return empty results for non-matching FTS query', () => {
    const input: GetCsmsObligationsInput = { query: 'xyznonexistentqueryabc' };
    const result = getCsmsObligations(db, input);

    expect(result.total).toBe(0);
    expect(result.phases.length).toBe(0);
  });

  it('should handle special characters in FTS query', () => {
    const input: GetCsmsObligationsInput = { query: 'ISO-21434' };
    expect(() => getCsmsObligations(db, input)).not.toThrow();
  });

  it('should return obligations with reporting_timeline when present', () => {
    const input: GetCsmsObligationsInput = {};
    const result = getCsmsObligations(db, input);

    const all = result.phases.flatMap(p => p.obligations);
    // At least some obligations should have reporting_timeline
    // (or all null is acceptable if data doesn't include them)
    for (const o of all) {
      expect(o).toHaveProperty('reporting_timeline');
    }
  });
});

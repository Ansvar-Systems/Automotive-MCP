import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '..', 'data', 'automotive.db');

describe('Guidance depth - ISO 21434', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  it('ISO 21434 clauses have guidance >= 300 words each', () => {
    const clauses = db.prepare(
      "SELECT clause_id, guidance FROM standard_clauses WHERE standard = 'iso_21434'"
    ).all() as Array<{ clause_id: string; guidance: string }>;

    for (const clause of clauses) {
      const wordCount = clause.guidance.split(/\s+/).length;
      expect(wordCount, `Clause ${clause.clause_id} has ${wordCount} words, need >= 300`).toBeGreaterThanOrEqual(300);
    }
  });

  it('clause 15 (TARA) guidance mentions attack feasibility rating method', () => {
    const clause = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'iso_21434' AND clause_id = '15'"
    ).get() as { guidance: string };
    expect(clause.guidance.toLowerCase()).toContain('attack feasibility');
    expect(clause.guidance.toLowerCase()).toContain('annex g');
  });

  it('clause 13 (operations) guidance mentions CSMS and incident response', () => {
    const clause = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'iso_21434' AND clause_id = '13'"
    ).get() as { guidance: string };
    expect(clause.guidance.toLowerCase()).toContain('incident');
    expect(clause.guidance.toLowerCase()).toContain('monitoring');
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '..', 'data', 'automotive.db');

describe('Guidance depth - Phase 1 remaining standards', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  const standards = ['tisax', 'iso_26262', 'iso_24089', 'gbt'];

  for (const std of standards) {
    it(`${std} clauses have guidance >= 300 words each`, () => {
      const clauses = db.prepare(
        "SELECT clause_id, guidance FROM standard_clauses WHERE standard = ?"
      ).all(std) as Array<{ clause_id: string; guidance: string }>;

      expect(clauses.length).toBeGreaterThan(0);
      for (const clause of clauses) {
        const wordCount = clause.guidance.split(/\s+/).length;
        expect(wordCount, `${std} clause ${clause.clause_id} has ${wordCount} words, need >= 300`).toBeGreaterThanOrEqual(300);
      }
    });
  }

  it('TISAX mentions assessment levels (AL1-AL3)', () => {
    const clause = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'tisax' AND clause_id LIKE '%Overview%' LIMIT 1"
    ).get() as { guidance: string } | undefined;
    if (clause) {
      expect(clause.guidance).toMatch(/AL[- ]?[123]/i);
    }
  });

  it('ISO 26262 mentions ASIL and cybersecurity interaction', () => {
    const clauses = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'iso_26262'"
    ).all() as Array<{ guidance: string }>;
    const combined = clauses.map(c => c.guidance).join(' ').toLowerCase();
    expect(combined).toContain('asil');
    expect(combined).toContain('cybersecurity');
  });

  it('GB/T 40857 mentions China-specific requirements', () => {
    const clauses = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'gbt'"
    ).all() as Array<{ guidance: string }>;
    const combined = clauses.map(c => c.guidance).join(' ').toLowerCase();
    expect(combined).toContain('china');
  });
});

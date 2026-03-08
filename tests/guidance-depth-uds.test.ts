import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '..', 'data', 'automotive.db');

describe('Guidance depth - ISO 14229 (UDS)', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  it('ISO 14229 clauses have guidance >= 300 words each', () => {
    const clauses = db.prepare(
      "SELECT clause_id, guidance FROM standard_clauses WHERE standard = 'iso_14229'"
    ).all() as Array<{ clause_id: string; guidance: string }>;

    for (const clause of clauses) {
      const wordCount = clause.guidance.split(/\s+/).length;
      expect(wordCount, `Clause ${clause.clause_id} has ${wordCount} words, need >= 300`).toBeGreaterThanOrEqual(300);
    }
  });

  it('SecurityAccess (0x27) mentions seed-key and brute force', () => {
    const clause = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'iso_14229' AND clause_id = 'SecurityAccess0x27'"
    ).get() as { guidance: string };
    expect(clause.guidance.toLowerCase()).toContain('seed');
    expect(clause.guidance.toLowerCase()).toContain('brute');
  });

  it('Authentication (0x29) mentions certificate and PKI', () => {
    const clause = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'iso_14229' AND clause_id = 'Authentication0x29'"
    ).get() as { guidance: string };
    expect(clause.guidance.toLowerCase()).toContain('certificate');
    expect(clause.guidance.toLowerCase()).toContain('pki');
  });

  it('DownloadUpload mentions signature verification', () => {
    const clause = db.prepare(
      "SELECT guidance FROM standard_clauses WHERE standard = 'iso_14229' AND clause_id = 'DownloadUpload0x34_0x36'"
    ).get() as { guidance: string };
    expect(clause.guidance.toLowerCase()).toContain('signature');
  });
});

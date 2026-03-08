import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '..', 'data', 'automotive.db');

describe('Market regulations', () => {
  let db: Database.Database;
  beforeAll(() => { db = new Database(DB_PATH, { readonly: true }); });

  it('has at least 7 regulations', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM regulations").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(7);
  });

  const newRegs = ['gbt_40857', 'gbt_40856', 'kmvss_18_3', 'ais_189', 'mlit_guidelines'];
  for (const reg of newRegs) {
    it(`has content for ${reg}`, () => {
      const count = db.prepare(
        "SELECT COUNT(*) as cnt FROM regulation_content WHERE regulation = ?"
      ).get(reg) as { cnt: number };
      expect(count.cnt).toBeGreaterThan(0);
    });
  }

  it('FTS search works across all regulations', () => {
    const results = db.prepare(
      "SELECT DISTINCT regulation FROM regulation_content_fts WHERE regulation_content_fts MATCH 'cybersecurity'"
    ).all() as Array<{ regulation: string }>;
    expect(results.length).toBeGreaterThanOrEqual(3);
  });
});

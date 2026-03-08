import { describe, it, expect, beforeAll } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'automotive.db');

describe('TARA examples', () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  it('has at least 10 TARA examples', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM tara_examples").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(10);
  });

  it('each example has valid JSON arrays for all fields', () => {
    const examples = db.prepare("SELECT * FROM tara_examples").all() as Array<Record<string, string>>;
    for (const ex of examples) {
      for (const field of ['assets', 'threat_scenarios', 'damage_scenarios', 'risk_determinations', 'cybersecurity_goals', 'applicable_standards']) {
        const parsed = JSON.parse(ex[field]);
        expect(Array.isArray(parsed), `${ex.id}.${field} is not an array`).toBe(true);
        expect(parsed.length, `${ex.id}.${field} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('each example has >= 3 cybersecurity goals', () => {
    const examples = db.prepare("SELECT id, cybersecurity_goals FROM tara_examples").all() as Array<{ id: string; cybersecurity_goals: string }>;
    for (const ex of examples) {
      const goals = JSON.parse(ex.cybersecurity_goals);
      expect(goals.length, `${ex.id} has only ${goals.length} goals`).toBeGreaterThanOrEqual(3);
    }
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '..', '..', 'data', 'automotive.db');

describe('Full coverage integration', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  it('has >= 7 regulations', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM regulations").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(7);
  });

  it('has >= 300 regulation content items', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM regulation_content").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(300);
  });

  it('has >= 15 architecture patterns', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM architecture_patterns").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(15);
  });

  it('has >= 80 attack patterns', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM attack_patterns").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(80);
  });

  it('has >= 10 TARA examples', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM tara_examples").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(10);
  });

  it('has >= 40 CSMS obligations', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM csms_obligations").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(40);
  });

  it('has >= 2000 framework mappings', () => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM framework_mappings").get() as { cnt: number };
    expect(count.cnt).toBeGreaterThanOrEqual(2000);
  });

  it('all FTS5 indexes are populated', () => {
    const fts_tables = [
      'regulation_content_fts',
      'standard_clauses_fts',
      'architecture_patterns_fts',
      'attack_patterns_fts',
      'csms_obligations_fts'
    ];
    for (const table of fts_tables) {
      const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as { cnt: number };
      expect(count.cnt, `${table} is empty`).toBeGreaterThan(0);
    }
  });

  it('cross-market mappings exist for at least 3 market regulations', () => {
    const markets = db.prepare(`
      SELECT DISTINCT target_id FROM framework_mappings
      WHERE target_type = 'regulation' AND target_id NOT IN ('r155', 'r156')
    `).all() as Array<{ target_id: string }>;
    expect(markets.length).toBeGreaterThanOrEqual(3);
  });

  it('has 11+ MCP tools registered', () => {
    // Verify by checking that the tool registry exports at least 11 tools
    // We can't easily import from the built code in tests, so check the registry file
    const fs = require('fs');
    const registryContent = fs.readFileSync(
      join(__dirname, '..', '..', 'src', 'tools', 'registry.ts'), 'utf-8'
    );
    const toolMatches = registryContent.match(/name:\s*['"][\w_]+['"]/g);
    expect(toolMatches?.length).toBeGreaterThanOrEqual(11);
  });
});

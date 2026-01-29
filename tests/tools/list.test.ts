import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { listSources } from '../../src/tools/list.js';
import type { ListSourcesInput } from '../../src/types/index.js';

describe('list_sources tool', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Create schema
    db.exec(`
      CREATE TABLE regulations (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        title TEXT NOT NULL,
        version TEXT,
        applies_to TEXT
      );

      CREATE TABLE regulation_content (
        rowid INTEGER PRIMARY KEY,
        regulation TEXT NOT NULL,
        reference TEXT NOT NULL
      );

      CREATE TABLE standards (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        title TEXT NOT NULL,
        version TEXT,
        note TEXT
      );

      CREATE TABLE standard_clauses (
        id INTEGER PRIMARY KEY,
        standard TEXT NOT NULL,
        clause_id TEXT NOT NULL
      );
    `);

    // Insert test data
    const insertRegulation = db.prepare(`
      INSERT INTO regulations (id, full_name, title, version, applies_to)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertRegulation.run(
      'r155',
      'UN Regulation No. 155',
      'Cyber Security and Cyber Security Management System',
      'Revision 2',
      JSON.stringify(['M1', 'M2', 'M3', 'N1', 'N2', 'N3', 'O3', 'O4'])
    );

    insertRegulation.run(
      'r156',
      'UN Regulation No. 156',
      'Software Update and Software Updates Management System',
      'Revision 2',
      JSON.stringify(['M1', 'M2', 'M3', 'N1', 'N2', 'N3', 'O3', 'O4'])
    );

    // Insert regulation content (for counting)
    const insertContent = db.prepare(`
      INSERT INTO regulation_content (regulation, reference) VALUES (?, ?)
    `);

    insertContent.run('r155', '7.2.2.2');
    insertContent.run('r155', '7.2.2.3');
    insertContent.run('r156', '6.2.3.1');

    // Insert standard
    const insertStandard = db.prepare(`
      INSERT INTO standards (id, full_name, title, version, note)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertStandard.run(
      'iso_21434',
      'ISO/SAE 21434:2021',
      'Road vehicles — Cybersecurity engineering',
      '2021',
      'Standard text requires paid license. Clause IDs and expert guidance provided.'
    );

    // Insert standard clauses (for counting)
    const insertClause = db.prepare(`
      INSERT INTO standard_clauses (standard, clause_id) VALUES (?, ?)
    `);

    insertClause.run('iso_21434', '9.3');
    insertClause.run('iso_21434', '9.4');
  });

  afterEach(() => {
    db.close();
  });

  it('should list all sources when no filter is provided', () => {
    const input: ListSourcesInput = {};
    const result = listSources(db, input);

    expect(result).toHaveLength(3);

    // Check regulations
    const r155 = result.find(s => s.id === 'r155');
    expect(r155).toBeDefined();
    expect(r155?.name).toBe('UN Regulation No. 155');
    expect(r155?.type).toBe('regulation');
    expect(r155?.item_count).toBe(2);
    expect(r155?.full_text_available).toBe(true);

    const r156 = result.find(s => s.id === 'r156');
    expect(r156).toBeDefined();
    expect(r156?.name).toBe('UN Regulation No. 156');
    expect(r156?.type).toBe('regulation');
    expect(r156?.item_count).toBe(1);

    // Check standard
    const iso = result.find(s => s.id === 'iso_21434');
    expect(iso).toBeDefined();
    expect(iso?.name).toBe('ISO/SAE 21434:2021');
    expect(iso?.type).toBe('standard');
    expect(iso?.item_count).toBe(2);
    expect(iso?.full_text_available).toBe(false);
  });

  it('should filter to regulations only', () => {
    const input: ListSourcesInput = { source_type: 'regulation' };
    const result = listSources(db, input);

    expect(result).toHaveLength(2);
    expect(result.every(s => s.type === 'regulation')).toBe(true);
    expect(result.map(s => s.id).sort()).toEqual(['r155', 'r156']);
  });

  it('should filter to standards only', () => {
    const input: ListSourcesInput = { source_type: 'standard' };
    const result = listSources(db, input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('standard');
    expect(result[0].id).toBe('iso_21434');
  });

  it('should list all sources when source_type is "all"', () => {
    const input: ListSourcesInput = { source_type: 'all' };
    const result = listSources(db, input);

    expect(result).toHaveLength(3);
  });

  it('should include accurate item counts', () => {
    const input: ListSourcesInput = {};
    const result = listSources(db, input);

    const r155 = result.find(s => s.id === 'r155');
    const r156 = result.find(s => s.id === 'r156');
    const iso = result.find(s => s.id === 'iso_21434');

    expect(r155?.item_count).toBe(2);
    expect(r156?.item_count).toBe(1);
    expect(iso?.item_count).toBe(2);
  });

  it('should include version information', () => {
    const input: ListSourcesInput = {};
    const result = listSources(db, input);

    const r155 = result.find(s => s.id === 'r155');
    expect(r155?.version).toBe('Revision 2');

    const iso = result.find(s => s.id === 'iso_21434');
    expect(iso?.version).toBe('2021');
  });
});

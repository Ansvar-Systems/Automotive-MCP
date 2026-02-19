import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { searchRequirements } from '../../src/tools/search.js';
import type { SearchRequirementsInput } from '../../src/types/index.js';

describe('search_requirements tool', () => {
  let db: Database;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Create schema with FTS5 virtual tables
    db.exec(`
      CREATE TABLE regulations (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        title TEXT NOT NULL
      );

      CREATE TABLE regulation_content (
        rowid INTEGER PRIMARY KEY,
        regulation TEXT NOT NULL,
        content_type TEXT NOT NULL,
        reference TEXT NOT NULL,
        title TEXT,
        text TEXT NOT NULL
      );

      CREATE TABLE standards (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        title TEXT NOT NULL
      );

      CREATE TABLE standard_clauses (
        id INTEGER PRIMARY KEY,
        standard TEXT NOT NULL,
        clause_id TEXT NOT NULL,
        title TEXT NOT NULL,
        guidance TEXT NOT NULL
      );

      CREATE VIRTUAL TABLE regulation_content_fts USING fts5(
        regulation,
        reference,
        title,
        text,
        content='regulation_content',
        content_rowid='rowid'
      );

      CREATE VIRTUAL TABLE standard_clauses_fts USING fts5(
        standard,
        clause_id,
        title,
        guidance,
        content='standard_clauses',
        content_rowid='id'
      );
    `);

    // Insert test regulations
    db.prepare(`
      INSERT INTO regulations (id, full_name, title)
      VALUES (?, ?, ?)
    `).run('r155', 'UN Regulation No. 155', 'Cyber Security');

    db.prepare(`
      INSERT INTO regulations (id, full_name, title)
      VALUES (?, ?, ?)
    `).run('r156', 'UN Regulation No. 156', 'Software Update');

    // Insert regulation content
    db.prepare(`
      INSERT INTO regulation_content (regulation, content_type, reference, title, text)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'r155',
      'article',
      '7.2.2.2',
      'Risk assessment',
      'The manufacturer shall identify and assess cybersecurity risks to the vehicle type. The risk assessment shall consider threats, vulnerabilities, and potential impacts.'
    );

    db.prepare(`
      INSERT INTO regulation_content (regulation, content_type, reference, title, text)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'r155',
      'article',
      '7.2.2.3',
      'Risk treatment',
      'The manufacturer shall implement appropriate measures to mitigate identified cybersecurity risks.'
    );

    db.prepare(`
      INSERT INTO regulation_content (regulation, content_type, reference, title, text)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'r156',
      'article',
      '6.2.3.1',
      'Software update process',
      'The manufacturer shall establish processes for managing software updates throughout the vehicle lifecycle.'
    );

    // Insert test standard
    db.prepare(`
      INSERT INTO standards (id, full_name, title)
      VALUES (?, ?, ?)
    `).run('iso_21434', 'ISO/SAE 21434:2021', 'Road vehicles — Cybersecurity engineering');

    // Insert standard clauses
    db.prepare(`
      INSERT INTO standard_clauses (standard, clause_id, title, guidance)
      VALUES (?, ?, ?, ?)
    `).run(
      'iso_21434',
      '9.3',
      'Risk assessment',
      'Risk assessment shall identify and evaluate cybersecurity risks. Consider attack feasibility, impact severity, and risk treatment options.'
    );

    db.prepare(`
      INSERT INTO standard_clauses (standard, clause_id, title, guidance)
      VALUES (?, ?, ?, ?)
    `).run(
      'iso_21434',
      '15.4',
      'Vulnerability management',
      'Organizations shall establish processes for managing cybersecurity vulnerabilities throughout the vehicle lifecycle.'
    );

    // Populate FTS5 tables
    db.exec(`
      INSERT INTO regulation_content_fts(regulation_content_fts) VALUES('rebuild');
      INSERT INTO standard_clauses_fts(standard_clauses_fts) VALUES('rebuild');
    `);
  });

  afterEach(() => {
    db.close();
  });

  it('should search across all sources by default', () => {
    const input: SearchRequirementsInput = {
      query: 'cybersecurity risks'
    };

    const result = searchRequirements(db, input);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Should find results from both regulations and standards
    const sources = new Set(result.map(r => r.source));
    expect(sources.has('r155')).toBe(true);
    expect(sources.has('iso_21434')).toBe(true);
  });

  it('should return results with correct structure', () => {
    const input: SearchRequirementsInput = {
      query: 'risk assessment'
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeGreaterThan(0);

    const firstResult = result[0];
    expect(firstResult).toHaveProperty('source');
    expect(firstResult).toHaveProperty('reference');
    expect(firstResult).toHaveProperty('title');
    expect(firstResult).toHaveProperty('snippet');
    expect(firstResult).toHaveProperty('relevance');

    expect(typeof firstResult.source).toBe('string');
    expect(typeof firstResult.reference).toBe('string');
    expect(typeof firstResult.snippet).toBe('string');
    expect(typeof firstResult.relevance).toBe('number');
  });

  it('should filter to specific sources', () => {
    const input: SearchRequirementsInput = {
      query: 'risk',
      sources: ['r155']
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeGreaterThan(0);
    expect(result.every(r => r.source === 'r155')).toBe(true);
  });

  it('should filter to multiple specific sources', () => {
    const input: SearchRequirementsInput = {
      query: 'lifecycle',
      sources: ['r156', 'iso_21434']
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeGreaterThan(0);
    expect(result.every(r => r.source === 'r156' || r.source === 'iso_21434')).toBe(true);
    expect(result.some(r => r.source === 'r156')).toBe(true);
    expect(result.some(r => r.source === 'iso_21434')).toBe(true);
  });

  it('should respect limit parameter', () => {
    const input: SearchRequirementsInput = {
      query: 'risk',
      limit: 2
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('should default to limit of 10', () => {
    // Insert more content to exceed default limit
    for (let i = 0; i < 15; i++) {
      db.prepare(`
        INSERT INTO regulation_content (regulation, content_type, reference, title, text)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'r155',
        'article',
        `7.2.2.${i + 10}`,
        `Test article ${i}`,
        `This article discusses risk management and cybersecurity controls for automotive vehicles.`
      );
    }

    // Rebuild FTS5 index
    db.exec(`INSERT INTO regulation_content_fts(regulation_content_fts) VALUES('rebuild');`);

    const input: SearchRequirementsInput = {
      query: 'risk cybersecurity'
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should return empty array for no matches', () => {
    const input: SearchRequirementsInput = {
      query: 'nonexistent quantum blockchain ai'
    };

    const result = searchRequirements(db, input);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should handle special characters in query', () => {
    const input: SearchRequirementsInput = {
      query: 'risk-assessment'
    };

    // Should not throw an error
    expect(() => searchRequirements(db, input)).not.toThrow();
  });

  it('should rank results by relevance', () => {
    const input: SearchRequirementsInput = {
      query: 'risk assessment'
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeGreaterThan(1);

    // Verify results are sorted by relevance (lower BM25 score = more relevant)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].relevance).toBeLessThanOrEqual(result[i + 1].relevance);
    }
  });

  it('should generate snippets with context', () => {
    const input: SearchRequirementsInput = {
      query: 'cybersecurity risks'
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeGreaterThan(0);

    const firstResult = result[0];
    expect(firstResult.snippet).toBeTruthy();
    expect(firstResult.snippet.length).toBeGreaterThan(0);
    // Snippet should contain matched terms with ** highlighting
    expect(firstResult.snippet).toMatch(/\*\*.*\*\*/);
  });

  it('should search in both regulation text and standard guidance', () => {
    const input: SearchRequirementsInput = {
      query: 'vulnerabilities'
    };

    const result = searchRequirements(db, input);

    expect(result.length).toBeGreaterThan(0);

    // Should find matches in both regulations (text) and standards (guidance)
    const regulationResults = result.filter(r => r.source.startsWith('r'));
    const standardResults = result.filter(r => r.source.startsWith('iso'));

    // At least one match should be from regulations (7.2.2.2 mentions vulnerabilities)
    expect(regulationResults.length).toBeGreaterThan(0);
    // At least one match should be from standards (15.4 is about vulnerability management)
    expect(standardResults.length).toBeGreaterThan(0);
  });

  it('should return empty array for empty query', () => {
    const input: SearchRequirementsInput = {
      query: ''
    };

    const result = searchRequirements(db, input);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should handle source filter with no results', () => {
    const input: SearchRequirementsInput = {
      query: 'software update',
      sources: ['r155'] // This topic is only in r156
    };

    const result = searchRequirements(db, input);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

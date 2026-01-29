import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { getRequirement } from '../../src/tools/get.js';
import type { GetRequirementInput } from '../../src/types/index.js';

describe('get_requirement tool', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Create schema
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
        text TEXT NOT NULL,
        parent_reference TEXT,
        UNIQUE(regulation, content_type, reference)
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
        clause_id TEXT NOT NULL,
        title TEXT NOT NULL,
        guidance TEXT NOT NULL,
        work_products TEXT,
        cal_relevant INTEGER DEFAULT 0,
        UNIQUE(standard, clause_id)
      );

      CREATE TABLE framework_mappings (
        id INTEGER PRIMARY KEY,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        source_ref TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_ref TEXT NOT NULL,
        relationship TEXT NOT NULL,
        notes TEXT
      );
    `);

    // Insert test regulation
    db.prepare(`
      INSERT INTO regulations (id, full_name, title)
      VALUES (?, ?, ?)
    `).run('r155', 'UN Regulation No. 155', 'Cyber Security');

    // Insert regulation content
    db.prepare(`
      INSERT INTO regulation_content (regulation, content_type, reference, title, text)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'r155',
      'article',
      '7.2.2.2',
      'Risk assessment',
      'The manufacturer shall identify and assess cybersecurity risks to the vehicle type.'
    );

    // Insert test standard
    db.prepare(`
      INSERT INTO standards (id, full_name, title, version, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'iso_21434',
      'ISO/SAE 21434:2021',
      'Road vehicles — Cybersecurity engineering',
      '2021',
      'Standard text requires paid license.'
    );

    // Insert standard clause
    db.prepare(`
      INSERT INTO standard_clauses (standard, clause_id, title, guidance, work_products, cal_relevant)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'iso_21434',
      '9.3',
      'Risk assessment',
      'Risk assessment shall identify and evaluate cybersecurity risks. Consider attack feasibility, impact severity, and risk treatment options.',
      JSON.stringify(['RiskAssessment', 'ThreatScenarios']),
      1
    );

    // Insert framework mapping
    db.prepare(`
      INSERT INTO framework_mappings (source_type, source_id, source_ref, target_type, target_id, target_ref, relationship, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'regulation',
      'r155',
      '7.2.2.2',
      'standard',
      'iso_21434',
      '9.3',
      'satisfies',
      'R155 risk assessment maps directly to ISO 21434 clause 9.3'
    );
  });

  afterEach(() => {
    db.close();
  });

  it('should retrieve regulation content with full text', () => {
    const input: GetRequirementInput = {
      source: 'r155',
      reference: '7.2.2.2'
    };

    const result = getRequirement(db, input);

    expect(result).toBeDefined();
    expect(result.source).toBe('r155');
    expect(result.reference).toBe('7.2.2.2');
    expect(result.title).toBe('Risk assessment');
    expect(result.text).toBe('The manufacturer shall identify and assess cybersecurity risks to the vehicle type.');
    expect(result.guidance).toBe('');
  });

  it('should retrieve standard clause with guidance only (no full text)', () => {
    const input: GetRequirementInput = {
      source: 'iso_21434',
      reference: '9.3'
    };

    const result = getRequirement(db, input);

    expect(result).toBeDefined();
    expect(result.source).toBe('iso_21434');
    expect(result.reference).toBe('9.3');
    expect(result.title).toBe('Risk assessment');
    expect(result.text).toBe(null); // Standards don't include full text
    expect(result.guidance).toBe('Risk assessment shall identify and evaluate cybersecurity risks. Consider attack feasibility, impact severity, and risk treatment options.');
    expect(result.work_products).toEqual(['RiskAssessment', 'ThreatScenarios']);
  });

  it('should include mappings when requested', () => {
    const input: GetRequirementInput = {
      source: 'r155',
      reference: '7.2.2.2',
      include_mappings: true
    };

    const result = getRequirement(db, input);

    expect(result).toBeDefined();
    expect(result.maps_to).toBeDefined();
    expect(result.maps_to).toHaveLength(1);
    expect(result.maps_to?.[0]).toEqual({
      target_type: 'standard',
      target_id: 'iso_21434',
      target_ref: '9.3',
      relationship: 'satisfies'
    });
  });

  it('should not include mappings when not requested', () => {
    const input: GetRequirementInput = {
      source: 'r155',
      reference: '7.2.2.2',
      include_mappings: false
    };

    const result = getRequirement(db, input);

    expect(result).toBeDefined();
    expect(result.maps_to).toBeUndefined();
  });

  it('should not include mappings by default', () => {
    const input: GetRequirementInput = {
      source: 'r155',
      reference: '7.2.2.2'
    };

    const result = getRequirement(db, input);

    expect(result).toBeDefined();
    expect(result.maps_to).toBeUndefined();
  });

  it('should throw error when source is not found', () => {
    const input: GetRequirementInput = {
      source: 'unknown',
      reference: '1.0'
    };

    expect(() => getRequirement(db, input)).toThrow('Source not found: unknown');
  });

  it('should throw error when reference is not found in regulation', () => {
    const input: GetRequirementInput = {
      source: 'r155',
      reference: '99.99.99'
    };

    expect(() => getRequirement(db, input)).toThrow('Reference not found: 99.99.99 in source r155');
  });

  it('should throw error when reference is not found in standard', () => {
    const input: GetRequirementInput = {
      source: 'iso_21434',
      reference: '99.99'
    };

    expect(() => getRequirement(db, input)).toThrow('Reference not found: 99.99 in source iso_21434');
  });

  it('should handle standard clauses without work products', () => {
    // Insert clause without work_products
    db.prepare(`
      INSERT INTO standard_clauses (standard, clause_id, title, guidance, work_products, cal_relevant)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'iso_21434',
      '5.1',
      'General',
      'This clause provides general guidance.',
      null,
      0
    );

    const input: GetRequirementInput = {
      source: 'iso_21434',
      reference: '5.1'
    };

    const result = getRequirement(db, input);

    expect(result).toBeDefined();
    expect(result.work_products).toBeUndefined();
  });

  it('should handle regulation content without title', () => {
    // Insert content without title
    db.prepare(`
      INSERT INTO regulation_content (regulation, content_type, reference, title, text)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'r155',
      'paragraph',
      '7.2.2.2.1',
      null,
      'Additional requirements for risk assessment.'
    );

    const input: GetRequirementInput = {
      source: 'r155',
      reference: '7.2.2.2.1'
    };

    const result = getRequirement(db, input);

    expect(result).toBeDefined();
    expect(result.title).toBe(null);
    expect(result.text).toBe('Additional requirements for risk assessment.');
  });
});

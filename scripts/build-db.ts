#!/usr/bin/env tsx

/**
 * Build the automotive.db SQLite database from seed JSON files.
 * Run with: npm run build:db
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const SEED_DIR = join(DATA_DIR, 'seed');
const DB_PATH = join(DATA_DIR, 'automotive.db');

const SCHEMA = `
-- ============================================================================
-- Core Regulations
-- ============================================================================

CREATE TABLE IF NOT EXISTS regulations (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT,
  effective_date TEXT,
  source_url TEXT,
  applies_to TEXT,
  regulation_type TEXT
);

CREATE TABLE IF NOT EXISTS regulation_content (
  rowid INTEGER PRIMARY KEY,
  regulation TEXT NOT NULL REFERENCES regulations(id),
  content_type TEXT NOT NULL CHECK(content_type IN ('article', 'annex', 'paragraph')),
  reference TEXT NOT NULL,
  title TEXT,
  text TEXT NOT NULL,
  parent_reference TEXT,
  UNIQUE(regulation, content_type, reference)
);

-- FTS5 for regulation content search
CREATE VIRTUAL TABLE IF NOT EXISTS regulation_content_fts USING fts5(
  regulation,
  reference,
  title,
  text,
  content='regulation_content',
  content_rowid='rowid'
);

-- FTS5 triggers for regulation_content
CREATE TRIGGER IF NOT EXISTS regulation_content_ai AFTER INSERT ON regulation_content BEGIN
  INSERT INTO regulation_content_fts(rowid, regulation, reference, title, text)
  VALUES (new.rowid, new.regulation, new.reference, new.title, new.text);
END;

CREATE TRIGGER IF NOT EXISTS regulation_content_ad AFTER DELETE ON regulation_content BEGIN
  INSERT INTO regulation_content_fts(regulation_content_fts, rowid, regulation, reference, title, text)
  VALUES('delete', old.rowid, old.regulation, old.reference, old.title, old.text);
END;

CREATE TRIGGER IF NOT EXISTS regulation_content_au AFTER UPDATE ON regulation_content BEGIN
  INSERT INTO regulation_content_fts(regulation_content_fts, rowid, regulation, reference, title, text)
  VALUES('delete', old.rowid, old.regulation, old.reference, old.title, old.text);
  INSERT INTO regulation_content_fts(rowid, regulation, reference, title, text)
  VALUES (new.rowid, new.regulation, new.reference, new.title, new.text);
END;

-- ============================================================================
-- Standards (Reference Only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS standards (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS standard_clauses (
  id INTEGER PRIMARY KEY,
  standard TEXT NOT NULL REFERENCES standards(id),
  clause_id TEXT NOT NULL,
  title TEXT NOT NULL,
  guidance TEXT NOT NULL,
  work_products TEXT,
  cal_relevant INTEGER DEFAULT 0,
  UNIQUE(standard, clause_id)
);

-- FTS5 for standard guidance search
CREATE VIRTUAL TABLE IF NOT EXISTS standard_clauses_fts USING fts5(
  standard,
  clause_id,
  title,
  guidance,
  content='standard_clauses',
  content_rowid='id'
);

-- FTS5 triggers for standard_clauses
CREATE TRIGGER IF NOT EXISTS standard_clauses_ai AFTER INSERT ON standard_clauses BEGIN
  INSERT INTO standard_clauses_fts(rowid, standard, clause_id, title, guidance)
  VALUES (new.id, new.standard, new.clause_id, new.title, new.guidance);
END;

CREATE TRIGGER IF NOT EXISTS standard_clauses_ad AFTER DELETE ON standard_clauses BEGIN
  INSERT INTO standard_clauses_fts(standard_clauses_fts, rowid, standard, clause_id, title, guidance)
  VALUES('delete', old.id, old.standard, old.clause_id, old.title, old.guidance);
END;

CREATE TRIGGER IF NOT EXISTS standard_clauses_au AFTER UPDATE ON standard_clauses BEGIN
  INSERT INTO standard_clauses_fts(standard_clauses_fts, rowid, standard, clause_id, title, guidance)
  VALUES('delete', old.id, old.standard, old.clause_id, old.title, old.guidance);
  INSERT INTO standard_clauses_fts(rowid, standard, clause_id, title, guidance)
  VALUES (new.id, new.standard, new.clause_id, new.title, new.guidance);
END;

CREATE TABLE IF NOT EXISTS work_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phase TEXT NOT NULL,
  iso_clause TEXT NOT NULL,
  description TEXT NOT NULL,
  contents TEXT NOT NULL,
  template_available INTEGER DEFAULT 0
);

-- ============================================================================
-- TARA Methodology
-- ============================================================================

CREATE TABLE IF NOT EXISTS threat_scenarios (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  threat TEXT NOT NULL,
  attack_path TEXT,
  stride TEXT,
  attack_feasibility TEXT NOT NULL,
  risk_rating TEXT NOT NULL,
  treatment TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS damage_scenarios (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  impact_category TEXT NOT NULL,
  severity TEXT NOT NULL,
  impact_rating TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cybersecurity_goals (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  property TEXT NOT NULL,
  cal TEXT NOT NULL,
  controls TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS threat_damage_links (
  threat_id TEXT REFERENCES threat_scenarios(id),
  damage_id TEXT REFERENCES damage_scenarios(id),
  PRIMARY KEY (threat_id, damage_id)
);

CREATE TABLE IF NOT EXISTS threat_goal_links (
  threat_id TEXT REFERENCES threat_scenarios(id),
  goal_id TEXT REFERENCES cybersecurity_goals(id),
  PRIMARY KEY (threat_id, goal_id)
);

-- Add indexes for bidirectional lookups
CREATE INDEX IF NOT EXISTS idx_damage_threat ON threat_damage_links(damage_id, threat_id);
CREATE INDEX IF NOT EXISTS idx_goal_threat ON threat_goal_links(goal_id, threat_id);

-- ============================================================================
-- Cross-Framework Mappings
-- ============================================================================

CREATE TABLE IF NOT EXISTS framework_mappings (
  id INTEGER PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK(relationship IN ('satisfies', 'partial', 'related')),
  notes TEXT,
  UNIQUE(source_type, source_id, source_ref, target_type, target_id, target_ref)
);

CREATE INDEX IF NOT EXISTS idx_mappings_source ON framework_mappings(source_type, source_id, source_ref);
CREATE INDEX IF NOT EXISTS idx_mappings_target ON framework_mappings(target_type, target_id, target_ref);
`;

function buildDatabase() {
  console.log('Building automotive cybersecurity database...');

  let db: Database.Database | null = null;

  try {
    // Ensure directories exist
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!existsSync(SEED_DIR)) {
      mkdirSync(SEED_DIR, { recursive: true });
      console.log(`Created ${SEED_DIR} - add seed JSON files here`);
    }

    // Remove existing database for clean rebuild
    if (existsSync(DB_PATH)) {
      console.log('Removing existing database for clean rebuild...');
      unlinkSync(DB_PATH);
    }

    // Create/open database
    db = new Database(DB_PATH);

    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    // Create schema
    console.log('Creating schema...');
    db.exec(SCHEMA);

    console.log('✓ Schema created');
    console.log(`Database ready at: ${DB_PATH}`);
    console.log('Next: Add seed JSON files to data/seed/ and populate tables');
  } catch (error) {
    console.error('Failed to build database:', error);

    // Clean up partial database
    if (existsSync(DB_PATH)) {
      console.log('Cleaning up partial database...');
      try {
        unlinkSync(DB_PATH);
      } catch (cleanupError) {
        console.error('Could not remove partial database:', cleanupError);
      }
    }
    process.exit(1);
  } finally {
    if (db) {
      db.close();
    }
  }
}

buildDatabase();

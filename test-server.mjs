#!/usr/bin/env node

/**
 * Manual test script for Automotive Cybersecurity MCP server
 * Tests all 3 tools with various inputs
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'data', 'automotive.db');

console.log('='.repeat(80));
console.log('Automotive Cybersecurity MCP Server - Manual Testing');
console.log('='.repeat(80));
console.log();

// Import the tool functions
async function loadTools() {
  const { listSources } = await import('./dist/tools/list.js');
  const { getRequirement } = await import('./dist/tools/get.js');
  const { searchRequirements } = await import('./dist/tools/search.js');
  return { listSources, getRequirement, searchRequirements };
}

// Test helper
function testCase(name, fn) {
  console.log(`\n[${'TEST'.padEnd(10)}] ${name}`);
  console.log('-'.repeat(80));
  try {
    fn();
    console.log(`[${'PASS'.padEnd(10)}]`);
  } catch (error) {
    console.log(`[${'FAIL'.padEnd(10)}] ${error.message}`);
    console.error(error);
  }
}

async function runTests() {
  let db;

  try {
    // Open database
    console.log(`Opening database: ${DB_PATH}`);
    db = new Database(DB_PATH, { readonly: true });
    console.log('Database opened successfully\n');

    const { listSources, getRequirement, searchRequirements } = await loadTools();

    // ========================================================================
    // TEST 1: list_sources
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST 1: list_sources - List all available sources');
    console.log('='.repeat(80));

    testCase('List all sources (default)', () => {
      const result = listSources(db, {});
      console.log(JSON.stringify(result, null, 2));
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Expected non-empty array');
      }
    });

    testCase('List regulations only', () => {
      const result = listSources(db, { source_type: 'regulation' });
      console.log(JSON.stringify(result, null, 2));
      if (!result.every(s => s.type === 'regulation')) {
        throw new Error('Expected only regulations');
      }
    });

    testCase('List standards only', () => {
      const result = listSources(db, { source_type: 'standard' });
      console.log(JSON.stringify(result, null, 2));
      if (!result.every(s => s.type === 'standard')) {
        throw new Error('Expected only standards');
      }
    });

    // ========================================================================
    // TEST 2: get_requirement
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST 2: get_requirement - Retrieve specific requirements');
    console.log('='.repeat(80));

    testCase('Get R155 Article 7.2.2.2 (without mappings)', () => {
      const result = getRequirement(db, {
        source: 'r155',
        reference: '7.2.2.2'
      });
      console.log(JSON.stringify(result, null, 2));
      if (!result.text) {
        throw new Error('Expected text content for regulation');
      }
    });

    testCase('Get R155 Article 7.2.2.2 (with mappings)', () => {
      const result = getRequirement(db, {
        source: 'r155',
        reference: '7.2.2.2',
        include_mappings: true
      });
      console.log(JSON.stringify(result, null, 2));
      if (!result.text) {
        throw new Error('Expected text content for regulation');
      }
    });

    testCase('Get ISO 21434 clause 9.3', () => {
      const result = getRequirement(db, {
        source: 'iso_21434',
        reference: '9.3'
      });
      console.log(JSON.stringify(result, null, 2));
      if (result.text !== null) {
        throw new Error('Expected null text for paid standard');
      }
      if (!result.guidance) {
        throw new Error('Expected guidance for standard');
      }
    });

    testCase('Get non-existent source (should error)', () => {
      try {
        getRequirement(db, {
          source: 'nonexistent',
          reference: '1.0'
        });
        throw new Error('Should have thrown error for non-existent source');
      } catch (error) {
        if (error.message.includes('Source not found')) {
          console.log(`Correctly threw error: ${error.message}`);
        } else {
          throw error;
        }
      }
    });

    testCase('Get non-existent reference (should error)', () => {
      try {
        getRequirement(db, {
          source: 'r155',
          reference: '99.99.99'
        });
        throw new Error('Should have thrown error for non-existent reference');
      } catch (error) {
        if (error.message.includes('Reference not found')) {
          console.log(`Correctly threw error: ${error.message}`);
        } else {
          throw error;
        }
      }
    });

    // ========================================================================
    // TEST 3: search_requirements
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST 3: search_requirements - Full-text search');
    console.log('='.repeat(80));

    testCase('Search for "cyber attack"', () => {
      const result = searchRequirements(db, {
        query: 'cyber attack'
      });
      console.log(JSON.stringify(result, null, 2));
      if (!Array.isArray(result)) {
        throw new Error('Expected array result');
      }
    });

    testCase('Search for "risk assessment"', () => {
      const result = searchRequirements(db, {
        query: 'risk assessment'
      });
      console.log(JSON.stringify(result, null, 2));
      if (!Array.isArray(result)) {
        throw new Error('Expected array result');
      }
      // Should return results sorted by relevance
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i].relevance > result[i + 1].relevance) {
          throw new Error('Results not sorted by relevance');
        }
      }
    });

    testCase('Search for "vulnerability" (with limit)', () => {
      const result = searchRequirements(db, {
        query: 'vulnerability',
        limit: 5
      });
      console.log(JSON.stringify(result, null, 2));
      if (result.length > 5) {
        throw new Error('Limit not respected');
      }
    });

    testCase('Search with source filter (r155 only)', () => {
      const result = searchRequirements(db, {
        query: 'risk',
        sources: ['r155']
      });
      console.log(JSON.stringify(result, null, 2));
      if (!result.every(r => r.source === 'r155')) {
        throw new Error('Source filter not applied correctly');
      }
    });

    testCase('Search with multiple source filters', () => {
      const result = searchRequirements(db, {
        query: 'management',
        sources: ['r155', 'iso_21434']
      });
      console.log(JSON.stringify(result, null, 2));
      if (!result.every(r => r.source === 'r155' || r.source === 'iso_21434')) {
        throw new Error('Source filter not applied correctly');
      }
    });

    testCase('Search with special characters', () => {
      const result = searchRequirements(db, {
        query: 'risk-assessment'
      });
      console.log(JSON.stringify(result, null, 2));
      // Should not throw error
    });

    testCase('Search for empty query (should return empty)', () => {
      const result = searchRequirements(db, {
        query: ''
      });
      console.log(JSON.stringify(result, null, 2));
      if (result.length !== 0) {
        throw new Error('Expected empty result for empty query');
      }
    });

    testCase('Search for non-existent term', () => {
      const result = searchRequirements(db, {
        query: 'quantum blockchain metaverse'
      });
      console.log(JSON.stringify(result, null, 2));
      if (result.length !== 0) {
        throw new Error('Expected empty result for non-existent terms');
      }
    });

    // ========================================================================
    // Data Quality Checks
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('DATA QUALITY CHECKS');
    console.log('='.repeat(80));

    testCase('Check database schema', () => {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
      `).all();
      console.log('Tables:', tables.map(t => t.name).join(', '));

      const requiredTables = [
        'regulations',
        'regulation_content',
        'regulation_content_fts',
        'standards',
        'standard_clauses',
        'standard_clauses_fts',
        'framework_mappings'
      ];

      const tableNames = tables.map(t => t.name);
      for (const reqTable of requiredTables) {
        if (!tableNames.includes(reqTable)) {
          throw new Error(`Missing required table: ${reqTable}`);
        }
      }
    });

    testCase('Check regulation content count', () => {
      const count = db.prepare('SELECT COUNT(*) as count FROM regulation_content').get();
      console.log(`Regulation content items: ${count.count}`);
      if (count.count === 0) {
        throw new Error('No regulation content found');
      }
    });

    testCase('Check standard clauses count', () => {
      const count = db.prepare('SELECT COUNT(*) as count FROM standard_clauses').get();
      console.log(`Standard clauses: ${count.count}`);
      if (count.count === 0) {
        throw new Error('No standard clauses found');
      }
    });

    testCase('Check FTS5 index population', () => {
      const regFtsCount = db.prepare('SELECT COUNT(*) as count FROM regulation_content_fts').get();
      const stdFtsCount = db.prepare('SELECT COUNT(*) as count FROM standard_clauses_fts').get();
      console.log(`Regulation FTS entries: ${regFtsCount.count}`);
      console.log(`Standard FTS entries: ${stdFtsCount.count}`);

      if (regFtsCount.count === 0 && stdFtsCount.count === 0) {
        throw new Error('FTS5 indexes are empty');
      }
    });

    testCase('Check for framework mappings', () => {
      const count = db.prepare('SELECT COUNT(*) as count FROM framework_mappings').get();
      console.log(`Framework mappings: ${count.count}`);
      // Mappings are optional for Phase 1, so just report the count
    });

    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('All tests completed. Check results above for any failures.');
    console.log();

  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
      console.log('Database closed.');
    }
  }
}

runTests().catch(console.error);

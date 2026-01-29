#!/usr/bin/env node
/**
 * Comprehensive quality and edge case testing
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'data', 'automotive.db');

async function main() {
  const { listSources } = await import('./dist/tools/list.js');
  const { getRequirement } = await import('./dist/tools/get.js');
  const { searchRequirements } = await import('./dist/tools/search.js');

  const db = new Database(DB_PATH, { readonly: true });

  console.log('='.repeat(80));
  console.log('COMPREHENSIVE QUALITY TESTING');
  console.log('='.repeat(80));

  // Test 1: Verify all declared sources are accessible
  console.log('\n[TEST] All declared sources should be retrievable');
  const sources = listSources(db, {});
  console.log(`Found ${sources.length} sources:`, sources.map(s => s.id).join(', '));

  for (const source of sources) {
    if (source.item_count > 0) {
      console.log(`  ✓ ${source.id} has ${source.item_count} items`);
    } else {
      console.log(`  ⚠ ${source.id} has 0 items (placeholder)`);
    }
  }

  // Test 2: Search quality with various query types
  console.log('\n[TEST] Search quality with different query patterns');

  const searchTests = [
    { query: 'cyber', expected: 'Find cyber-related content' },
    { query: 'security', expected: 'Find security-related content' },
    { query: 'risk', expected: 'Find risk-related content' },
    { query: 'vulnerability', expected: 'Find vulnerability content' },
    { query: 'management system', expected: 'Multi-word search' },
    { query: 'PSIRT', expected: 'Technical acronym search' },
    { query: 'disclosure', expected: 'Process-related term' },
    { query: 'attack', expected: 'Threat-related term' }
  ];

  for (const test of searchTests) {
    const results = searchRequirements(db, { query: test.query, limit: 3 });
    console.log(`  "${test.query}": ${results.length} results`);

    if (results.length > 0) {
      console.log(`    Top result: [${results[0].source}] ${results[0].reference}`);
      console.log(`    Relevance: ${results[0].relevance.toFixed(8)}`);
    }
  }

  // Test 3: Snippet quality
  console.log('\n[TEST] Snippet highlighting and context');
  const snippetTests = ['security', 'vulnerability', 'risk assessment'];

  for (const query of snippetTests) {
    const results = searchRequirements(db, { query, limit: 1 });
    if (results.length > 0) {
      console.log(`\n  Query: "${query}"`);
      console.log(`  Snippet: ${results[0].snippet}`);
      const hasHighlight = results[0].snippet.includes('**');
      console.log(`  Has highlighting: ${hasHighlight ? '✓' : '✗'}`);
    }
  }

  // Test 4: Error handling robustness
  console.log('\n[TEST] Error handling robustness');

  const errorTests = [
    {
      name: 'Invalid source',
      fn: () => getRequirement(db, { source: 'invalid', reference: '1.0' }),
      shouldError: true
    },
    {
      name: 'Invalid reference',
      fn: () => getRequirement(db, { source: 'r155', reference: '999.999' }),
      shouldError: true
    },
    {
      name: 'Empty search query',
      fn: () => searchRequirements(db, { query: '' }),
      shouldError: false
    },
    {
      name: 'Special chars in search',
      fn: () => searchRequirements(db, { query: 'risk-assessment' }),
      shouldError: false
    },
    {
      name: 'Parentheses in search',
      fn: () => searchRequirements(db, { query: '(security)' }),
      shouldError: false
    },
    {
      name: 'Quotes in search',
      fn: () => searchRequirements(db, { query: '"security management"' }),
      shouldError: false
    }
  ];

  for (const test of errorTests) {
    try {
      const result = test.fn();
      if (test.shouldError) {
        console.log(`  ✗ ${test.name}: Should have thrown error`);
      } else {
        console.log(`  ✓ ${test.name}: No error (${Array.isArray(result) ? result.length + ' results' : 'ok'})`);
      }
    } catch (error) {
      if (test.shouldError) {
        console.log(`  ✓ ${test.name}: Correctly threw error`);
      } else {
        console.log(`  ✗ ${test.name}: Unexpected error - ${error.message}`);
      }
    }
  }

  // Test 5: Performance characteristics
  console.log('\n[TEST] Performance characteristics');

  const perfTests = [
    { name: 'Simple query', query: 'security', iterations: 100 },
    { name: 'Multi-word query', query: 'risk assessment', iterations: 100 },
    { name: 'Complex query', query: 'vulnerability management disclosure', iterations: 100 }
  ];

  for (const test of perfTests) {
    const start = Date.now();
    for (let i = 0; i < test.iterations; i++) {
      searchRequirements(db, { query: test.query });
    }
    const elapsed = Date.now() - start;
    const avg = (elapsed / test.iterations).toFixed(2);
    console.log(`  ${test.name}: ${avg}ms avg (${test.iterations} iterations, ${elapsed}ms total)`);

    if (avg > 10) {
      console.log(`    ⚠ Performance warning: Average query time exceeds 10ms`);
    }
  }

  // Test 6: Data completeness checks
  console.log('\n[TEST] Data completeness and consistency');

  const regCount = db.prepare('SELECT COUNT(*) as c FROM regulations').get().c;
  const regContentCount = db.prepare('SELECT COUNT(*) as c FROM regulation_content').get().c;
  const stdCount = db.prepare('SELECT COUNT(*) as c FROM standards').get().c;
  const stdClauseCount = db.prepare('SELECT COUNT(*) as c FROM standard_clauses').get().c;
  const mappingCount = db.prepare('SELECT COUNT(*) as c FROM framework_mappings').get().c;

  console.log(`  Regulations: ${regCount}`);
  console.log(`  Regulation content items: ${regContentCount}`);
  console.log(`  Standards: ${stdCount}`);
  console.log(`  Standard clauses: ${stdClauseCount}`);
  console.log(`  Framework mappings: ${mappingCount}`);

  if (regContentCount === 0) {
    console.log('  ⚠ No regulation content - database needs population');
  }
  if (stdClauseCount === 0) {
    console.log('  ⚠ No standard clauses - database needs population');
  }
  if (mappingCount === 0) {
    console.log('  ℹ No framework mappings (acceptable for Phase 1)');
  }

  // Test 7: FTS5 index integrity
  console.log('\n[TEST] FTS5 index integrity');

  const regFtsCount = db.prepare('SELECT COUNT(*) as c FROM regulation_content_fts').get().c;
  const stdFtsCount = db.prepare('SELECT COUNT(*) as c FROM standard_clauses_fts').get().c;

  console.log(`  Regulation FTS entries: ${regFtsCount}`);
  console.log(`  Standard FTS entries: ${stdFtsCount}`);

  if (regFtsCount !== regContentCount) {
    console.log(`  ✗ FTS index mismatch for regulations: ${regFtsCount} vs ${regContentCount}`);
  } else {
    console.log(`  ✓ Regulation FTS index matches content table`);
  }

  if (stdFtsCount !== stdClauseCount) {
    console.log(`  ✗ FTS index mismatch for standards: ${stdFtsCount} vs ${stdClauseCount}`);
  } else {
    console.log(`  ✓ Standard FTS index matches clause table`);
  }

  db.close();

  console.log('\n' + '='.repeat(80));
  console.log('QUALITY TESTING COMPLETE');
  console.log('='.repeat(80));
}

main().catch(console.error);

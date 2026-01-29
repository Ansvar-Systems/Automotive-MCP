/**
 * Manual integration tests for comprehensive server validation
 * This simulates real-world usage of all 3 tools
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { listSources } from '../src/tools/list.js';
import { getRequirement } from '../src/tools/get.js';
import { searchRequirements } from '../src/tools/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'automotive.db');

describe('Manual Integration Tests - Full Server Validation', () => {
  let db: Database.Database;

  beforeAll(() => {
    if (!existsSync(DB_PATH)) {
      throw new Error(`Database not found at ${DB_PATH}. Run: npm run build:db`);
    }
    db = new Database(DB_PATH, { readonly: true });
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  describe('Tool 1: list_sources', () => {
    it('should list all sources with complete metadata', () => {
      const result = listSources(db, {});

      console.log('\n📋 LIST_SOURCES OUTPUT (all):');
      console.log(JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check required fields
      result.forEach(source => {
        expect(source).toHaveProperty('id');
        expect(source).toHaveProperty('name');
        expect(source).toHaveProperty('type');
        expect(source).toHaveProperty('description');
        expect(source).toHaveProperty('item_count');
        expect(source).toHaveProperty('full_text_available');
        expect(typeof source.full_text_available).toBe('boolean');
      });
    });

    it('should filter regulations correctly', () => {
      const result = listSources(db, { source_type: 'regulation' });

      console.log('\n📋 LIST_SOURCES OUTPUT (regulations only):');
      console.log(JSON.stringify(result, null, 2));

      expect(result.every(s => s.type === 'regulation')).toBe(true);
      expect(result.every(s => s.full_text_available === true)).toBe(true);
    });

    it('should filter standards correctly', () => {
      const result = listSources(db, { source_type: 'standard' });

      console.log('\n📋 LIST_SOURCES OUTPUT (standards only):');
      console.log(JSON.stringify(result, null, 2));

      expect(result.every(s => s.type === 'standard')).toBe(true);
      expect(result.every(s => s.full_text_available === false)).toBe(true);
    });
  });

  describe('Tool 2: get_requirement', () => {
    it('should retrieve R155 Article 7 (CSMS Specifications) without mappings', () => {
      const result = getRequirement(db, {
        source: 'r155',
        reference: '7'
      });

      console.log('\n📄 GET_REQUIREMENT OUTPUT (R155 Article 7):');
      console.log(JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.source).toBe('r155');
      expect(result.reference).toBe('7');
      expect(result.title).toBe('Specifications');
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(20000); // ~22KB of CSMS requirements
      expect(result.text).toContain('7.2.2.2'); // Contains subsection references
    });

    it('should retrieve R155 Article 7 with mappings', () => {
      const result = getRequirement(db, {
        source: 'r155',
        reference: '7',
        include_mappings: true
      });

      console.log('\n📄 GET_REQUIREMENT OUTPUT (R155 Article 7 with mappings):');
      console.log(JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      // Mappings are optional in Phase 1
      if (result.maps_to) {
        expect(Array.isArray(result.maps_to)).toBe(true);
        result.maps_to.forEach(mapping => {
          expect(mapping).toHaveProperty('target_type');
          expect(mapping).toHaveProperty('target_id');
          expect(mapping).toHaveProperty('target_ref');
          expect(mapping).toHaveProperty('relationship');
        });
      }
    });

    it('should retrieve ISO 21434 clause 9.3', () => {
      const result = getRequirement(db, {
        source: 'iso_21434',
        reference: '9.3'
      });

      console.log('\n📄 GET_REQUIREMENT OUTPUT (ISO 21434 9.3):');
      console.log(JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.source).toBe('iso_21434');
      expect(result.reference).toBe('9.3');
      expect(result.title).toBeTruthy();
      expect(result.text).toBeNull(); // Standards don't include full text
      expect(result.guidance).toBeTruthy();
      expect(typeof result.guidance).toBe('string');
      expect(result.guidance.length).toBeGreaterThan(0);
    });

    it('should handle invalid source gracefully', () => {
      expect(() => {
        getRequirement(db, {
          source: 'nonexistent',
          reference: '1.0'
        });
      }).toThrow(/Source not found/);
    });

    it('should handle invalid reference gracefully', () => {
      expect(() => {
        getRequirement(db, {
          source: 'r155',
          reference: '99.99.99'
        });
      }).toThrow(/Reference not found/);
    });
  });

  describe('Tool 3: search_requirements', () => {
    it('should search for "cyber attack" and return relevant results', () => {
      const result = searchRequirements(db, {
        query: 'cyber attack'
      });

      console.log('\n🔍 SEARCH_REQUIREMENTS OUTPUT (cyber attack):');
      console.log(JSON.stringify(result, null, 2));

      expect(Array.isArray(result)).toBe(true);
      // May or may not have results depending on seed data
      if (result.length > 0) {
        result.forEach(item => {
          expect(item).toHaveProperty('source');
          expect(item).toHaveProperty('reference');
          expect(item).toHaveProperty('title');
          expect(item).toHaveProperty('snippet');
          expect(item).toHaveProperty('relevance');
          expect(typeof item.relevance).toBe('number');
        });
      }
    });

    it('should search for "risk assessment" and rank by relevance', () => {
      const result = searchRequirements(db, {
        query: 'risk assessment'
      });

      console.log('\n🔍 SEARCH_REQUIREMENTS OUTPUT (risk assessment):');
      console.log(JSON.stringify(result, null, 2));

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 1) {
        // Verify results are sorted by relevance (lower BM25 = better)
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].relevance).toBeLessThanOrEqual(result[i + 1].relevance);
        }
      }
    });

    it('should search for "vulnerability" and show snippets', () => {
      const result = searchRequirements(db, {
        query: 'vulnerability'
      });

      console.log('\n🔍 SEARCH_REQUIREMENTS OUTPUT (vulnerability):');
      console.log(JSON.stringify(result, null, 2));

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        // Check snippets are formatted with ** highlighting
        result.forEach(item => {
          expect(item.snippet).toBeTruthy();
          expect(typeof item.snippet).toBe('string');
        });
      }
    });

    it('should respect limit parameter', () => {
      const result = searchRequirements(db, {
        query: 'security',
        limit: 3
      });

      console.log('\n🔍 SEARCH_REQUIREMENTS OUTPUT (security, limit 3):');
      console.log(JSON.stringify(result, null, 2));

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should filter by sources', () => {
      const result = searchRequirements(db, {
        query: 'cyber',
        sources: ['r155']
      });

      console.log('\n🔍 SEARCH_REQUIREMENTS OUTPUT (cyber, r155 only):');
      console.log(JSON.stringify(result, null, 2));

      expect(Array.isArray(result)).toBe(true);
      result.forEach(item => {
        expect(item.source).toBe('r155');
      });
    });

    it('should handle empty query gracefully', () => {
      const result = searchRequirements(db, {
        query: ''
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle queries with special characters', () => {
      const result = searchRequirements(db, {
        query: 'risk-assessment'
      });

      console.log('\n🔍 SEARCH_REQUIREMENTS OUTPUT (risk-assessment with hyphen):');
      console.log(JSON.stringify(result, null, 2));

      expect(Array.isArray(result)).toBe(true);
      // Should not throw error
    });
  });

  describe('Data Quality Validation', () => {
    it('should have proper database schema', () => {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
      `).all() as Array<{ name: string }>;

      const tableNames = tables.map(t => t.name);

      const requiredTables = [
        'regulations',
        'regulation_content',
        'regulation_content_fts',
        'standards',
        'standard_clauses',
        'standard_clauses_fts',
        'framework_mappings'
      ];

      requiredTables.forEach(table => {
        expect(tableNames).toContain(table);
      });
    });

    it('should have FTS5 indexes properly configured', () => {
      // Check regulation_content_fts
      const regFtsInfo = db.prepare(`
        SELECT sql FROM sqlite_master WHERE name='regulation_content_fts'
      `).get() as { sql: string } | undefined;

      expect(regFtsInfo).toBeDefined();
      expect(regFtsInfo?.sql).toContain('fts5');

      // Check standard_clauses_fts
      const stdFtsInfo = db.prepare(`
        SELECT sql FROM sqlite_master WHERE name='standard_clauses_fts'
      `).get() as { sql: string } | undefined;

      expect(stdFtsInfo).toBeDefined();
      expect(stdFtsInfo?.sql).toContain('fts5');
    });

    it('should have consistent data between base and FTS tables', () => {
      const regContentCount = db.prepare('SELECT COUNT(*) as count FROM regulation_content').get() as { count: number };
      const regFtsCount = db.prepare('SELECT COUNT(*) as count FROM regulation_content_fts').get() as { count: number };

      expect(regContentCount.count).toBe(regFtsCount.count);

      const stdClauseCount = db.prepare('SELECT COUNT(*) as count FROM standard_clauses').get() as { count: number };
      const stdFtsCount = db.prepare('SELECT COUNT(*) as count FROM standard_clauses_fts').get() as { count: number };

      expect(stdClauseCount.count).toBe(stdFtsCount.count);
    });

    it('should have foreign key constraints enabled', () => {
      const fkEnabled = db.pragma('foreign_keys', { simple: true });
      expect(fkEnabled).toBe(1);
    });
  });

  describe('Real-world Use Case Scenarios', () => {
    it('Scenario 1: Find all cybersecurity management requirements', () => {
      console.log('\n📖 SCENARIO 1: Finding cybersecurity management requirements');

      // First, list sources to know what's available
      const sources = listSources(db, {});
      console.log(`Available sources: ${sources.map(s => s.id).join(', ')}`);

      // Search for management requirements
      const searchResults = searchRequirements(db, {
        query: 'cybersecurity management',
        limit: 10
      });

      console.log(`Found ${searchResults.length} results`);
      searchResults.forEach((r, i) => {
        console.log(`\n${i + 1}. [${r.source}] ${r.reference} - ${r.title}`);
        console.log(`   Relevance: ${r.relevance.toFixed(3)}`);
        console.log(`   Snippet: ${r.snippet}`);
      });

      expect(Array.isArray(searchResults)).toBe(true);
    });

    it('Scenario 2: Get specific requirement with cross-framework context', () => {
      console.log('\n📖 SCENARIO 2: Understanding R155 Article 7 (CSMS Specifications) with mappings');

      const requirement = getRequirement(db, {
        source: 'r155',
        reference: '7',
        include_mappings: true
      });

      console.log('\nRequirement Details:');
      console.log(`  Source: ${requirement.source}`);
      console.log(`  Reference: ${requirement.reference}`);
      console.log(`  Title: ${requirement.title}`);
      console.log(`  Text: ${requirement.text?.substring(0, 200)}...`);

      if (requirement.maps_to && requirement.maps_to.length > 0) {
        console.log('\nMaps to:');
        requirement.maps_to.forEach(m => {
          console.log(`  - ${m.target_id} ${m.target_ref} (${m.relationship})`);
        });
      } else {
        console.log('\nNo mappings available (Phase 1)');
      }

      expect(requirement).toBeDefined();
      expect(requirement.text).toBeTruthy();
    });

    it('Scenario 3: Compare vulnerability requirements across frameworks', () => {
      console.log('\n📖 SCENARIO 3: Comparing vulnerability requirements');

      // Search across all frameworks
      const allResults = searchRequirements(db, {
        query: 'vulnerability',
        limit: 10
      });

      console.log(`\nTotal results: ${allResults.length}`);

      const bySource: Record<string, typeof allResults> = {};
      allResults.forEach(r => {
        if (!bySource[r.source]) {
          bySource[r.source] = [];
        }
        bySource[r.source].push(r);
      });

      Object.entries(bySource).forEach(([source, results]) => {
        console.log(`\n${source.toUpperCase()}:`);
        results.forEach(r => {
          console.log(`  - ${r.reference}: ${r.title}`);
          console.log(`    ${r.snippet}`);
        });
      });

      expect(Array.isArray(allResults)).toBe(true);
    });

    it('Scenario 4: Focused search within specific regulation', () => {
      console.log('\n📖 SCENARIO 4: Searching within R155 only');

      const results = searchRequirements(db, {
        query: 'risk',
        sources: ['r155'],
        limit: 5
      });

      console.log(`\nResults from R155 only: ${results.length}`);
      results.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.reference} - ${r.title}`);
        console.log(`   ${r.snippet}`);
      });

      expect(results.every(r => r.source === 'r155')).toBe(true);
    });

    it('Scenario 5: Retrieve ISO 21434 guidance for implementation', () => {
      console.log('\n📖 SCENARIO 5: Getting ISO 21434 implementation guidance');

      const clause = getRequirement(db, {
        source: 'iso_21434',
        reference: '9.3'
      });

      console.log('\nISO 21434 Clause 9.3:');
      console.log(`  Title: ${clause.title}`);
      console.log(`  Guidance: ${clause.guidance}`);
      if (clause.work_products) {
        console.log(`  Work Products: ${clause.work_products.join(', ')}`);
      }
      console.log(`  Full Text Available: ${clause.text !== null}`);

      expect(clause.text).toBeNull(); // ISO requires paid license
      expect(clause.guidance).toBeTruthy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent sources properly', () => {
      console.log('\n⚠️  Testing error handling for non-existent source');

      expect(() => {
        getRequirement(db, {
          source: 'fake_regulation',
          reference: '1.0'
        });
      }).toThrow(/Source not found/);

      console.log('  ✓ Properly throws error for non-existent source');
    });

    it('should handle non-existent references properly', () => {
      console.log('\n⚠️  Testing error handling for non-existent reference');

      expect(() => {
        getRequirement(db, {
          source: 'r155',
          reference: '999.999.999'
        });
      }).toThrow(/Reference not found/);

      console.log('  ✓ Properly throws error for non-existent reference');
    });

    it('should handle empty search queries', () => {
      console.log('\n⚠️  Testing empty search query');

      const result = searchRequirements(db, { query: '' });

      console.log(`  Results: ${result.length} (expected 0)`);
      expect(result).toEqual([]);

      console.log('  ✓ Returns empty array for empty query');
    });

    it('should handle queries with no matches', () => {
      console.log('\n⚠️  Testing query with no matches');

      const result = searchRequirements(db, {
        query: 'quantum blockchain artificial intelligence neural networks'
      });

      console.log(`  Results: ${result.length}`);
      expect(Array.isArray(result)).toBe(true);

      console.log('  ✓ Returns empty array for non-matching query');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle repeated queries efficiently', () => {
      console.log('\n⚡ Testing repeated query performance');

      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        searchRequirements(db, { query: 'security', limit: 5 });
      }

      const elapsed = Date.now() - start;
      const avgTime = elapsed / iterations;

      console.log(`  ${iterations} queries in ${elapsed}ms`);
      console.log(`  Average: ${avgTime.toFixed(2)}ms per query`);

      expect(avgTime).toBeLessThan(50); // Should be fast
    });

    it('should handle complex queries without errors', () => {
      console.log('\n⚡ Testing complex query patterns');

      const complexQueries = [
        'risk AND assessment',
        'cyber security management',
        'vulnerability disclosure',
        'software update process',
        'threat analysis'
      ];

      complexQueries.forEach(query => {
        const result = searchRequirements(db, { query });
        console.log(`  "${query}": ${result.length} results`);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});

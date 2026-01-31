import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';
import { listWorkProducts } from '../../src/tools/workproducts.js';
import type { ListWorkProductsInput } from '../../src/types/index.js';

describe('list_work_products tool', () => {
  let db: Database.Database;

  beforeAll(() => {
    // Use the actual database for integration testing
    const dbPath = join(process.cwd(), 'data', 'automotive.db');
    db = new Database(dbPath, { readonly: true });
  });

  afterAll(() => {
    db.close();
  });

  it('should return all work products when no filter is provided', () => {
    const input: ListWorkProductsInput = {};
    const result = listWorkProducts(db, input);

    expect(result).toBeDefined();
    expect(result.work_products).toBeDefined();
    expect(result.work_products.length).toBeGreaterThan(40);
    expect(result.summary.total_work_products).toBe(result.work_products.length);
    expect(result.phases).toContain('tara');
    expect(result.phases).toContain('development');
  });

  it('should filter by clause_id', () => {
    const input: ListWorkProductsInput = { clause_id: '15' };
    const result = listWorkProducts(db, input);

    expect(result).toBeDefined();
    expect(result.work_products.length).toBeGreaterThan(0);
    expect(result.work_products.every(wp => wp.clause_id === '15')).toBe(true);
  });

  it('should filter by phase', () => {
    const input: ListWorkProductsInput = { phase: 'tara' };
    const result = listWorkProducts(db, input);

    expect(result).toBeDefined();
    expect(result.work_products.length).toBeGreaterThan(0);
    // TARA phase includes clauses 15 and 15.x
    expect(result.work_products.every(wp => wp.clause_id.startsWith('15'))).toBe(true);
  });

  it('should include R155 references where mapped', () => {
    const input: ListWorkProductsInput = { clause_id: '6' };
    const result = listWorkProducts(db, input);

    expect(result).toBeDefined();
    // Clause 6 work products should have R155 mappings
    const wpWithMappings = result.work_products.filter(wp => wp.r155_refs.length > 0);
    expect(wpWithMappings.length).toBeGreaterThan(0);
  });

  it('should return work product details with correct structure', () => {
    const input: ListWorkProductsInput = { clause_id: '15' };
    const result = listWorkProducts(db, input);

    const wp = result.work_products[0];
    expect(wp).toHaveProperty('id');
    expect(wp).toHaveProperty('name');
    expect(wp).toHaveProperty('clause_id');
    expect(wp).toHaveProperty('clause_title');
    expect(wp).toHaveProperty('cal_relevant');
    expect(wp).toHaveProperty('r155_refs');
    expect(typeof wp.cal_relevant).toBe('boolean');
    expect(Array.isArray(wp.r155_refs)).toBe(true);
  });

  it('should return summary statistics', () => {
    const input: ListWorkProductsInput = {};
    const result = listWorkProducts(db, input);

    expect(result.summary).toBeDefined();
    expect(result.summary.total_work_products).toBeGreaterThan(0);
    expect(result.summary.clauses_covered).toBeGreaterThan(0);
    expect(result.summary.cal_relevant_count).toBeGreaterThan(0);
  });
});

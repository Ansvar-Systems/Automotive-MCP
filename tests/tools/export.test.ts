import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';
import { exportComplianceMatrix } from '../../src/tools/export.js';
import type { ExportComplianceMatrixInput } from '../../src/types/index.js';

describe('export_compliance_matrix tool', () => {
  let db: Database.Database;

  beforeAll(() => {
    const dbPath = join(process.cwd(), 'data', 'automotive.db');
    db = new Database(dbPath, { readonly: true });
  });

  afterAll(() => {
    db.close();
  });

  it('should export R155 matrix as markdown by default', () => {
    const input: ExportComplianceMatrixInput = {};
    const result = exportComplianceMatrix(db, input);

    expect(result).toBeDefined();
    expect(result.format).toBe('markdown');
    expect(result.content).toContain('# R155 Compliance Matrix');
    expect(result.content).toContain('| Requirement | Title |');
    expect(result.statistics.total_requirements).toBeGreaterThan(0);
  });

  it('should export as CSV when requested', () => {
    const input: ExportComplianceMatrixInput = { format: 'csv' };
    const result = exportComplianceMatrix(db, input);

    expect(result).toBeDefined();
    expect(result.format).toBe('csv');
    expect(result.content).toContain('Requirement,Title,ISO 21434 Clauses');
    expect(result.content).toContain('"R155 1"');
  });

  it('should include ISO 21434 mappings for Article 7', () => {
    const input: ExportComplianceMatrixInput = { format: 'markdown' };
    const result = exportComplianceMatrix(db, input);

    // Article 7 (Specifications) should have ISO 21434 mappings
    expect(result.content).toContain('R155 7');
    expect(result.statistics.mapped_requirements).toBeGreaterThan(0);
    expect(result.statistics.unique_work_products).toBeGreaterThan(0);
  });

  it('should calculate coverage percentage', () => {
    const input: ExportComplianceMatrixInput = {};
    const result = exportComplianceMatrix(db, input);

    expect(result.statistics.coverage_percent).toBeGreaterThanOrEqual(0);
    expect(result.statistics.coverage_percent).toBeLessThanOrEqual(100);
  });

  it('should support R156 export', () => {
    const input: ExportComplianceMatrixInput = { regulation: 'r156' };
    const result = exportComplianceMatrix(db, input);

    expect(result).toBeDefined();
    expect(result.content).toContain('# R156 Compliance Matrix');
    expect(result.statistics.total_requirements).toBeGreaterThan(0);
  });

  it('should include guidance when requested', () => {
    const input: ExportComplianceMatrixInput = { include_guidance: true };
    const result = exportComplianceMatrix(db, input);

    expect(result).toBeDefined();
    expect(result.content).toContain('Guidance');
  });
});

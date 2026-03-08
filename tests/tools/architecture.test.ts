import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { join } from 'path';
import { getArchitecturePattern } from '../../src/tools/architecture.js';
import type { GetArchitecturePatternInput } from '../../src/types/index.js';

describe('get_architecture_pattern tool', () => {
  let db: Database;

  beforeAll(() => {
    const dbPath = join(process.cwd(), 'data', 'automotive.db');
    db = new Database(dbPath, { readonly: true });
  });

  afterAll(() => {
    db.close();
  });

  it('should return all patterns grouped by domain when no filters', () => {
    const input: GetArchitecturePatternInput = {};
    const result = getArchitecturePattern(db, input);

    expect(result).toBeDefined();
    expect('domains' in result).toBe(true);
    if ('domains' in result) {
      expect(result.domains.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(20);

      // Each domain group has patterns with summary fields only
      for (const group of result.domains) {
        expect(group.domain).toBeTruthy();
        expect(group.patterns.length).toBeGreaterThan(0);
        for (const p of group.patterns) {
          expect(p).toHaveProperty('id');
          expect(p).toHaveProperty('name');
          expect(p).toHaveProperty('domain');
          expect(p).toHaveProperty('description');
          // Summary should NOT include full guidance
          expect(p).not.toHaveProperty('guidance');
          expect(p).not.toHaveProperty('components');
        }
      }
    }
  });

  it('should return single pattern with full details when pattern_id given', () => {
    const input: GetArchitecturePatternInput = { pattern_id: 'split-trust-diagnostic-pki' };
    const result = getArchitecturePattern(db, input);

    expect(result).toBeDefined();
    expect('pattern' in result).toBe(true);
    if ('pattern' in result) {
      const p = result.pattern;
      expect(p.id).toBe('split-trust-diagnostic-pki');
      expect(p.name).toBe('Split-Trust Diagnostic PKI');
      expect(p.domain).toBe('diagnostics');
      expect(p.description).toBeTruthy();
      expect(p.guidance).toBeTruthy();
      expect(Array.isArray(p.components)).toBe(true);
      expect(p.components.length).toBeGreaterThan(0);
      expect(Array.isArray(p.trust_boundaries)).toBe(true);
      expect(p.trust_boundaries.length).toBeGreaterThan(0);
      expect(Array.isArray(p.applicable_standards)).toBe(true);
      expect(p.applicable_standards.length).toBeGreaterThan(0);
      expect(Array.isArray(p.threat_mitigations)).toBe(true);
      expect(p.threat_mitigations.length).toBeGreaterThan(0);
      // Threat mitigations have the right shape
      expect(p.threat_mitigations[0]).toHaveProperty('threat');
      expect(p.threat_mitigations[0]).toHaveProperty('mitigation');
    }
  });

  it('should return domain-filtered results when domain given', () => {
    const input: GetArchitecturePatternInput = { domain: 'diagnostics' };
    const result = getArchitecturePattern(db, input);

    expect(result).toBeDefined();
    expect('patterns' in result).toBe(true);
    if ('patterns' in result) {
      expect(result.domain).toBe('diagnostics');
      expect(result.patterns.length).toBeGreaterThanOrEqual(4);
      expect(result.total).toBe(result.patterns.length);
      for (const p of result.patterns) {
        expect(p.domain).toBe('diagnostics');
        // Summary only
        expect(p).not.toHaveProperty('guidance');
      }
    }
  });

  it('should throw error for invalid pattern_id', () => {
    const input: GetArchitecturePatternInput = { pattern_id: 'nonexistent-pattern' };
    expect(() => getArchitecturePattern(db, input)).toThrow('Architecture pattern not found: nonexistent-pattern');
  });

  it('should throw error for invalid domain', () => {
    const input: GetArchitecturePatternInput = { domain: 'nonexistent-domain' };
    expect(() => getArchitecturePattern(db, input)).toThrow('No patterns found for domain: nonexistent-domain');
  });

  it('should prefer pattern_id over domain when both provided', () => {
    const input: GetArchitecturePatternInput = {
      pattern_id: 'ota-chain-of-trust',
      domain: 'diagnostics',
    };
    const result = getArchitecturePattern(db, input);

    expect('pattern' in result).toBe(true);
    if ('pattern' in result) {
      expect(result.pattern.id).toBe('ota-chain-of-trust');
      expect(result.pattern.domain).toBe('software-update');
    }
  });
});

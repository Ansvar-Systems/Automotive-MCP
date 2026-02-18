#!/usr/bin/env tsx

/**
 * Generate a source update review report.
 *
 * This script does not fetch remote content. It scans local seed metadata
 * and flags sources that should be manually reviewed for potential version drift.
 *
 * Run with: npm run check:source-updates
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

type StandardSeed = {
  id: string;
  full_name: string;
  version?: string;
  title?: string;
};

type RegulationSeed = {
  id: string;
  full_name: string;
  version?: string;
  effective_date?: string;
};

type StandardsFile = {
  standards: StandardSeed[];
  clauses: unknown[];
};

type RegulationsFile = {
  regulations: RegulationSeed[];
  content: unknown[];
};

type PendingReview = {
  id: string;
  full_name: string;
  current_version: string;
  reason: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STANDARDS_PATH = join(__dirname, '..', 'data', 'seed', 'standards.json');
const REGULATIONS_PATH = join(__dirname, '..', 'data', 'seed', 'regulations.json');
const REPORT_PATH = join(__dirname, '..', 'data', 'source-updates-report.json');

function needsManualVersionReview(version: string | undefined): string | null {
  if (!version || version.trim() === '') {
    return 'Version field missing';
  }

  const normalized = version.toLowerCase();
  if (normalized.includes('current revision')) {
    return 'Uses \"Current revision\" placeholder';
  }
  if (normalized.includes('multi-part')) {
    return 'Uses \"Multi-part\" placeholder';
  }
  if (normalized.includes('digital annex')) {
    return 'Uses \"Digital Annex\" placeholder';
  }

  return null;
}

function buildReport(): void {
  const standardsData = JSON.parse(readFileSync(STANDARDS_PATH, 'utf-8')) as StandardsFile;
  const regulationsData = JSON.parse(readFileSync(REGULATIONS_PATH, 'utf-8')) as RegulationsFile;

  const pendingReview: PendingReview[] = [];

  for (const standard of standardsData.standards) {
    const reason = needsManualVersionReview(standard.version);
    if (reason) {
      pendingReview.push({
        id: standard.id,
        full_name: standard.full_name,
        current_version: standard.version ?? '',
        reason,
      });
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      regulations_count: regulationsData.regulations.length,
      regulation_items_count: regulationsData.content.length,
      standards_count: standardsData.standards.length,
      standard_clauses_count: standardsData.clauses.length,
      pending_review_count: pendingReview.length,
    },
    pending_review: pendingReview,
    check_method: 'Local metadata scan (no network fetch).',
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

  console.log('Source update report generated.');
  console.log(`- Report: ${REPORT_PATH}`);
  console.log(`- Standards: ${report.summary.standards_count}`);
  console.log(`- Clauses: ${report.summary.standard_clauses_count}`);
  console.log(`- Pending manual version reviews: ${report.summary.pending_review_count}`);
}

buildReport();

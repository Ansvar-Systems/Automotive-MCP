import type Database from 'better-sqlite3';
import type { ListSourcesInput, SourceInfo } from '../types/index.js';

/**
 * List available regulations and standards with metadata and item counts.
 *
 * @param db - SQLite database connection
 * @param input - Filter options (source_type)
 * @returns Array of source information objects
 */
export function listSources(db: Database.Database, input: ListSourcesInput): SourceInfo[] {
  const { source_type = 'all' } = input;
  const sources: SourceInfo[] = [];

  // Get regulations if requested
  if (source_type === 'all' || source_type === 'regulation') {
    const regulations = db.prepare(`
      SELECT
        r.id,
        r.full_name,
        r.title,
        r.version,
        r.applies_to,
        COUNT(rc.rowid) as item_count
      FROM regulations r
      LEFT JOIN regulation_content rc ON r.id = rc.regulation
      GROUP BY r.id
      ORDER BY r.id
    `).all() as Array<{
      id: string;
      full_name: string;
      title: string;
      version: string | null;
      applies_to: string;
      item_count: number;
    }>;

    for (const reg of regulations) {
      sources.push({
        id: reg.id,
        name: reg.full_name,
        version: reg.version,
        type: 'regulation',
        item_count: reg.item_count,
        full_text_available: true,
      });
    }
  }

  // Get standards if requested
  if (source_type === 'all' || source_type === 'standard') {
    const standards = db.prepare(`
      SELECT
        s.id,
        s.full_name,
        s.title,
        s.version,
        s.note,
        COUNT(sc.id) as item_count
      FROM standards s
      LEFT JOIN standard_clauses sc ON s.id = sc.standard
      GROUP BY s.id
      ORDER BY s.id
    `).all() as Array<{
      id: string;
      full_name: string;
      title: string;
      version: string | null;
      note: string | null;
      item_count: number;
    }>;

    for (const std of standards) {
      sources.push({
        id: std.id,
        name: std.full_name,
        version: std.version,
        type: 'standard',
        item_count: std.item_count,
        full_text_available: false, // Standards require paid license
      });
    }
  }

  return sources;
}

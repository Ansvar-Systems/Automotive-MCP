import type Database from '@ansvar/mcp-sqlite';
import type { ListWorkProductsInput, ListWorkProductsOutput, WorkProductItem } from '../types/index.js';

/**
 * List ISO 21434 work products with their associated clauses and R155 mappings.
 *
 * Work products are the deliverables required by ISO 21434 for cybersecurity engineering.
 * This tool helps engineers understand what artifacts they need to produce.
 *
 * @param db - SQLite database connection
 * @param input - Optional filters for clause or lifecycle phase
 * @returns List of work products with clause references and R155 mappings
 */
export function listWorkProducts(db: InstanceType<typeof Database>, input: ListWorkProductsInput): ListWorkProductsOutput {
  const { clause_id, phase } = input;

  // Define lifecycle phases for filtering
  const phaseClauseMap: Record<string, string[]> = {
    'organizational': ['5'],
    'project': ['6', '7'],
    'continual': ['8'],
    'concept': ['9'],
    'development': ['10'],
    'validation': ['11'],
    'production': ['12'],
    'operations': ['13'],
    'decommissioning': ['14'],
    'tara': ['15', '15.3', '15.4', '15.5', '15.6', '15.7', '15.8', '15.9']
  };

  // Build query
  let query = `
    SELECT
      sc.clause_id,
      sc.title as clause_title,
      sc.work_products,
      sc.cal_relevant,
      GROUP_CONCAT(DISTINCT fm.target_ref) as r155_refs
    FROM standard_clauses sc
    LEFT JOIN framework_mappings fm
      ON fm.source_type = 'standard'
      AND fm.source_id = sc.standard
      AND fm.source_ref = sc.clause_id
      AND fm.target_id = 'r155'
    WHERE sc.standard = 'iso_21434'
      AND sc.work_products IS NOT NULL
      AND sc.work_products != '[]'
  `;

  const params: string[] = [];

  if (clause_id) {
    query += ` AND sc.clause_id = ?`;
    params.push(clause_id);
  } else if (phase && phaseClauseMap[phase]) {
    const placeholders = phaseClauseMap[phase].map(() => '?').join(', ');
    query += ` AND sc.clause_id IN (${placeholders})`;
    params.push(...phaseClauseMap[phase]);
  }

  query += ` GROUP BY sc.clause_id ORDER BY sc.clause_id`;

  const rows = db.prepare(query).all(...params) as Array<{
    clause_id: string;
    clause_title: string;
    work_products: string;
    cal_relevant: number;
    r155_refs: string | null;
  }>;

  // Process results
  const workProducts: WorkProductItem[] = [];

  for (const row of rows) {
    let products: string[] = [];
    try {
      products = JSON.parse(row.work_products);
    } catch {
      continue;
    }

    for (const product of products) {
      // Parse work product ID and name (format: "[WP-XX-XX] Name")
      const match = product.match(/^\[([^\]]+)\]\s*(.*)$/);
      const wpId = match ? match[1] : null;
      const wpName = match ? match[2] : product;

      workProducts.push({
        id: wpId,
        name: wpName,
        clause_id: row.clause_id,
        clause_title: row.clause_title,
        cal_relevant: row.cal_relevant === 1,
        r155_refs: row.r155_refs ? row.r155_refs.split(',') : []
      });
    }
  }

  // Build summary
  const summary = {
    total_work_products: workProducts.length,
    clauses_covered: [...new Set(workProducts.map(wp => wp.clause_id))].length,
    cal_relevant_count: workProducts.filter(wp => wp.cal_relevant).length
  };

  return {
    work_products: workProducts,
    summary,
    phases: Object.keys(phaseClauseMap)
  };
}

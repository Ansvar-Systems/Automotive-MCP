import type Database from '@ansvar/mcp-sqlite';

export interface AboutContext {
  version: string;
  fingerprint: string;
  dbBuilt: string;
}

export interface AboutResult {
  server: {
    name: string;
    package: string;
    version: string;
    suite: string;
    repository: string;
  };
  dataset: {
    fingerprint: string;
    built: string;
    jurisdiction: string;
    content_basis: string;
    counts: Record<string, number>;
    freshness: {
      last_checked: string | null;
      check_method: string;
    };
  };
  provenance: {
    sources: string[];
    license: string;
    authenticity_note: string;
  };
  security: {
    access_model: string;
    network_access: boolean;
    filesystem_access: boolean;
    arbitrary_execution: boolean;
  };
}

function safeCount(db: InstanceType<typeof Database>, sql: string): number {
  try {
    const row = db.prepare(sql).get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  } catch {
    return 0;
  }
}

export function getAbout(
  db: InstanceType<typeof Database>,
  context: AboutContext
): AboutResult {
  const counts: Record<string, number> = {
    regulations: safeCount(db, 'SELECT COUNT(*) as count FROM regulations'),
    regulation_articles: safeCount(db, 'SELECT COUNT(*) as count FROM regulation_content'),
    standards: safeCount(db, 'SELECT COUNT(*) as count FROM standards'),
    standard_clauses: safeCount(db, 'SELECT COUNT(*) as count FROM standard_clauses'),
    work_products: safeCount(db, 'SELECT COUNT(*) as count FROM work_products'),
    framework_mappings: safeCount(db, 'SELECT COUNT(*) as count FROM framework_mappings'),
  };

  return {
    server: {
      name: 'Automotive Cybersecurity MCP',
      package: '@ansvar/automotive-cybersecurity-mcp',
      version: context.version,
      suite: 'Ansvar Compliance Suite',
      repository: 'https://github.com/Ansvar-Systems/Automotive-MCP',
    },
    dataset: {
      fingerprint: context.fingerprint,
      built: context.dbBuilt,
      jurisdiction: 'International (UNECE) + ISO',
      content_basis:
        'UNECE R155/R156 regulation text from EUR-Lex. ISO 21434 structure and clause titles included; ' +
        'full standard text requires licensed copy. Not an official legal publication.',
      counts,
      freshness: {
        last_checked: null,
        check_method: 'Manual review',
      },
    },
    provenance: {
      sources: ['EUR-Lex (UNECE regulations)', 'ISO (standard structure only)'],
      license:
        'Apache-2.0 (server code). UNECE regulation text reusable under EUR-Lex policy. ' +
        'ISO standard text is copyrighted and not included \u2014 only clause structure and mappings are provided.',
      authenticity_note:
        'UNECE regulation text is derived from EUR-Lex. ISO 21434 content is limited to publicly available ' +
        'clause titles and cross-reference mappings. Verify against official UNECE and ISO publications.',
    },
    security: {
      access_model: 'read-only',
      network_access: false,
      filesystem_access: false,
      arbitrary_execution: false,
    },
  };
}

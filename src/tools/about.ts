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
        'UNECE R155/R156 regulation text from EUR-Lex. Automotive standards are included as curated metadata, ' +
        'overview guidance, and selected clause structure where available. Full copyrighted standard text is not included.',
      counts,
      freshness: {
        last_checked: null,
        check_method: 'Manual review',
      },
    },
    provenance: {
      sources: [
        'EUR-Lex (UNECE regulations)',
        'ISO/SAE standards metadata and structure',
        'IEC standards metadata',
        'ASAM and COVESA public specification metadata'
      ],
      license:
        'Apache-2.0 (server code). UNECE regulation text reusable under EUR-Lex policy. ' +
        'Copyrighted standards text is not included; only metadata, identifiers, and expert-authored guidance are provided.',
      authenticity_note:
        'UNECE regulation text is derived from EUR-Lex. Standards content is limited to publicly available metadata, ' +
        'curated guidance, and selected identifiers. Verify critical requirements against official publications.',
    },
    security: {
      access_model: 'read-only',
      network_access: false,
      filesystem_access: false,
      arbitrary_execution: false,
    },
  };
}

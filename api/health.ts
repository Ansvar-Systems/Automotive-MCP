import type { VercelRequest, VercelResponse } from '@vercel/node';
import { existsSync, copyFileSync, readFileSync } from 'fs';
import { join } from 'path';
import Database from '@ansvar/mcp-sqlite';

let pkgVersion = 'unknown';
try {
  pkgVersion = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
  ).version;
} catch {
  // package.json may not be available in all deployment contexts
}

const SOURCE_DB = join(process.cwd(), 'data', 'automotive.db');
const TMP_DB = '/tmp/automotive.db';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  let dbOk = false;
  try {
    if (!existsSync(TMP_DB) && existsSync(SOURCE_DB)) {
      copyFileSync(SOURCE_DB, TMP_DB);
    }
    if (existsSync(TMP_DB)) {
      const db = new Database(TMP_DB, { readonly: true });
      db.prepare('SELECT 1').get();
      db.close();
      dbOk = true;
    }
  } catch {
    // DB not accessible or corrupted
  }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    server: 'automotive-cybersecurity-mcp',
    version: pkgVersion,
    database: dbOk ? 'available' : 'unavailable',
  });
}

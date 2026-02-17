import type { VercelRequest, VercelResponse } from '@vercel/node';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const pkgVersion: string = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
).version;

const DB_PATH = join(process.cwd(), 'data', 'automotive.db');
const TMP_DB = '/tmp/automotive.db';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const dbAvailable = existsSync(TMP_DB) || existsSync(DB_PATH);

  res.status(dbAvailable ? 200 : 503).json({
    status: dbAvailable ? 'ok' : 'degraded',
    server: 'automotive-cybersecurity-mcp',
    version: pkgVersion,
    database: dbAvailable ? 'available' : 'unavailable',
  });
}

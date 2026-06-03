import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Root for all runtime data: SQLite file + uploaded covers. Configurable via DATA_DIR. */
export const DATA_DIR = resolve(process.env.DATA_DIR ?? './data');
export const COVERS_DIR = join(DATA_DIR, 'covers');
export const DB_PATH = join(DATA_DIR, 'comics.sqlite');

/** Ensure the data directories exist (called once at startup). */
export function ensureDataDirs() {
	mkdirSync(COVERS_DIR, { recursive: true });
}

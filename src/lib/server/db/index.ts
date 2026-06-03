import Database from 'better-sqlite3';
import { DB_PATH, ensureDataDirs } from '../paths';
import { applySchema } from './migrate';

ensureDataDirs();

/**
 * Single shared connection. better-sqlite3 is synchronous; one connection is
 * the recommended setup and keeps memory low on a small server.
 */
export const db = new Database(DB_PATH);

// Pragmas tuned for a read-heavy app on modest hardware.
db.pragma('journal_mode = WAL'); // concurrent reads while writing
db.pragma('synchronous = NORMAL'); // safe with WAL, far fewer fsyncs
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('cache_size = -8000'); // ~8 MB page cache
db.pragma('temp_store = MEMORY');

applySchema(db);

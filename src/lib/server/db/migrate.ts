import type { Database } from 'better-sqlite3';
import schemaSql from './schema.sql?raw';

/** Add a column to an existing table if it isn't there yet. */
function addColumnIfMissing(sqlite: Database, table: string, column: string, ddl: string) {
	const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
	if (!cols.some((c) => c.name === column)) {
		sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
	}
}

function hasColumn(sqlite: Database, table: string, column: string): boolean {
	const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
	return cols.some((c) => c.name === column);
}

/**
 * Apply the schema (all CREATEs use IF NOT EXISTS, so this is safe every startup),
 * then run explicit migrations for columns/indexes added to pre-existing tables.
 */
export function applySchema(sqlite: Database) {
	sqlite.exec(schemaSql);

	// Columns added after the initial release.
	addColumnIfMissing(sqlite, 'series', 'title_original', `title_original TEXT NOT NULL DEFAULT ''`);
	addColumnIfMissing(sqlite, 'series', 'universe_id', `universe_id INTEGER REFERENCES universes(id)`);
	addColumnIfMissing(sqlite, 'issues', 'kind', `kind TEXT NOT NULL DEFAULT 'issue'`);
	addColumnIfMissing(sqlite, 'issues', 'collects', `collects TEXT`);
	addColumnIfMissing(sqlite, 'issues', 'cover_path', `cover_path TEXT`);
	// Draft flag: hide a series or a single release from the public site.
	addColumnIfMissing(sqlite, 'series', 'hidden', `hidden INTEGER NOT NULL DEFAULT 0`);
	addColumnIfMissing(sqlite, 'issues', 'hidden', `hidden INTEGER NOT NULL DEFAULT 0`);
	// Existing releases retain their original release date; publishing a draft refreshes it.
	addColumnIfMissing(sqlite, 'issues', 'published_at', `published_at TEXT`);
	sqlite.exec(`UPDATE issues SET published_at = created_at WHERE published_at IS NULL`);

	// Indexes on migrated columns — created here, after the columns exist.
	sqlite.exec(`
		CREATE INDEX IF NOT EXISTS idx_series_universe ON series(universe_id);
		CREATE INDEX IF NOT EXISTS idx_series_hidden ON series(hidden);
		CREATE INDEX IF NOT EXISTS idx_issues_series ON issues(series_id, kind, sort_index);
		CREATE INDEX IF NOT EXISTS idx_issues_published ON issues(hidden, published_at DESC);
	`);

	// The FTS index gained a title_original column — rebuild it on older DBs.
	if (!hasColumn(sqlite, 'series_fts', 'title_original')) {
		sqlite.exec(`
			DROP TRIGGER IF EXISTS series_ai;
			DROP TRIGGER IF EXISTS series_ad;
			DROP TRIGGER IF EXISTS series_au;
			DROP TABLE IF EXISTS series_fts;
		`);
		sqlite.exec(schemaSql); // recreate FTS (3 columns) + triggers
		sqlite.exec(
			`INSERT INTO series_fts(rowid, title, title_original, description)
			 SELECT id, title, title_original, description FROM series`
		);
	}
}

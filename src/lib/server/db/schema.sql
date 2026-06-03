-- Лонгбокс schema. Applied idempotently on startup (see migrate.ts).
-- All timestamps are ISO-8601 UTC text: datetime('now').

CREATE TABLE IF NOT EXISTS publishers (
	id      INTEGER PRIMARY KEY AUTOINCREMENT,
	name    TEXT NOT NULL,
	slug    TEXT NOT NULL UNIQUE
);

-- A shared universe several series can belong to (e.g. a crossover continuity).
CREATE TABLE IF NOT EXISTS universes (
	id      INTEGER PRIMARY KEY AUTOINCREMENT,
	name    TEXT NOT NULL,
	slug    TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS authors (
	id      INTEGER PRIMARY KEY AUTOINCREMENT,
	name    TEXT NOT NULL,
	slug    TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS series (
	id             INTEGER PRIMARY KEY AUTOINCREMENT,
	title          TEXT NOT NULL,              -- Russian title (primary)
	title_original TEXT NOT NULL DEFAULT '',   -- original-language title
	slug           TEXT NOT NULL UNIQUE,
	description    TEXT NOT NULL DEFAULT '',
	cover_path     TEXT,                       -- filename under DATA_DIR/covers, or NULL
	publisher_id   INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
	universe_id    INTEGER REFERENCES universes(id) ON DELETE SET NULL,
	status         TEXT NOT NULL DEFAULT 'ongoing',
	year           INTEGER,
	created_at     TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_series_publisher ON series(publisher_id);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);
-- idx_series_universe is created in migrate.ts (universe_id may be a migrated column).

CREATE TABLE IF NOT EXISTS series_authors (
	series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
	author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
	role      TEXT NOT NULL DEFAULT 'writer',
	PRIMARY KEY (series_id, author_id, role)
);
CREATE INDEX IF NOT EXISTS idx_sa_author ON series_authors(author_id);

CREATE TABLE IF NOT EXISTS issues (
	id           INTEGER PRIMARY KEY AUTOINCREMENT,
	series_id    INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
	kind         TEXT NOT NULL DEFAULT 'issue', -- 'issue' (single) | 'volume' (collected)
	number       TEXT NOT NULL,                 -- "1", "0", "Annual 2024" — kept as text
	title        TEXT NOT NULL DEFAULT '',
	collects     TEXT,                          -- for volumes: which issues it collects, e.g. "#1–6"
	download_url TEXT NOT NULL,
	sort_index   REAL NOT NULL DEFAULT 0,       -- numeric ordering helper
	created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
-- idx_issues_series is created in migrate.ts (kind may be a migrated column).

-- Analytics: append-only event log.
CREATE TABLE IF NOT EXISTS events (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	type       TEXT NOT NULL,               -- 'series_view' | 'download_click'
	series_id  INTEGER REFERENCES series(id) ON DELETE SET NULL,
	issue_id   INTEGER REFERENCES issues(id) ON DELETE SET NULL,
	visitor    TEXT,                        -- hashed ip+ua, for rough unique counts
	referrer   TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_type_time ON events(type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_series ON events(series_id, type);
CREATE INDEX IF NOT EXISTS idx_events_issue ON events(issue_id, type);

-- Full-text search over series (both titles + description), external-content FTS5.
CREATE VIRTUAL TABLE IF NOT EXISTS series_fts USING fts5(
	title,
	title_original,
	description,
	content='series',
	content_rowid='id',
	tokenize="unicode61 remove_diacritics 2"
);

CREATE TRIGGER IF NOT EXISTS series_ai AFTER INSERT ON series BEGIN
	INSERT INTO series_fts(rowid, title, title_original, description)
	VALUES (new.id, new.title, new.title_original, new.description);
END;
CREATE TRIGGER IF NOT EXISTS series_ad AFTER DELETE ON series BEGIN
	INSERT INTO series_fts(series_fts, rowid, title, title_original, description)
	VALUES ('delete', old.id, old.title, old.title_original, old.description);
END;
CREATE TRIGGER IF NOT EXISTS series_au AFTER UPDATE ON series BEGIN
	INSERT INTO series_fts(series_fts, rowid, title, title_original, description)
	VALUES ('delete', old.id, old.title, old.title_original, old.description);
	INSERT INTO series_fts(rowid, title, title_original, description)
	VALUES (new.id, new.title, new.title_original, new.description);
END;

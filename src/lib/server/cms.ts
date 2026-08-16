import { db } from './db';
import { uniqueSlug, slugify } from './util';
import { deleteCover } from './images';
import type { Status, AuthorRole, ReleaseKind } from '$lib/constants';

export interface SeriesInput {
	title: string;
	titleOriginal: string;
	description: string;
	status: Status;
	year: number | null;
	publisherName: string | null;
	universeName: string | null;
	coverPath?: string | null; // undefined = keep, null = clear, string = replace
	authors: { name: string; role: AuthorRole }[];
}

/** Find an existing row by name (case-insensitive) in a name/slug table, or create it. */
function findOrCreate(table: 'publishers' | 'universes' | 'authors', name: string): number {
	const trimmed = name.trim();
	const existing = db.prepare(`SELECT id FROM ${table} WHERE name = ? COLLATE NOCASE`).get(trimmed) as
		| { id: number }
		| undefined;
	if (existing) return existing.id;
	const info = db
		.prepare(`INSERT INTO ${table} (name, slug) VALUES (?, ?)`)
		.run(trimmed, uniqueSlug(table, trimmed));
	return Number(info.lastInsertRowid);
}

function findOrCreateOptional(table: 'publishers' | 'universes', name: string | null): number | null {
	const trimmed = name?.trim();
	return trimmed ? findOrCreate(table, trimmed) : null;
}

function setAuthors(seriesId: number, authors: { name: string; role: AuthorRole }[]) {
	db.prepare('DELETE FROM series_authors WHERE series_id = ?').run(seriesId);
	const ins = db.prepare(
		'INSERT OR IGNORE INTO series_authors (series_id, author_id, role) VALUES (?, ?, ?)'
	);
	for (const a of authors) {
		if (!a.name.trim()) continue;
		ins.run(seriesId, findOrCreate('authors', a.name), a.role);
	}
}

export function createSeries(input: SeriesInput): number {
	return db.transaction(() => {
		const publisherId = findOrCreateOptional('publishers', input.publisherName);
		const universeId = findOrCreateOptional('universes', input.universeName);
		const info = db
			.prepare(
				`INSERT INTO series (title, title_original, slug, description, cover_path, publisher_id, universe_id, status, year)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(
				input.title,
				input.titleOriginal,
				uniqueSlug('series', input.title),
				input.description,
				input.coverPath ?? null,
				publisherId,
				universeId,
				input.status,
				input.year
			);
		const id = Number(info.lastInsertRowid);
		setAuthors(id, input.authors);
		return id;
	})();
}

export function updateSeries(id: number, input: SeriesInput) {
	db.transaction(() => {
		const publisherId = findOrCreateOptional('publishers', input.publisherName);
		const universeId = findOrCreateOptional('universes', input.universeName);
		// coverPath: undefined → keep existing column; otherwise overwrite (string or null).
		const coverSql = input.coverPath === undefined ? '' : ', cover_path=?';
		const stmt = db.prepare(
			`UPDATE series SET title=?, title_original=?, description=?, publisher_id=?, universe_id=?, status=?, year=?${coverSql}, updated_at=datetime('now') WHERE id=?`
		);
		const base = [
			input.title,
			input.titleOriginal,
			input.description,
			publisherId,
			universeId,
			input.status,
			input.year
		];
		if (input.coverPath === undefined) stmt.run(...base, id);
		else stmt.run(...base, input.coverPath, id);
		setAuthors(id, input.authors);
	})();
}

export function deleteSeries(id: number) {
	const row = db.prepare('SELECT cover_path AS coverPath FROM series WHERE id = ?').get(id) as
		| { coverPath: string | null }
		| undefined;
	const issueCovers = db
		.prepare('SELECT cover_path AS c FROM issues WHERE series_id = ? AND cover_path IS NOT NULL')
		.all(id) as { c: string }[];
	// Remove analytics events too, so deleted series don't linger as orphaned
	// rows (series_id → NULL) that inflate totals.
	db.prepare('DELETE FROM events WHERE series_id = ?').run(id);
	db.prepare('DELETE FROM series WHERE id = ?').run(id); // cascades to issues/authors/comments
	if (row?.coverPath) void deleteCover(row.coverPath);
	for (const r of issueCovers) void deleteCover(r.c);
}

export interface IssueInput {
	kind: ReleaseKind;
	number: string;
	title: string;
	collects: string | null;
	coverPath?: string | null; // undefined = keep, null = clear, string = replace
	downloadUrl: string;
}

/** Numeric helper so "12" sorts after "2"; falls back to a big number for non-numeric. */
function sortIndexOf(number: string): number {
	const n = parseFloat(number);
	return Number.isFinite(n) ? n : 1e9;
}

export function addIssue(seriesId: number, input: IssueInput): number {
	const info = db
		.prepare(
			`INSERT INTO issues (series_id, kind, number, title, collects, cover_path, download_url, sort_index)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			seriesId,
			input.kind,
			input.number,
			input.title,
			input.collects,
			input.coverPath ?? null,
			input.downloadUrl,
			sortIndexOf(input.number)
		);
	db.prepare(`UPDATE series SET updated_at = datetime('now') WHERE id = ?`).run(seriesId);
	return Number(info.lastInsertRowid);
}

export function updateIssue(id: number, input: IssueInput) {
	if (input.coverPath === undefined) {
		db.prepare(
			`UPDATE issues SET kind=?, number=?, title=?, collects=?, download_url=?, sort_index=? WHERE id=?`
		).run(input.kind, input.number, input.title, input.collects, input.downloadUrl, sortIndexOf(input.number), id);
		return;
	}
	const old = db.prepare('SELECT cover_path AS c FROM issues WHERE id = ?').get(id) as
		| { c: string | null }
		| undefined;
	db.prepare(
		`UPDATE issues SET kind=?, number=?, title=?, collects=?, cover_path=?, download_url=?, sort_index=? WHERE id=?`
	).run(
		input.kind,
		input.number,
		input.title,
		input.collects,
		input.coverPath,
		input.downloadUrl,
		sortIndexOf(input.number),
		id
	);
	if (old?.c && old.c !== input.coverPath) void deleteCover(old.c);
}

/** Toggle a series' draft flag (hidden = not shown anywhere on the public site). */
export function setSeriesHidden(id: number, hidden: boolean) {
	db.prepare(`UPDATE series SET hidden = ?, updated_at = datetime('now') WHERE id = ?`).run(
		hidden ? 1 : 0,
		id
	);
}

/** Toggle a single release's draft flag (hidden = not listed inside the series). */
export function setIssueHidden(id: number, hidden: boolean) {
	db.prepare(`UPDATE issues SET hidden = ? WHERE id = ?`).run(hidden ? 1 : 0, id);
	db.prepare(
		`UPDATE series SET updated_at = datetime('now') WHERE id = (SELECT series_id FROM issues WHERE id = ?)`
	).run(id);
}

export interface HiddenSeriesRow {
	id: number;
	title: string;
	slug: string;
	status: string;
	issueCount: number;
}

export interface HiddenIssueRow {
	id: number;
	seriesId: number;
	seriesTitle: string;
	kind: ReleaseKind;
	number: string;
	title: string;
}

/** Drafts overview for the admin "Скрытые" page. */
export function listHiddenSeries(): HiddenSeriesRow[] {
	return db
		.prepare(
			`SELECT s.id, s.title, s.slug, s.status,
				(SELECT COUNT(*) FROM issues i WHERE i.series_id = s.id) AS issueCount
			FROM series s WHERE s.hidden = 1 ORDER BY s.updated_at DESC`
		)
		.all() as HiddenSeriesRow[];
}

/** Hidden releases whose parent series is itself visible (otherwise the whole series is hidden). */
export function listHiddenIssues(): HiddenIssueRow[] {
	return db
		.prepare(
			`SELECT i.id, i.series_id AS seriesId, s.title AS seriesTitle, i.kind, i.number, i.title
			FROM issues i JOIN series s ON s.id = i.series_id
			WHERE i.hidden = 1 AND s.hidden = 0
			ORDER BY s.title COLLATE NOCASE, i.sort_index`
		)
		.all() as HiddenIssueRow[];
}

export function deleteIssue(id: number) {
	const row = db.prepare('SELECT cover_path AS c FROM issues WHERE id = ?').get(id) as
		| { c: string | null }
		| undefined;
	db.prepare('DELETE FROM events WHERE issue_id = ?').run(id); // drop this issue's download events
	db.prepare('DELETE FROM issues WHERE id = ?').run(id);
	if (row?.c) void deleteCover(row.c);
}

// ---- Taxonomy management ----

export interface TaxRow {
	id: number;
	name: string;
	slug: string;
	count: number;
}

export type TaxTable = 'publishers' | 'universes' | 'authors';

export function listTaxonomy(table: TaxTable): TaxRow[] {
	const { join, countCol } =
		table === 'authors'
			? { join: 'LEFT JOIN series_authors s ON s.author_id = t.id', countCol: 's.series_id' }
			: {
					join: `LEFT JOIN series s ON s.${table === 'publishers' ? 'publisher_id' : 'universe_id'} = t.id`,
					countCol: 's.id'
				};
	return db
		.prepare(
			`SELECT t.id, t.name, t.slug, COUNT(${countCol}) AS count
			FROM ${table} t ${join} GROUP BY t.id ORDER BY t.name COLLATE NOCASE`
		)
		.all() as TaxRow[];
}

export function renameTaxonomy(table: TaxTable, id: number, name: string) {
	const trimmed = name.trim();
	if (!trimmed) return;
	db.prepare(`UPDATE ${table} SET name = ?, slug = ? WHERE id = ?`).run(
		trimmed,
		uniqueSlug(table, trimmed, id),
		id
	);
}

export function deleteTaxonomy(table: TaxTable, id: number) {
	// Detach references explicitly so deletion works regardless of how the FK
	// action was declared (ALTER-added columns don't carry ON DELETE SET NULL).
	db.transaction(() => {
		if (table === 'publishers') {
			db.prepare('UPDATE series SET publisher_id = NULL WHERE publisher_id = ?').run(id);
		} else if (table === 'universes') {
			db.prepare('UPDATE series SET universe_id = NULL WHERE universe_id = ?').run(id);
		} else if (table === 'authors') {
			db.prepare('DELETE FROM series_authors WHERE author_id = ?').run(id);
		}
		db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
	})();
}

/** All names for the CMS datalists (autocomplete in the series form). */
export function nameOptions() {
	return {
		publishers: db.prepare('SELECT name FROM publishers ORDER BY name COLLATE NOCASE').all() as {
			name: string;
		}[],
		universes: db.prepare('SELECT name FROM universes ORDER BY name COLLATE NOCASE').all() as {
			name: string;
		}[],
		authors: db.prepare('SELECT name FROM authors ORDER BY name COLLATE NOCASE').all() as {
			name: string;
		}[]
	};
}

export { slugify };

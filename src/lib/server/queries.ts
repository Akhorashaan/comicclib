import { db } from './db';
import { PAGE_SIZE, type Sort, type Status, type AuthorRole, type ReleaseKind } from '$lib/constants';

export interface SeriesCard {
	id: number;
	title: string;
	titleOriginal: string;
	slug: string;
	status: Status;
	year: number | null;
	coverPath: string | null;
	publisherName: string | null;
	publisherSlug: string | null;
	universeName: string | null;
	universeSlug: string | null;
	authors: string | null;
	issueCount: number;
	views: number;
}

export interface IssueRow {
	id: number;
	kind: ReleaseKind;
	number: string;
	title: string;
	collects: string | null;
	downloadUrl: string;
}

export interface SeriesDetail {
	id: number;
	title: string;
	titleOriginal: string;
	slug: string;
	description: string;
	coverPath: string | null;
	status: Status;
	year: number | null;
	publisher: { name: string; slug: string } | null;
	universe: { name: string; slug: string } | null;
	authors: { name: string; slug: string; role: AuthorRole }[];
	issues: IssueRow[];
	views: number;
	downloads: number;
}

export interface ListParams {
	q?: string;
	publisher?: string;
	universe?: string;
	status?: string;
	author?: string;
	sort?: Sort;
	page?: number;
}

export interface ListResult {
	items: SeriesCard[];
	total: number;
	page: number;
	pageCount: number;
}

/** Turn free text into a safe FTS5 prefix query: `"foo"* "bar"*` (implicit AND). */
function ftsQuery(raw: string): string | null {
	const tokens = raw
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean)
		.slice(0, 8);
	if (!tokens.length) return null;
	return tokens.map((t) => `"${t.replace(/"/g, '""')}"*`).join(' ');
}

const ORDER_BY: Record<Sort, string> = {
	recent: 's.updated_at DESC, s.id DESC',
	popular: 'views DESC, s.updated_at DESC',
	title: 's.title COLLATE NOCASE ASC',
	year: 's.year IS NULL, s.year DESC, s.title COLLATE NOCASE ASC'
};

export function listSeries(params: ListParams): ListResult {
	const where: string[] = [];
	const args: unknown[] = [];

	if (params.publisher) {
		where.push('p.slug = ?');
		args.push(params.publisher);
	}
	if (params.universe) {
		where.push('u.slug = ?');
		args.push(params.universe);
	}
	if (params.status) {
		where.push('s.status = ?');
		args.push(params.status);
	}
	if (params.author) {
		where.push(
			'EXISTS (SELECT 1 FROM series_authors sa JOIN authors a ON a.id = sa.author_id WHERE sa.series_id = s.id AND a.slug = ?)'
		);
		args.push(params.author);
	}
	const fts = params.q ? ftsQuery(params.q) : null;
	if (fts) {
		where.push('s.id IN (SELECT rowid FROM series_fts WHERE series_fts MATCH ?)');
		args.push(fts);
	}

	const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const sort: Sort = params.sort ?? 'recent';
	const page = Math.max(1, params.page ?? 1);
	const offset = (page - 1) * PAGE_SIZE;

	const joins = `LEFT JOIN publishers p ON p.id = s.publisher_id
		LEFT JOIN universes u ON u.id = s.universe_id`;

	const total = (
		db.prepare(`SELECT COUNT(*) AS n FROM series s ${joins} ${whereSql}`).get(...args) as { n: number }
	).n;

	const items = db
		.prepare(
			`SELECT
				s.id, s.title, s.title_original AS titleOriginal, s.slug, s.status, s.year, s.cover_path AS coverPath,
				p.name AS publisherName, p.slug AS publisherSlug,
				u.name AS universeName, u.slug AS universeSlug,
				(SELECT GROUP_CONCAT(name, ', ') FROM (
					SELECT DISTINCT a.name FROM series_authors sa
					JOIN authors a ON a.id = sa.author_id
					WHERE sa.series_id = s.id ORDER BY a.name)) AS authors,
				(SELECT COUNT(*) FROM issues i WHERE i.series_id = s.id) AS issueCount,
				(SELECT COUNT(*) FROM events e WHERE e.series_id = s.id AND e.type = 'series_view') AS views
			FROM series s
			${joins}
			${whereSql}
			ORDER BY ${ORDER_BY[sort]}
			LIMIT ? OFFSET ?`
		)
		.all(...args, PAGE_SIZE, offset) as SeriesCard[];

	return { items, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getSeriesDetail(slug: string): SeriesDetail | null {
	const row = db
		.prepare(
			`SELECT s.id, s.title, s.title_original AS titleOriginal, s.slug, s.description,
				s.cover_path AS coverPath, s.status, s.year,
				p.name AS publisherName, p.slug AS publisherSlug,
				u.name AS universeName, u.slug AS universeSlug
			FROM series s
			LEFT JOIN publishers p ON p.id = s.publisher_id
			LEFT JOIN universes u ON u.id = s.universe_id
			WHERE s.slug = ?`
		)
		.get(slug) as
		| {
				id: number;
				title: string;
				titleOriginal: string;
				slug: string;
				description: string;
				coverPath: string | null;
				status: Status;
				year: number | null;
				publisherName: string | null;
				publisherSlug: string | null;
				universeName: string | null;
				universeSlug: string | null;
		  }
		| undefined;
	if (!row) return null;

	const authors = db
		.prepare(
			`SELECT a.name, a.slug, sa.role FROM series_authors sa
			JOIN authors a ON a.id = sa.author_id
			WHERE sa.series_id = ? ORDER BY sa.role, a.name`
		)
		.all(row.id) as { name: string; slug: string; role: AuthorRole }[];

	const issues = db
		.prepare(
			`SELECT id, kind, number, title, collects, download_url AS downloadUrl
			FROM issues WHERE series_id = ? ORDER BY kind ASC, sort_index ASC, id ASC`
		)
		.all(row.id) as IssueRow[];

	const counts = db
		.prepare(
			`SELECT
				(SELECT COUNT(*) FROM events WHERE series_id = ? AND type = 'series_view') AS views,
				(SELECT COUNT(*) FROM events WHERE series_id = ? AND type = 'download_click') AS downloads`
		)
		.get(row.id, row.id) as { views: number; downloads: number };

	return {
		id: row.id,
		title: row.title,
		titleOriginal: row.titleOriginal,
		slug: row.slug,
		description: row.description,
		coverPath: row.coverPath,
		status: row.status,
		year: row.year,
		publisher: row.publisherSlug ? { name: row.publisherName!, slug: row.publisherSlug } : null,
		universe: row.universeSlug ? { name: row.universeName!, slug: row.universeSlug } : null,
		authors,
		issues,
		views: counts.views,
		downloads: counts.downloads
	};
}

export function getSeriesDetailById(id: number): SeriesDetail | null {
	const row = db.prepare('SELECT slug FROM series WHERE id = ?').get(id) as
		| { slug: string }
		| undefined;
	return row ? getSeriesDetail(row.slug) : null;
}

export interface FilterOptions {
	publishers: { name: string; slug: string }[];
	universes: { name: string; slug: string }[];
	authors: { name: string; slug: string }[];
}

/** Distinct filter values that are actually in use, for the filter bar. */
export function getFilterOptions(): FilterOptions {
	const publishers = db
		.prepare(
			`SELECT DISTINCT p.name, p.slug FROM publishers p
			JOIN series s ON s.publisher_id = p.id ORDER BY p.name COLLATE NOCASE`
		)
		.all() as { name: string; slug: string }[];
	const universes = db
		.prepare(
			`SELECT DISTINCT u.name, u.slug FROM universes u
			JOIN series s ON s.universe_id = u.id ORDER BY u.name COLLATE NOCASE`
		)
		.all() as { name: string; slug: string }[];
	const authors = db
		.prepare(
			`SELECT DISTINCT a.name, a.slug FROM authors a
			JOIN series_authors sa ON sa.author_id = a.id ORDER BY a.name COLLATE NOCASE`
		)
		.all() as { name: string; slug: string }[];
	return { publishers, universes, authors };
}

/** Find the issue's download URL and log nothing here (logging done by caller). */
export function getIssueDownload(issueId: number): { url: string; seriesId: number } | null {
	const row = db
		.prepare(`SELECT download_url AS url, series_id AS seriesId FROM issues WHERE id = ?`)
		.get(issueId) as { url: string; seriesId: number } | undefined;
	return row ?? null;
}

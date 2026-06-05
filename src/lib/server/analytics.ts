import { createHash } from 'node:crypto';
import { db } from './db';

export type EventType = 'series_view' | 'download_click';

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';

/** Pseudonymous visitor id: a one-way hash of ip+ua+secret. Not reversible to an IP. */
export function visitorId(ip: string | null, ua: string | null): string {
	return createHash('sha256')
		.update(`${ip ?? ''}|${ua ?? ''}|${SECRET}`)
		.digest('hex')
		.slice(0, 16);
}

// IPs whose views/downloads are never counted (e.g. the site owner). Comma/space separated.
const EXCLUDED_IPS = new Set(
	(process.env.ANALYTICS_EXCLUDE_IPS ?? '')
		.split(/[\s,]+/)
		.map((s) => s.trim())
		.filter(Boolean)
);

/** True if events from this IP should be skipped. */
export function isExcludedIp(ip: string | null): boolean {
	return ip != null && EXCLUDED_IPS.has(ip);
}

const insertEvent = db.prepare(
	`INSERT INTO events (type, series_id, issue_id, visitor, referrer) VALUES (?, ?, ?, ?, ?)`
);

export function logEvent(
	type: EventType,
	opts: {
		seriesId?: number | null;
		issueId?: number | null;
		visitor?: string | null;
		referrer?: string | null;
	} = {}
) {
	insertEvent.run(
		type,
		opts.seriesId ?? null,
		opts.issueId ?? null,
		opts.visitor ?? null,
		opts.referrer ?? null
	);
}

// ---- Admin analytics ----

export interface Overview {
	views: number;
	downloads: number;
	uniqueVisitors: number;
	seriesCount: number;
	issueCount: number;
}

export function getOverview(days: number): Overview {
	const since = `-${days} days`;
	const ev = db
		.prepare(
			`SELECT
				SUM(type = 'series_view') AS views,
				SUM(type = 'download_click') AS downloads,
				COUNT(DISTINCT visitor) AS uniqueVisitors
			FROM events WHERE created_at >= datetime('now', ?)`
		)
		.get(since) as { views: number | null; downloads: number | null; uniqueVisitors: number };
	const totals = db
		.prepare(`SELECT (SELECT COUNT(*) FROM series) AS s, (SELECT COUNT(*) FROM issues) AS i`)
		.get() as { s: number; i: number };
	return {
		views: ev.views ?? 0,
		downloads: ev.downloads ?? 0,
		uniqueVisitors: ev.uniqueVisitors ?? 0,
		seriesCount: totals.s,
		issueCount: totals.i
	};
}

export interface TopSeriesRow {
	id: number;
	title: string;
	slug: string;
	views: number;
	downloads: number;
}

export function getTopSeries(days: number, limit = 15): TopSeriesRow[] {
	const since = `-${days} days`;
	return db
		.prepare(
			`SELECT s.id, s.title, s.slug,
				SUM(e.type = 'series_view') AS views,
				SUM(e.type = 'download_click') AS downloads
			FROM events e JOIN series s ON s.id = e.series_id
			WHERE e.created_at >= datetime('now', ?)
			GROUP BY s.id
			ORDER BY views DESC, downloads DESC
			LIMIT ?`
		)
		.all(since, limit) as TopSeriesRow[];
}

export interface TopIssueRow {
	id: number;
	number: string;
	title: string;
	seriesTitle: string;
	seriesSlug: string;
	downloads: number;
}

export function getTopIssues(days: number, limit = 15): TopIssueRow[] {
	const since = `-${days} days`;
	return db
		.prepare(
			`SELECT i.id, i.number, i.title, s.title AS seriesTitle, s.slug AS seriesSlug,
				COUNT(*) AS downloads
			FROM events e
			JOIN issues i ON i.id = e.issue_id
			JOIN series s ON s.id = i.series_id
			WHERE e.type = 'download_click' AND e.created_at >= datetime('now', ?)
			GROUP BY i.id
			ORDER BY downloads DESC
			LIMIT ?`
		)
		.all(since, limit) as TopIssueRow[];
}

export interface DayPoint {
	day: string;
	views: number;
	downloads: number;
}

/** Daily counts for the last N days, zero-filled so the chart has no gaps. */
export function getTimeseries(days: number): DayPoint[] {
	const rows = db
		.prepare(
			`SELECT date(created_at) AS day,
				SUM(type = 'series_view') AS views,
				SUM(type = 'download_click') AS downloads
			FROM events
			WHERE created_at >= datetime('now', ?)
			GROUP BY day`
		)
		.all(`-${days} days`) as { day: string; views: number; downloads: number }[];

	const byDay = new Map(rows.map((r) => [r.day, r]));
	const out: DayPoint[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const day = db.prepare(`SELECT date('now', ?) AS d`).get(`-${i} days`) as { d: string };
		const hit = byDay.get(day.d);
		out.push({ day: day.d, views: hit?.views ?? 0, downloads: hit?.downloads ?? 0 });
	}
	return out;
}

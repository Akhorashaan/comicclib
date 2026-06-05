import { db } from './db';

export const MAX_BODY = 2000;
export const MAX_AUTHOR = 60;

export interface CommentRow {
	id: number;
	author: string;
	body: string;
	createdAt: string;
}

export interface AdminCommentRow extends CommentRow {
	seriesId: number;
	seriesTitle: string;
	seriesSlug: string;
}

const COMMENTS_PER_SERIES = 200; // cap shown on a series page

export function listCommentsForSeries(seriesId: number): CommentRow[] {
	return db
		.prepare(
			`SELECT id, author, body, created_at AS createdAt
			FROM comments WHERE series_id = ?
			ORDER BY created_at DESC, id DESC
			LIMIT ?`
		)
		.all(seriesId, COMMENTS_PER_SERIES) as CommentRow[];
}

export function addComment(input: {
	seriesId: number;
	author: string;
	body: string;
	visitor: string | null;
}): CommentRow | null {
	// Series must exist (FK is enforced, but check for a clean error).
	const exists = db.prepare('SELECT 1 FROM series WHERE id = ?').get(input.seriesId);
	if (!exists) return null;

	const author = input.author.trim().slice(0, MAX_AUTHOR);
	const body = input.body.trim().slice(0, MAX_BODY);
	if (!body) return null;

	const info = db
		.prepare('INSERT INTO comments (series_id, author, body, visitor) VALUES (?, ?, ?, ?)')
		.run(input.seriesId, author, body, input.visitor);

	return db
		.prepare('SELECT id, author, body, created_at AS createdAt FROM comments WHERE id = ?')
		.get(Number(info.lastInsertRowid)) as CommentRow;
}

export function recentComments(limit = 50): AdminCommentRow[] {
	return db
		.prepare(
			`SELECT c.id, c.author, c.body, c.created_at AS createdAt,
				s.id AS seriesId, s.title AS seriesTitle, s.slug AS seriesSlug
			FROM comments c JOIN series s ON s.id = c.series_id
			ORDER BY c.created_at DESC, c.id DESC
			LIMIT ?`
		)
		.all(limit) as AdminCommentRow[];
}

export function deleteComment(id: number) {
	db.prepare('DELETE FROM comments WHERE id = ?').run(id);
}

export function commentCount(): number {
	return (db.prepare('SELECT COUNT(*) AS n FROM comments').get() as { n: number }).n;
}

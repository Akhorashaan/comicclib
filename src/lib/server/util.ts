import { db } from './db';

/** URL-friendly slug; keeps unicode letters (so Cyrillic titles still work). */
export function slugify(input: string): string {
	const base = input
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
	return base || 'item';
}

/**
 * Produce a slug unique within `table`, appending -2, -3, … on collision.
 * `excludeId` lets an update keep its own slug.
 */
export function uniqueSlug(table: string, input: string, excludeId?: number): string {
	const base = slugify(input);
	let candidate = base;
	let n = 1;
	const stmt = db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`);
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const hit = stmt.get(candidate, excludeId ?? -1);
		if (!hit) return candidate;
		n += 1;
		candidate = `${base}-${n}`;
	}
}

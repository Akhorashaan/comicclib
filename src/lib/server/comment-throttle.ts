// Lightweight in-memory anti-spam for anonymous comments, keyed by IP.

const WINDOW_MS = 10 * 60 * 1000; // sliding window
const MAX_IN_WINDOW = 8; // max comments per window per IP
const MIN_INTERVAL_MS = 15 * 1000; // min gap between two comments
const MAX_ENTRIES = 20_000;

const hits = new Map<string, number[]>(); // ip -> recent timestamps

function now(): number {
	return Date.now();
}

export interface CommentGate {
	allowed: boolean;
	retryAfterSec: number;
}

export function checkComment(ip: string): CommentGate {
	const t = now();
	if (hits.size > MAX_ENTRIES) hits.clear(); // crude bound; fine for this scale

	const list = (hits.get(ip) ?? []).filter((ts) => t - ts < WINDOW_MS);
	if (list.length) {
		const sinceLast = t - list[list.length - 1];
		if (sinceLast < MIN_INTERVAL_MS) {
			return { allowed: false, retryAfterSec: Math.ceil((MIN_INTERVAL_MS - sinceLast) / 1000) };
		}
	}
	if (list.length >= MAX_IN_WINDOW) {
		const retry = Math.ceil((WINDOW_MS - (t - list[0])) / 1000);
		return { allowed: false, retryAfterSec: retry };
	}
	return { allowed: true, retryAfterSec: 0 };
}

/** Record a successful comment for this IP. */
export function recordComment(ip: string) {
	const t = now();
	const list = (hits.get(ip) ?? []).filter((ts) => t - ts < WINDOW_MS);
	list.push(t);
	hits.set(ip, list);
}

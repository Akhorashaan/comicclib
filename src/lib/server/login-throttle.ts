// In-memory brute-force protection for the admin login.
// Single-process app → a Map is enough and costs almost nothing.

const MAX_FAILS = 5; // allowed failures before lockout
const WINDOW_MS = 15 * 60 * 1000; // failures are counted within this window
const LOCK_MS = 15 * 60 * 1000; // lockout duration once the limit is hit
const MAX_ENTRIES = 10_000; // hard cap so the map can't grow unbounded

interface Entry {
	fails: number;
	firstFailAt: number;
	lockedUntil: number;
}

const attempts = new Map<string, Entry>();

function now(): number {
	return Date.now();
}

/** Drop stale entries (expired window and not locked). Cheap, runs opportunistically. */
function prune(t: number) {
	if (attempts.size < MAX_ENTRIES) return;
	for (const [ip, e] of attempts) {
		if (e.lockedUntil < t && t - e.firstFailAt > WINDOW_MS) attempts.delete(ip);
	}
}

export interface Gate {
	allowed: boolean;
	retryAfterSec: number;
}

/** Whether this IP may attempt a login right now. */
export function checkLogin(ip: string): Gate {
	const e = attempts.get(ip);
	if (!e) return { allowed: true, retryAfterSec: 0 };
	const t = now();
	if (e.lockedUntil > t) {
		return { allowed: false, retryAfterSec: Math.ceil((e.lockedUntil - t) / 1000) };
	}
	return { allowed: true, retryAfterSec: 0 };
}

/** Record a failed attempt; locks the IP once MAX_FAILS is reached within the window. */
export function recordFailure(ip: string) {
	const t = now();
	prune(t);
	let e = attempts.get(ip);
	if (!e || t - e.firstFailAt > WINDOW_MS) {
		e = { fails: 0, firstFailAt: t, lockedUntil: 0 };
	}
	e.fails += 1;
	if (e.fails >= MAX_FAILS) {
		e.lockedUntil = t + LOCK_MS;
		e.fails = 0;
		e.firstFailAt = t;
	}
	attempts.set(ip, e);
}

/** Clear the record on a successful login. */
export function recordSuccess(ip: string) {
	attempts.delete(ip);
}

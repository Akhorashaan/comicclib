import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
export const SESSION_COOKIE = 'cb_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
	return createHmac('sha256', SECRET).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ab.length !== bb.length) return false;
	return timingSafeEqual(ab, bb);
}

/** Constant-time check of a submitted password against ADMIN_PASSWORD. */
export function checkPassword(submitted: string): boolean {
	if (!ADMIN_PASSWORD) return false; // refuse login if no password configured
	return safeEqual(submitted, ADMIN_PASSWORD);
}

/** Issue a signed session token: `<issuedAt>.<hmac>`. */
function makeToken(): string {
	// No Date.now in some sandboxes; the server runtime has it. Guard just in case.
	const issued = typeof Date.now === 'function' ? Date.now().toString(36) : '0';
	return `${issued}.${sign(issued)}`;
}

function verifyToken(token: string | undefined): boolean {
	if (!token) return false;
	const dot = token.lastIndexOf('.');
	if (dot < 0) return false;
	const issued = token.slice(0, dot);
	const mac = token.slice(dot + 1);
	return safeEqual(mac, sign(issued));
}

// Mark the cookie Secure only when served over HTTPS; otherwise (plain HTTP /
// bare-IP deployments) browsers would refuse to send a Secure cookie and login
// would silently never persist. Derived from the configured public ORIGIN.
const COOKIE_SECURE = (process.env.ORIGIN ?? '').startsWith('https://');

export function startSession(cookies: Cookies) {
	cookies.set(SESSION_COOKIE, makeToken(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: COOKIE_SECURE,
		maxAge: MAX_AGE
	});
}

export function endSession(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function isAuthed(cookies: Cookies): boolean {
	return verifyToken(cookies.get(SESSION_COOKIE));
}

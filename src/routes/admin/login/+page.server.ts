import { fail, redirect } from '@sveltejs/kit';
import { checkPassword, startSession } from '$lib/server/auth';
import { checkLogin, recordFailure, recordSuccess } from '$lib/server/login-throttle';
import type { Actions, PageServerLoad } from './$types';

/** Only allow same-site relative redirects. */
function safeNext(next: string | null): string {
	if (next && next.startsWith('/') && !next.startsWith('//')) return next;
	return '/admin';
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.isAdmin) throw redirect(303, safeNext(url.searchParams.get('next')));
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		let ip = 'unknown';
		try {
			ip = getClientAddress();
		} catch {
			ip = 'unknown';
		}

		const gate = checkLogin(ip);
		if (!gate.allowed) {
			return fail(429, {
				error: `Слишком много попыток. Повторите через ${Math.ceil(gate.retryAfterSec / 60)} мин.`
			});
		}

		const data = await request.formData();
		const password = String(data.get('password') ?? '');
		if (!checkPassword(password)) {
			recordFailure(ip);
			return fail(401, { error: 'Неверный пароль или CMS-пароль не задан в окружении.' });
		}

		recordSuccess(ip);
		startSession(cookies);
		throw redirect(303, safeNext(url.searchParams.get('next')));
	}
};

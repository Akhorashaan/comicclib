import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = isAuthed(event.cookies);

	// Guard the whole /admin area except the login page.
	const { pathname } = event.url;
	if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
		if (!event.locals.isAdmin) {
			throw redirect(303, `/admin/login?next=${encodeURIComponent(pathname)}`);
		}
	}

	return resolve(event);
};

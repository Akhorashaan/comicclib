import { error } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries';
import { logEvent, visitorId, isExcludedIp } from '$lib/server/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, request, getClientAddress, setHeaders, locals }) => {
	// Admins can open a draft series (public gets a 404), but hidden releases are
	// never listed on the public site — preview those from the admin editor.
	const series = getSeriesDetail(params.slug, {
		includeHidden: locals.isAdmin,
		includeHiddenIssues: false
	});
	if (!series) throw error(404, 'Серия не найдена');

	let ip: string | null = null;
	try {
		ip = getClientAddress();
	} catch {
		ip = null;
	}
	// This load fires once per open (direct nav or shallow-route preload) → one view.
	// Don't count the owner's own views (logged-in admin or an excluded IP).
	if (!locals.isAdmin && !isExcludedIp(ip)) {
		logEvent('series_view', {
			seriesId: series.id,
			visitor: visitorId(ip, request.headers.get('user-agent')),
			referrer: request.headers.get('referer')
		});
	}

	setHeaders({ 'cache-control': 'no-store' });
	return { series };
};

import { error } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries';
import { logEvent, visitorId } from '$lib/server/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, request, getClientAddress, setHeaders }) => {
	const series = getSeriesDetail(params.slug);
	if (!series) throw error(404, 'Серия не найдена');

	let ip: string | null = null;
	try {
		ip = getClientAddress();
	} catch {
		ip = null;
	}
	// This load fires once per open (direct nav or shallow-route preload) → one view.
	logEvent('series_view', {
		seriesId: series.id,
		visitor: visitorId(ip, request.headers.get('user-agent')),
		referrer: request.headers.get('referer')
	});

	setHeaders({ 'cache-control': 'no-store' });
	return { series };
};

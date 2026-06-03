import { getOverview, getTopSeries, getTopIssues, getTimeseries } from '$lib/server/analytics';
import type { PageServerLoad } from './$types';

const ALLOWED = [7, 30, 90, 365];

export const load: PageServerLoad = ({ url }) => {
	const raw = Number(url.searchParams.get('days'));
	const days = ALLOWED.includes(raw) ? raw : 30;
	return {
		days,
		overview: getOverview(days),
		topSeries: getTopSeries(days),
		topIssues: getTopIssues(days),
		series: getTimeseries(days)
	};
};

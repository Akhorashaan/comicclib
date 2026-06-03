import { listSeries, getFilterOptions, type ListParams } from '$lib/server/queries';
import { SORTS, type Sort } from '$lib/constants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url, setHeaders }) => {
	const sortParam = url.searchParams.get('sort');
	const params: ListParams = {
		q: url.searchParams.get('q') ?? undefined,
		publisher: url.searchParams.get('publisher') ?? undefined,
		universe: url.searchParams.get('universe') ?? undefined,
		status: url.searchParams.get('status') ?? undefined,
		author: url.searchParams.get('author') ?? undefined,
		sort: SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : 'recent',
		page: Number(url.searchParams.get('page')) || 1
	};

	const result = listSeries(params);

	// Short shared cache: cheap relief for a small server, fresh enough for a catalog.
	setHeaders({ 'cache-control': 'public, max-age=15' });

	return { ...result, filters: getFilterOptions() };
};

import { db } from '$lib/server/db';
import { deleteSeries, setSeriesHidden } from '$lib/server/cms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const rows = (
		db
			.prepare(
				`SELECT s.id, s.title, s.title_original AS titleOriginal, s.slug, s.status, s.year, s.hidden, p.name AS publisherName,
				(SELECT COUNT(*) FROM issues i WHERE i.series_id = s.id) AS issueCount,
				(SELECT COUNT(*) FROM events e WHERE e.series_id = s.id AND e.type='series_view') AS views
			FROM series s
			LEFT JOIN publishers p ON p.id = s.publisher_id
			${q ? 'WHERE s.title LIKE ? OR s.title_original LIKE ?' : ''}
			ORDER BY s.updated_at DESC`
			)
			.all(...(q ? [`%${q}%`, `%${q}%`] : [])) as {
			id: number;
			title: string;
			titleOriginal: string;
			slug: string;
			status: string;
			year: number | null;
			hidden: number;
			publisherName: string | null;
			issueCount: number;
			views: number;
		}[]
	).map((r) => ({ ...r, hidden: !!r.hidden }));
	return { rows, q };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (Number.isInteger(id)) deleteSeries(id);
		return { deleted: true };
	},

	toggleHidden: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (Number.isInteger(id)) setSeriesHidden(id, data.get('hidden') === '1');
		return { toggled: true };
	}
};

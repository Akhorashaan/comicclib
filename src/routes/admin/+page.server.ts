import { getOverview } from '$lib/server/analytics';
import { commentCount } from '$lib/server/comments';
import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const overview = getOverview(30);
	const comments = commentCount();
	const recent = db
		.prepare(
			`SELECT id, title, slug, status, updated_at AS updatedAt,
				(SELECT COUNT(*) FROM issues i WHERE i.series_id = series.id) AS issueCount
			FROM series ORDER BY updated_at DESC LIMIT 8`
		)
		.all() as {
		id: number;
		title: string;
		slug: string;
		status: string;
		updatedAt: string;
		issueCount: number;
	}[];
	return { overview, comments, recent };
};

import { recentComments, deleteComment } from '$lib/server/comments';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	comments: recentComments(100)
});

export const actions: Actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (Number.isInteger(id)) deleteComment(id);
		return { deleted: true };
	}
};

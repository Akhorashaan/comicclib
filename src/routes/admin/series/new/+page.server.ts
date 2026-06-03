import { fail, redirect } from '@sveltejs/kit';
import { createSeries, nameOptions } from '$lib/server/cms';
import { parseSeriesForm } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => nameOptions();

export const actions: Actions = {
	default: async ({ request }) => {
		const input = await parseSeriesForm(await request.formData());
		if (!input.title) return fail(400, { error: 'Укажите название.' });
		const id = createSeries(input);
		throw redirect(303, `/admin/series/${id}`);
	}
};

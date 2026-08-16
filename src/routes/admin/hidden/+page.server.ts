import {
	listHiddenSeries,
	listHiddenIssues,
	setSeriesHidden,
	setIssueHidden
} from '$lib/server/cms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { series: listHiddenSeries(), issues: listHiddenIssues() };
};

export const actions: Actions = {
	showSeries: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (Number.isInteger(id)) setSeriesHidden(id, false);
		return { done: true };
	},

	showIssue: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (Number.isInteger(id)) setIssueHidden(id, false);
		return { done: true };
	}
};

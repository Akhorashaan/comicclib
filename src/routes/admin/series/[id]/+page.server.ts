import { error, fail } from '@sveltejs/kit';
import { getSeriesDetailById } from '$lib/server/queries';
import {
	updateSeries,
	nameOptions,
	addIssue,
	updateIssue,
	deleteIssue
} from '$lib/server/cms';
import { parseSeriesForm, parseIssueForm } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

function requireId(params: { id: string }): number {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'Bad id');
	return id;
}

export const load: PageServerLoad = ({ params }) => {
	const id = requireId(params);
	const series = getSeriesDetailById(id);
	if (!series) throw error(404, 'Серия не найдена');
	return { series, ...nameOptions() };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = requireId(params);
		const input = await parseSeriesForm(await request.formData());
		if (!input.title) return fail(400, { error: 'Укажите название.' });
		updateSeries(id, input);
		return { saved: true };
	},

	addIssue: async ({ request, params }) => {
		const id = requireId(params);
		const input = parseIssueForm(await request.formData());
		if (!input.number || !input.downloadUrl) {
			return fail(400, { issueError: 'Нужны номер выпуска и ссылка на скачивание.' });
		}
		addIssue(id, input);
		return { issueSaved: true };
	},

	updateIssue: async ({ request }) => {
		const data = await request.formData();
		const issueId = Number(data.get('issueId'));
		if (!Number.isInteger(issueId)) return fail(400, { issueError: 'Bad issue id' });
		const input = parseIssueForm(data);
		if (!input.number || !input.downloadUrl) {
			return fail(400, { issueError: 'Нужны номер выпуска и ссылка.' });
		}
		updateIssue(issueId, input);
		return { issueSaved: true };
	},

	deleteIssue: async ({ request }) => {
		const data = await request.formData();
		const issueId = Number(data.get('issueId'));
		if (Number.isInteger(issueId)) deleteIssue(issueId);
		return { issueDeleted: true };
	}
};

import { error, fail } from '@sveltejs/kit';
import { getSeriesDetailById } from '$lib/server/queries';
import {
	updateSeries,
	nameOptions,
	addIssue,
	updateIssue,
	deleteIssue,
	setSeriesHidden,
	setIssueHidden
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

function validateIssue(input: { kind: string; number: string; downloadUrl: string }): string | null {
	if (!input.downloadUrl) return 'Нужна ссылка на скачивание.';
	if (input.kind !== 'oneshot' && !input.number) return 'Нужен номер релиза.';
	return null;
}

export const actions: Actions = {
	saveSeries: async ({ request, params }) => {
		const id = requireId(params);
		const input = await parseSeriesForm(await request.formData());
		if (!input.title) return fail(400, { error: 'Укажите название.' });
		updateSeries(id, input);
		return { saved: true };
	},

	addIssue: async ({ request, params }) => {
		const id = requireId(params);
		const input = await parseIssueForm(await request.formData());
		const err = validateIssue(input);
		if (err) return fail(400, { issueError: err });
		addIssue(id, input);
		return { issueSaved: true };
	},

	updateIssue: async ({ request }) => {
		const data = await request.formData();
		const issueId = Number(data.get('issueId'));
		if (!Number.isInteger(issueId)) return fail(400, { issueError: 'Bad issue id' });
		const input = await parseIssueForm(data);
		const err = validateIssue(input);
		if (err) return fail(400, { issueError: err });
		updateIssue(issueId, input);
		return { issueSaved: true };
	},

	deleteIssue: async ({ request }) => {
		const data = await request.formData();
		const issueId = Number(data.get('issueId'));
		if (Number.isInteger(issueId)) deleteIssue(issueId);
		return { issueDeleted: true };
	},

	toggleSeriesHidden: async ({ request, params }) => {
		const id = requireId(params);
		const data = await request.formData();
		setSeriesHidden(id, data.get('hidden') === '1');
		return { saved: true };
	},

	toggleIssueHidden: async ({ request }) => {
		const data = await request.formData();
		const issueId = Number(data.get('issueId'));
		if (Number.isInteger(issueId)) setIssueHidden(issueId, data.get('hidden') === '1');
		return { issueSaved: true };
	}
};

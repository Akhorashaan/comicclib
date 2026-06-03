import { fail } from '@sveltejs/kit';
import { listTaxonomy, renameTaxonomy, deleteTaxonomy } from '$lib/server/cms';
import type { Actions, PageServerLoad } from './$types';

const TABLES = ['publishers', 'universes', 'authors'] as const;
type Table = (typeof TABLES)[number];

function asTable(v: FormDataEntryValue | null): Table | null {
	return TABLES.includes(v as Table) ? (v as Table) : null;
}

export const load: PageServerLoad = () => ({
	publishers: listTaxonomy('publishers'),
	universes: listTaxonomy('universes'),
	authors: listTaxonomy('authors')
});

export const actions: Actions = {
	rename: async ({ request }) => {
		const data = await request.formData();
		const table = asTable(data.get('table'));
		const id = Number(data.get('id'));
		const name = String(data.get('name') ?? '').trim();
		if (!table || !Number.isInteger(id) || !name) return fail(400, { error: 'Некорректные данные.' });
		renameTaxonomy(table, id, name);
		return { ok: true };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const table = asTable(data.get('table'));
		const id = Number(data.get('id'));
		if (!table || !Number.isInteger(id)) return fail(400, { error: 'Некорректные данные.' });
		deleteTaxonomy(table, id);
		return { ok: true };
	}
};

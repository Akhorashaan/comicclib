import { saveCover } from './images';
import {
	STATUSES,
	AUTHOR_ROLES,
	RELEASE_KINDS,
	type Status,
	type AuthorRole,
	type ReleaseKind
} from '$lib/constants';
import type { SeriesInput, IssueInput } from './cms';

function asStatus(v: FormDataEntryValue | null): Status {
	const s = String(v ?? '');
	return (STATUSES as readonly string[]).includes(s) ? (s as Status) : 'ongoing';
}

function asRole(v: string): AuthorRole {
	return (AUTHOR_ROLES as readonly string[]).includes(v) ? (v as AuthorRole) : 'writer';
}

/** Parse the series create/edit form into a SeriesInput, saving the cover if uploaded. */
export async function parseSeriesForm(data: FormData): Promise<SeriesInput> {
	const names = data.getAll('authorName').map(String);
	const roles = data.getAll('authorRole').map(String);
	const authors = names
		.map((name, i) => ({ name: name.trim(), role: asRole(roles[i] ?? 'writer') }))
		.filter((a) => a.name);

	const yearRaw = String(data.get('year') ?? '').trim();
	const year = yearRaw ? Number(yearRaw) : null;

	// Cover: a new upload overrides; "removeCover" clears; otherwise keep (undefined).
	let coverPath: string | null | undefined = undefined;
	const file = data.get('cover');
	if (file instanceof File && file.size > 0) {
		coverPath = await saveCover(Buffer.from(await file.arrayBuffer()));
	} else if (data.get('removeCover')) {
		coverPath = null;
	}

	return {
		title: String(data.get('title') ?? '').trim(),
		titleOriginal: String(data.get('titleOriginal') ?? '').trim(),
		description: String(data.get('description') ?? '').trim(),
		status: asStatus(data.get('status')),
		year: Number.isFinite(year) ? year : null,
		publisherName: String(data.get('publisher') ?? '').trim() || null,
		universeName: String(data.get('universe') ?? '').trim() || null,
		coverPath,
		authors
	};
}

function asKind(v: FormDataEntryValue | null): ReleaseKind {
	const s = String(v ?? '');
	return (RELEASE_KINDS as readonly string[]).includes(s) ? (s as ReleaseKind) : 'issue';
}

export async function parseIssueForm(data: FormData): Promise<IssueInput> {
	// Cover: a new upload overrides; "removeCover" clears; otherwise keep (undefined).
	let coverPath: string | null | undefined = undefined;
	const file = data.get('cover');
	if (file instanceof File && file.size > 0) {
		coverPath = await saveCover(Buffer.from(await file.arrayBuffer()));
	} else if (data.get('removeCover')) {
		coverPath = null;
	}

	return {
		kind: asKind(data.get('kind')),
		number: String(data.get('number') ?? '').trim(),
		title: String(data.get('title') ?? '').trim(),
		collects: String(data.get('collects') ?? '').trim() || null,
		coverPath,
		downloadUrl: String(data.get('downloadUrl') ?? '').trim()
	};
}

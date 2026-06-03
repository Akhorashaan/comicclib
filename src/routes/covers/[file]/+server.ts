import { error } from '@sveltejs/kit';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { COVERS_DIR } from '$lib/server/paths';
import type { RequestHandler } from './$types';

// Our stored covers are always `<hex>.webp`. Reject anything else (path traversal etc.).
const VALID = /^[a-f0-9]{8,}\.webp$/;

export const GET: RequestHandler = async ({ params, request, setHeaders }) => {
	const file = params.file;
	if (!VALID.test(file)) throw error(404, 'Not found');

	const path = join(COVERS_DIR, file);
	let info;
	try {
		info = await stat(path);
	} catch {
		throw error(404, 'Not found');
	}

	const etag = `"${info.size}-${Math.round(info.mtimeMs)}"`;
	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304, headers: { etag } });
	}

	const body = await readFile(path);
	setHeaders({
		'content-type': 'image/webp',
		// Filenames are content-unique, so we can cache aggressively.
		'cache-control': 'public, max-age=31536000, immutable',
		etag
	});
	return new Response(body);
};

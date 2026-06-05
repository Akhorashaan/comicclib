import { error, json } from '@sveltejs/kit';
import { addComment, MAX_BODY, MAX_AUTHOR } from '$lib/server/comments';
import { checkComment, recordComment } from '$lib/server/comment-throttle';
import { visitorId } from '$lib/server/analytics';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const seriesId = Number(params.id);
	if (!Number.isInteger(seriesId)) throw error(400, 'Bad series id');

	let ip = 'unknown';
	try {
		ip = getClientAddress();
	} catch {
		ip = 'unknown';
	}

	const gate = checkComment(ip);
	if (!gate.allowed) {
		throw error(429, `Слишком часто. Подождите ${gate.retryAfterSec} с.`);
	}

	let payload: { author?: unknown; body?: unknown };
	try {
		payload = await request.json();
	} catch {
		throw error(400, 'Некорректный запрос');
	}

	const author = typeof payload.author === 'string' ? payload.author : '';
	const body = typeof payload.body === 'string' ? payload.body : '';
	if (!body.trim()) throw error(400, 'Комментарий пуст');
	if (body.length > MAX_BODY + 100 || author.length > MAX_AUTHOR + 100) {
		throw error(400, 'Слишком длинно');
	}

	const comment = addComment({
		seriesId,
		author,
		body,
		visitor: visitorId(ip, request.headers.get('user-agent'))
	});
	if (!comment) throw error(404, 'Серия не найдена');

	recordComment(ip);
	return json({ comment }, { status: 201 });
};

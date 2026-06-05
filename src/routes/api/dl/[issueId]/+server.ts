import { error, redirect } from '@sveltejs/kit';
import { logEvent, visitorId, isExcludedIp } from '$lib/server/analytics';
import { getIssueDownload } from '$lib/server/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request, getClientAddress, locals }) => {
	const issueId = Number(params.issueId);
	if (!Number.isInteger(issueId)) throw error(400, 'Bad issue id');

	const issue = getIssueDownload(issueId);
	if (!issue) throw error(404, 'Not found');

	let ip: string | null = null;
	try {
		ip = getClientAddress();
	} catch {
		ip = null;
	}
	// Don't count the owner's own clicks (logged-in admin or an excluded IP).
	if (!locals.isAdmin && !isExcludedIp(ip)) {
		logEvent('download_click', {
			seriesId: issue.seriesId,
			issueId,
			visitor: visitorId(ip, request.headers.get('user-agent')),
			referrer: request.headers.get('referer')
		});
	}

	// Normalize so non-ASCII URLs (Cyrillic paths, etc.) are percent-encoded for the Location header.
	let location = issue.url;
	try {
		location = new URL(issue.url).href;
	} catch {
		location = encodeURI(issue.url);
	}
	throw redirect(302, location);
};

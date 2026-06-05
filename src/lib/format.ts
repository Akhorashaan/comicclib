/** Public URL for a stored cover filename. */
export function coverUrl(path: string | null | undefined): string | null {
	return path ? `/covers/${path}` : null;
}

/** Human-readable file size. */
export function formatSize(bytes: number | null | undefined): string {
	if (!bytes || bytes <= 0) return '';
	const units = ['Б', 'КБ', 'МБ', 'ГБ'];
	let n = bytes;
	let i = 0;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Format a stored UTC timestamp ("YYYY-MM-DD HH:MM:SS") as "DD.MM.YYYY HH:MM". */
export function formatDateTime(s: string | null | undefined): string {
	const m = s?.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
	return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : (s ?? '');
}

/** Compact number, e.g. 1.2k. */
export function compact(n: number): string {
	if (n < 1000) return String(n);
	if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
	return `${(n / 1_000_000).toFixed(1)}M`;
}

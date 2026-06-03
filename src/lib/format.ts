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

/** Compact number, e.g. 1.2k. */
export function compact(n: number): string {
	if (n < 1000) return String(n);
	if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
	return `${(n / 1_000_000).toFixed(1)}M`;
}

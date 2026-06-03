export const STATUSES = ['ongoing', 'completed', 'hiatus', 'cancelled', 'announced'] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
	ongoing: 'Выходит',
	completed: 'Завершён',
	hiatus: 'Пауза',
	cancelled: 'Отменён',
	announced: 'Анонс'
};

/** Tailwind classes for the status badge, by status. */
export const STATUS_STYLES: Record<Status, string> = {
	ongoing: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
	completed: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
	hiatus: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
	cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
	announced: 'bg-violet-500/15 text-violet-300 border-violet-500/30'
};

export const AUTHOR_ROLES = ['writer', 'artist', 'colorist', 'cover', 'inker', 'letterer'] as const;
export type AuthorRole = (typeof AUTHOR_ROLES)[number];

export const ROLE_LABELS: Record<AuthorRole, string> = {
	writer: 'Сценарист',
	artist: 'Художник',
	colorist: 'Колорист',
	cover: 'Обложка',
	inker: 'Контуровка',
	letterer: 'Леттеринг'
};

export const RELEASE_KINDS = ['issue', 'volume'] as const;
export type ReleaseKind = (typeof RELEASE_KINDS)[number];

export const RELEASE_KIND_LABELS: Record<ReleaseKind, string> = {
	issue: 'Выпуск',
	volume: 'Том'
};

export const PAGE_SIZE = 24;

export const SORTS = ['recent', 'popular', 'title', 'year'] as const;
export type Sort = (typeof SORTS)[number];

export const SORT_LABELS: Record<Sort, string> = {
	recent: 'Сначала новые',
	popular: 'Популярные',
	title: 'По названию',
	year: 'По году'
};

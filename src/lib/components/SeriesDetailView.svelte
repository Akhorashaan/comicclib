<script lang="ts">
	import type { SeriesDetail } from '$lib/server/queries';
	import { ROLE_LABELS } from '$lib/constants';
	import { compact } from '$lib/format';
	import LazyImg from './LazyImg.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let { series }: { series: SeriesDetail } = $props();

	const singles = $derived(series.issues.filter((i) => i.kind === 'issue'));
	const volumes = $derived(series.issues.filter((i) => i.kind === 'volume'));
	const oneshots = $derived(series.issues.filter((i) => i.kind === 'oneshot'));

	let copied = $state(false);

	async function copyLink() {
		const url = `${location.origin}/series/${series.slug}`;
		let ok = false;
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(url);
				ok = true;
			}
		} catch {
			ok = false;
		}
		if (!ok) {
			// Fallback for non-secure contexts (plain HTTP deployments).
			const ta = document.createElement('textarea');
			ta.value = url;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			try {
				ok = document.execCommand('copy');
			} catch {
				ok = false;
			}
			document.body.removeChild(ta);
		}
		if (ok) {
			copied = true;
			setTimeout(() => (copied = false), 1500);
		}
	}
</script>

{#snippet releaseTile(issue: SeriesDetail['issues'][number])}
	{@const label =
		issue.kind === 'volume'
			? `Том ${issue.number}`
			: issue.kind === 'oneshot'
				? 'Ваншот'
				: `#${issue.number}`}
	<a
		href="/api/dl/{issue.id}"
		rel="nofollow noopener"
		data-sveltekit-reload
		class="group block"
		title="Скачать — {label}"
	>
		<div class="relative aspect-[2/3] overflow-hidden rounded-lg border border-surface-border bg-surface-raised">
			<LazyImg path={issue.coverPath} alt={label} class="transition duration-300 group-hover:scale-[1.04]" />
			<div class="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-slate-100 backdrop-blur">
				{label}
			</div>
			<div class="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
				<span class="rounded-md bg-indigo-600/90 px-2.5 py-1 text-xs font-medium text-white">⬇ Скачать</span>
			</div>
		</div>
		{#if issue.title}
			<div class="mt-1 truncate text-center text-xs text-slate-300" title={issue.title}>{issue.title}</div>
		{/if}
		{#if issue.kind === 'volume' && issue.collects}
			<div class="truncate text-center text-[11px] text-slate-500">{issue.collects}</div>
		{/if}
	</a>
{/snippet}

{#snippet releaseGallery(items: SeriesDetail['issues'])}
	<div class="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
		{#each items as issue (issue.id)}{@render releaseTile(issue)}{/each}
	</div>
{/snippet}

<article class="grid gap-6 md:grid-cols-[220px_1fr]">
	<div class="mx-auto w-40 md:mx-0 md:w-full">
		<div class="aspect-[2/3] overflow-hidden rounded-lg border border-surface-border bg-surface-raised">
			<LazyImg path={series.coverPath} alt={series.title} />
		</div>
		<div class="mt-3 flex justify-around text-center text-xs text-slate-400">
			<div><div class="text-base font-semibold text-slate-200">{compact(series.views)}</div>просмотров</div>
			<div><div class="text-base font-semibold text-slate-200">{compact(series.downloads)}</div>скачиваний</div>
			<div><div class="text-base font-semibold text-slate-200">{series.issues.length}</div>релизов</div>
		</div>
	</div>

	<div>
		<div class="flex flex-wrap items-center gap-3 pr-10">
			<h1 class="text-2xl font-bold text-slate-50">{series.title}</h1>
			<StatusBadge status={series.status} />
			{#if series.year}<span class="text-sm text-slate-400">{series.year}</span>{/if}
			<button
				type="button"
				onclick={copyLink}
				class="inline-flex items-center gap-1 rounded-md border border-surface-border px-2 py-1 text-xs text-slate-300 hover:border-indigo-400 hover:text-indigo-300"
				title="Скопировать прямую ссылку на страницу серии"
			>
				{copied ? '✓ Скопировано' : '🔗 Ссылка'}
			</button>
		</div>
		{#if series.titleOriginal}
			<p class="mt-0.5 text-base italic text-slate-400">{series.titleOriginal}</p>
		{/if}

		<div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
			{#if series.publisher}
				<span class="text-slate-500">Издательство:</span>
				<a class="chip border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20" href="/?publisher={series.publisher.slug}">
					{series.publisher.name}
				</a>
			{/if}
			{#if series.universe}
				<span class="text-slate-500">Вселенная:</span>
				<a class="chip border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20" href="/?universe={series.universe.slug}">
					🌐 {series.universe.name}
				</a>
			{/if}
		</div>

		{#if series.authors.length}
			<div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
				<span class="text-slate-500">Авторы:</span>
				{#each series.authors as a}
					<a class="chip border-surface-border hover:border-indigo-400 hover:text-indigo-300" href="/?author={a.slug}" title={ROLE_LABELS[a.role] ?? a.role}>
						{a.name}<span class="ml-1 text-slate-500">· {ROLE_LABELS[a.role] ?? a.role}</span>
					</a>
				{/each}
			</div>
		{/if}

		{#if series.description}
			<p class="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-300">{series.description}</p>
		{/if}

		{#if volumes.length}
			<h2 class="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
				Тома ({volumes.length})
			</h2>
			{@render releaseGallery(volumes)}
		{/if}

		{#if singles.length}
			<h2 class="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
				Выпуски ({singles.length})
			</h2>
			{@render releaseGallery(singles)}
		{/if}

		{#if oneshots.length}
			<h2 class="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
				{oneshots.length > 1 ? `Ваншоты (${oneshots.length})` : 'Ваншот'}
			</h2>
			{@render releaseGallery(oneshots)}
		{/if}

		{#if !series.issues.length}
			<h2 class="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Релизы</h2>
			<p class="mt-2 text-sm text-slate-500">Релизы ещё не добавлены.</p>
		{/if}
	</div>
</article>

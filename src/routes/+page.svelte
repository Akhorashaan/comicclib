<script lang="ts">
	import { goto, preloadData, pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import SeriesCard from '$lib/components/SeriesCard.svelte';
	import Filters from '$lib/components/Filters.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SeriesDetailView from '$lib/components/SeriesDetailView.svelte';
	import LazyImg from '$lib/components/LazyImg.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Shallow routing: open the detail route as a modal over the dashboard.
	async function pick(slug: string) {
		const href = `/series/${slug}`;
		const result = await preloadData(href);
		if (result.type === 'loaded' && result.status === 200) {
			pushState(href, { selected: result.data.series });
		} else {
			goto(href);
		}
	}

	function close() {
		history.back();
	}

	const selected = $derived($page.state.selected);
</script>

<svelte:head>
	<title>Лонгбокс — каталог комиксов</title>
</svelte:head>

{#if data.recentReleases.length}
	<section class="mb-6">
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Свежие релизы</h2>
		<div class="flex gap-3 overflow-x-auto pb-2">
			{#each data.recentReleases as r, i (i)}
				{@const caption =
					r.kind === 'volume'
						? `Том ${r.number}`
						: r.kind === 'oneshot'
							? r.seriesTitle
							: `Вып. ${r.number}`}
				<a href="/series/{r.seriesSlug}" class="group w-24 shrink-0 sm:w-28" title={r.seriesTitle}>
					<div class="aspect-[2/3] overflow-hidden rounded-lg border border-surface-border bg-surface-raised">
						<LazyImg path={r.coverPath} alt={r.seriesTitle} class="transition duration-300 group-hover:scale-[1.04]" />
					</div>
					<div class="mt-1 truncate text-center text-xs text-slate-400 group-hover:text-indigo-300">{caption}</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

<section class="space-y-4">
	<Filters options={data.filters} />

	<p class="text-sm text-slate-500">Найдено серий: {data.total}</p>

	{#if data.items.length}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
			{#each data.items as series (series.id)}
				<SeriesCard {series} onpick={pick} />
			{/each}
		</div>

		<Pagination page={data.page} pageCount={data.pageCount} />
	{:else}
		<div class="rounded-lg border border-dashed border-surface-border py-16 text-center text-slate-500">
			Ничего не найдено. Попробуйте изменить фильтры.
		</div>
	{/if}
</section>

{#if selected}
	<Modal onclose={close}>
		<SeriesDetailView series={selected} />
	</Modal>
{/if}

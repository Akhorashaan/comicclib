<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { STATUSES, STATUS_LABELS, SORTS, SORT_LABELS } from '$lib/constants';
	import type { FilterOptions } from '$lib/server/queries';

	let { options }: { options: FilterOptions } = $props();

	const params = $derived($page.url.searchParams);
	let searchValue = $state('');
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	// Keep the input in sync when the URL changes (e.g. back button, clear).
	$effect(() => {
		searchValue = params.get('q') ?? '';
	});

	function navigate(next: URLSearchParams) {
		next.delete('page'); // any filter change returns to page 1
		const qs = next.toString();
		goto(qs ? `/?${qs}` : '/', { keepFocus: true, noScroll: true, replaceState: true });
	}

	function setParam(key: string, value: string) {
		const next = new URLSearchParams(params);
		if (value) next.set(key, value);
		else next.delete(key);
		navigate(next);
	}

	function onSearch(e: Event) {
		const value = (e.currentTarget as HTMLInputElement).value;
		searchValue = value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => setParam('q', value.trim()), 300);
	}

	const activeCount = $derived(
		['q', 'publisher', 'universe', 'status', 'author'].filter((k) => params.get(k)).length
	);
</script>

<div class="flex flex-wrap items-end gap-3">
	<div class="min-w-[200px] flex-1">
		<label class="mb-1 block text-xs text-slate-400" for="f-q">Поиск</label>
		<input
			id="f-q"
			class="input"
			type="search"
			placeholder="Название или описание…"
			value={searchValue}
			oninput={onSearch}
		/>
	</div>

	<div>
		<label class="mb-1 block text-xs text-slate-400" for="f-pub">Издательство</label>
		<select id="f-pub" class="input min-w-[150px]" value={params.get('publisher') ?? ''} onchange={(e) => setParam('publisher', e.currentTarget.value)}>
			<option value="">Все</option>
			{#each options.publishers as p}
				<option value={p.slug}>{p.name}</option>
			{/each}
		</select>
	</div>

	<div>
		<label class="mb-1 block text-xs text-slate-400" for="f-status">Статус</label>
		<select id="f-status" class="input min-w-[130px]" value={params.get('status') ?? ''} onchange={(e) => setParam('status', e.currentTarget.value)}>
			<option value="">Любой</option>
			{#each STATUSES as s}
				<option value={s}>{STATUS_LABELS[s]}</option>
			{/each}
		</select>
	</div>

	<div>
		<label class="mb-1 block text-xs text-slate-400" for="f-sort">Сортировка</label>
		<select id="f-sort" class="input min-w-[150px]" value={params.get('sort') ?? 'recent'} onchange={(e) => setParam('sort', e.currentTarget.value === 'recent' ? '' : e.currentTarget.value)}>
			{#each SORTS as s}
				<option value={s}>{SORT_LABELS[s]}</option>
			{/each}
		</select>
	</div>

	{#if activeCount > 0}
		<button class="btn-ghost" onclick={() => navigate(new URLSearchParams())}>
			Сбросить ({activeCount})
		</button>
	{/if}
</div>

<!-- Контекстные фильтры: появляются только когда выбраны через карточку серии. -->
{#if params.get('universe') || params.get('author')}
	<div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
		{#if params.get('universe')}
			<span>Вселенная:</span>
			<span class="chip border-violet-500/40 bg-violet-500/10 text-violet-300">
				🌐 {options.universes.find((u) => u.slug === params.get('universe'))?.name ?? params.get('universe')}
				<button class="ml-1 text-slate-400 hover:text-white" onclick={() => setParam('universe', '')}>✕</button>
			</span>
		{/if}
		{#if params.get('author')}
			<span>Автор:</span>
			<span class="chip border-indigo-500/40 bg-indigo-500/10 text-indigo-300">
				{options.authors.find((a) => a.slug === params.get('author'))?.name ?? params.get('author')}
				<button class="ml-1 text-slate-400 hover:text-white" onclick={() => setParam('author', '')}>✕</button>
			</span>
		{/if}
	</div>
{/if}

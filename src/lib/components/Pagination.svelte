<script lang="ts">
	import { page as pageStore } from '$app/stores';

	let { page, pageCount }: { page: number; pageCount: number } = $props();

	function hrefFor(p: number): string {
		const next = new URLSearchParams($pageStore.url.searchParams);
		if (p <= 1) next.delete('page');
		else next.set('page', String(p));
		const qs = next.toString();
		return qs ? `/?${qs}` : '/';
	}

	// Compact window of page numbers around the current page.
	const pages = $derived.by(() => {
		const span = 2;
		const out: number[] = [];
		for (let p = Math.max(1, page - span); p <= Math.min(pageCount, page + span); p++) out.push(p);
		return out;
	});
</script>

{#if pageCount > 1}
	<nav class="mt-8 flex items-center justify-center gap-1" aria-label="Пагинация">
		{#if page > 1}
			<a class="btn-ghost" href={hrefFor(page - 1)} data-sveltekit-noscroll>← Назад</a>
		{/if}

		{#if pages[0] > 1}
			<a class="btn-ghost" href={hrefFor(1)} data-sveltekit-noscroll>1</a>
			{#if pages[0] > 2}<span class="px-1 text-slate-600">…</span>{/if}
		{/if}

		{#each pages as p}
			<a
				class="btn {p === page ? 'btn-primary' : 'btn-ghost'}"
				href={hrefFor(p)}
				aria-current={p === page ? 'page' : undefined}
				data-sveltekit-noscroll
			>
				{p}
			</a>
		{/each}

		{#if pages[pages.length - 1] < pageCount}
			{#if pages[pages.length - 1] < pageCount - 1}<span class="px-1 text-slate-600">…</span>{/if}
			<a class="btn-ghost" href={hrefFor(pageCount)} data-sveltekit-noscroll>{pageCount}</a>
		{/if}

		{#if page < pageCount}
			<a class="btn-ghost" href={hrefFor(page + 1)} data-sveltekit-noscroll>Вперёд →</a>
		{/if}
	</nav>
{/if}

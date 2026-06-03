<script lang="ts">
	import AdminSeriesForm from '$lib/components/AdminSeriesForm.svelte';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>CMS — Новая серия</title></svelte:head>

<a href="/admin/series" class="mb-4 inline-flex text-sm text-slate-400 hover:text-slate-200">← К списку</a>
<h1 class="mb-4 text-xl font-bold text-slate-100">Новая серия</h1>

<AdminSeriesForm
	publishers={data.publishers}
	universeOptions={data.universes}
	authorOptions={data.authors}
	error={form?.error ?? null}
/>

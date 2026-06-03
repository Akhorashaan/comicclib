<script lang="ts">
	import type { DayPoint } from '$lib/server/analytics';

	let { data }: { data: DayPoint[] } = $props();

	const W = 100;
	const H = 38;
	const max = $derived(Math.max(1, ...data.map((d) => Math.max(d.views, d.downloads))));

	function points(key: 'views' | 'downloads'): string {
		const n = data.length;
		if (n === 0) return '';
		return data
			.map((d, i) => {
				const x = n === 1 ? W / 2 : (i / (n - 1)) * W;
				const y = H - (d[key] / max) * (H - 2);
				return `${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ');
	}

	const totalViews = $derived(data.reduce((s, d) => s + d.views, 0));
	const totalDl = $derived(data.reduce((s, d) => s + d.downloads, 0));
</script>

<div class="rounded-lg border border-surface-border bg-surface-raised p-4">
	<div class="mb-2 flex items-center gap-4 text-xs">
		<span class="flex items-center gap-1.5"><span class="inline-block h-2 w-2 rounded-full bg-indigo-400"></span>Просмотры ({totalViews})</span>
		<span class="flex items-center gap-1.5"><span class="inline-block h-2 w-2 rounded-full bg-sky-400"></span>Скачивания ({totalDl})</span>
		<span class="ml-auto text-slate-500">макс/день: {max}</span>
	</div>
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="h-40 w-full">
		<polyline fill="none" stroke="#818cf8" stroke-width="0.6" points={points('views')} vector-effect="non-scaling-stroke" />
		<polyline fill="none" stroke="#38bdf8" stroke-width="0.6" points={points('downloads')} vector-effect="non-scaling-stroke" />
	</svg>
	<div class="mt-1 flex justify-between text-[10px] text-slate-600">
		<span>{data[0]?.day ?? ''}</span>
		<span>{data[data.length - 1]?.day ?? ''}</span>
	</div>
</div>

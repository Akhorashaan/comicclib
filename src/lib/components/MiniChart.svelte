<script lang="ts">
	import { compact } from '$lib/format';
	import type { DayPoint } from '$lib/server/analytics';

	let {
		data,
		metric,
		label,
		color
	}: {
		data: DayPoint[];
		metric: 'views' | 'uniques' | 'downloads';
		label: string;
		color: string;
	} = $props();

	const W = 100;
	const H = 40;

	const rawMax = $derived(Math.max(0, ...data.map((d) => d[metric])));

	// «Круглый» потолок оси, чтобы подписи делений были читаемыми числами.
	function niceMax(v: number): number {
		if (v <= 0) return 1;
		const pow = Math.pow(10, Math.floor(Math.log10(v)));
		const n = v / pow;
		const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
		return step * pow;
	}
	const top = $derived(niceMax(rawMax));
	const ticks = $derived([1, 0.75, 0.5, 0.25, 0].map((frac) => ({ frac, value: Math.round(top * frac) })));

	const total = $derived(data.reduce((s, d) => s + d[metric], 0));

	const linePts = $derived.by(() => {
		const n = data.length;
		if (n === 0) return '';
		return data
			.map((d, i) => {
				const x = n === 1 ? W / 2 : (i / (n - 1)) * W;
				const y = H - (d[metric] / top) * H;
				return `${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ');
	});
	const areaPts = $derived(linePts ? `0,${H} ${linePts} ${W},${H}` : '');

	const fmtDay = (d?: string) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}` : '');
	const xLabels = $derived(
		[data[0]?.day, data[Math.floor((data.length - 1) / 2)]?.day, data[data.length - 1]?.day].map(fmtDay)
	);
</script>

<div class="rounded-lg border border-surface-border bg-surface-raised p-4">
	<div class="mb-3 flex items-baseline justify-between">
		<span class="flex items-center gap-1.5 text-sm font-medium text-slate-200">
			<span class="inline-block h-2.5 w-2.5 rounded-full" style="background:{color}"></span>{label}
		</span>
		<span class="text-xs text-slate-500">всего: <b class="text-slate-300">{compact(total)}</b></span>
	</div>

	<div class="flex gap-2">
		<!-- Ось Y -->
		<div class="relative h-40 w-8 shrink-0 text-right text-[10px] text-slate-500">
			{#each ticks as t}
				<span class="absolute right-0 -translate-y-1/2" style="top:{(1 - t.frac) * 100}%">{compact(t.value)}</span>
			{/each}
		</div>
		<!-- Область графика -->
		<div class="relative h-40 flex-1">
			<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="h-full w-full overflow-visible">
				{#each ticks as t}
					{@const y = H - t.frac * H}
					<line x1="0" x2={W} y1={y} y2={y} stroke="#1e293b" stroke-width="0.4" vector-effect="non-scaling-stroke" />
				{/each}
				{#if areaPts}
					<polygon fill={color} fill-opacity="0.1" stroke="none" points={areaPts} />
				{/if}
				<polyline fill="none" stroke={color} stroke-width="0.8" points={linePts} vector-effect="non-scaling-stroke" />
			</svg>
		</div>
	</div>

	<!-- Ось X -->
	<div class="mt-1 flex justify-between pl-10 text-[10px] text-slate-600">
		{#each xLabels as x}<span>{x}</span>{/each}
	</div>
</div>

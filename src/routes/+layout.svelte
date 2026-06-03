<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="mx-auto flex min-h-screen max-w-7xl flex-col px-4">
	<header class="flex items-center justify-between py-4">
		<a href="/" class="flex items-center gap-2 text-lg font-bold text-slate-100">
			<span class="text-indigo-400">◧</span> Лонгбокс
		</a>
	</header>

	<main class="flex-1 pb-12">
		{@render children()}
	</main>

	<footer class="border-t border-surface-border py-4 text-center text-xs text-slate-600">
		Лонгбокс · каталог комиксов
	</footer>
</div>

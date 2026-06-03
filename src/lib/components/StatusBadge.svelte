<script lang="ts">
	import { STATUS_LABELS, STATUS_STYLES, type Status } from '$lib/constants';
	let { status, class: klass = '' }: { status: Status; class?: string } = $props();
</script>

<span class="chip {STATUS_STYLES[status]} {klass}">{STATUS_LABELS[status]}</span>

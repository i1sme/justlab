<script lang="ts">
	import type { PeriodicElement } from '../../data/elements';
	import { shellDistribution } from '$lib/chemistry/electron-config';
	import { cpkColor, cpkTextColor } from '$lib/chemistry';

	type Props = { element: PeriodicElement };
	let { element }: Props = $props();

	const NUCLEUS_R = 22;
	const SHELL_GAP = 22;
	const SHELL_START = 38;
	const ELECTRON_R = 3;
	const PADDING = 12;

	const shells = $derived(shellDistribution(element.number));
	const maxRadius = $derived(SHELL_START + Math.max(0, shells.length - 1) * SHELL_GAP);
	const view = $derived((maxRadius + ELECTRON_R + PADDING) * 2);
	const center = $derived(view / 2);

	function indexes(n: number): number[] {
		return Array.from({ length: n }, (_, i) => i);
	}
</script>

<svg
	viewBox="0 0 {view} {view}"
	class="block h-full w-full"
	role="img"
	aria-label={`Bohr ${element.symbol}`}
>
	<!-- Кольца, электроны, подписи — одной итерацией, чтобы не плодить циклы -->
	{#each shells as count, i (i)}
		{@const radius = SHELL_START + i * SHELL_GAP}
		{@const offset = i * 0.35}
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke="currentColor"
			stroke-opacity="0.25"
			stroke-width="1"
			stroke-dasharray="3 4"
		/>
		{#each indexes(count) as j (j)}
			{@const angle = (j / count) * Math.PI * 2 + offset}
			<circle
				cx={center + radius * Math.cos(angle)}
				cy={center + radius * Math.sin(angle)}
				r={ELECTRON_R}
				fill="#3b82f6"
			/>
		{/each}
		<text
			x={center + radius + 7}
			y={center}
			font-size="10"
			fill="currentColor"
			opacity="0.55"
			dominant-baseline="middle"
		>
			{count}
		</text>
	{/each}

	<!-- Ядро поверх колец -->
	<circle
		cx={center}
		cy={center}
		r={NUCLEUS_R}
		fill={cpkColor(element.symbol)}
		stroke="currentColor"
		stroke-opacity="0.2"
	/>
	<text
		x={center}
		y={center - 2}
		text-anchor="middle"
		dominant-baseline="middle"
		font-weight="700"
		font-size="14"
		fill={cpkTextColor(element.symbol)}
	>
		{element.symbol}
	</text>
	<text
		x={center}
		y={center + 11}
		text-anchor="middle"
		dominant-baseline="middle"
		font-size="9"
		fill={cpkTextColor(element.symbol)}
		opacity="0.8"
	>
		{element.number}
	</text>
</svg>

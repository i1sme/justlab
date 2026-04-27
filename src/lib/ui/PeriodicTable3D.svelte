<script lang="ts">
	import type { PeriodicElement } from '../../data/elements';
	import { detectQuality } from '$lib/render3d/webgl-detect';
	import { t } from '$lib/i18n';

	type Handle = { setSelected(n: number | null): void; dispose(): void };

	type Props = {
		onSelect?: (el: PeriodicElement) => void;
		selectedNumber?: number | null;
	};

	let { onSelect, selectedNumber = null }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let handle: Handle | null = $state(null);
	let hovered: PeriodicElement | null = $state(null);
	let loadError: string | null = $state(null);

	// Монтирование Three.js сцены через ленивый import.
	$effect(() => {
		if (!canvasEl) return;
		const target = canvasEl;
		let cancelled = false;
		let local: Handle | null = null;

		const quality = detectQuality();

		(async () => {
			try {
				const mod = await import('$lib/render3d/periodic-table-scene');
				if (cancelled) return;
				local = mod.mountPeriodicTableScene(target, {
					onSelect: (el) => onSelect?.(el),
					onHover: (el) => {
						hovered = el;
					},
					reducedQuality: quality === 'low'
				});
				handle = local;
			} catch (err) {
				loadError = err instanceof Error ? err.message : String(err);
			}
		})();

		return () => {
			cancelled = true;
			(local ?? handle)?.dispose();
			handle = null;
		};
	});

	// Прокидываем выбор от родителя в сцену.
	$effect(() => {
		handle?.setSelected(selectedNumber);
	});
</script>

<div
	class="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-50 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
>
	<canvas bind:this={canvasEl} class="h-full w-full"></canvas>

	{#if loadError}
		<div
			class="absolute inset-0 flex items-center justify-center bg-zinc-50/95 p-4 text-center text-sm text-red-600 dark:bg-zinc-900/95"
		>
			{loadError}
		</div>
	{/if}

	{#if hovered}
		<div
			class="pointer-events-none absolute top-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-sm shadow-md backdrop-blur dark:bg-zinc-800/90"
		>
			<div class="font-bold">{hovered.symbol} · {hovered.number}</div>
			<div class="text-xs text-zinc-600 dark:text-zinc-400">
				{t(`category.${hovered.category}`)}
			</div>
		</div>
	{/if}
</div>

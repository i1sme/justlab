<script lang="ts">
	import type { PeriodicElement } from '../../data/elements';
	import type { AtomSceneHandle } from '$lib/render3d/atom-scene';
	import { shellDistribution } from '$lib/chemistry/electron-config';
	import { detectQuality } from '$lib/render3d/webgl-detect';
	import { getMotionEnabled } from '$lib/settings';

	type Props = {
		element: PeriodicElement;
		/** Bindable: родитель получает handle сцены для zoom/motion. */
		handle?: AtomSceneHandle | null;
	};
	let { element, handle = $bindable<AtomSceneHandle | null>(null) }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let loadError: string | null = $state(null);

	$effect(() => {
		if (!canvasEl) return;
		const target = canvasEl;
		const el = element;
		let cancelled = false;
		let local: AtomSceneHandle | null = null;
		const quality = detectQuality();

		(async () => {
			try {
				const mod = await import('$lib/render3d/atom-scene');
				if (cancelled) return;
				local = mod.mountAtomScene(target, {
					atomicNumber: el.number,
					symbol: el.symbol,
					shells: shellDistribution(el.number),
					reducedQuality: quality === 'low',
					motionEnabled: getMotionEnabled()
				});
				handle = local;
			} catch (err) {
				loadError = err instanceof Error ? err.message : String(err);
			}
		})();

		return () => {
			cancelled = true;
			local?.dispose();
			handle = null;
		};
	});

	$effect(() => {
		handle?.setMotion(getMotionEnabled());
	});
</script>

<div class="relative h-full w-full overflow-hidden">
	<canvas bind:this={canvasEl} class="block h-full w-full touch-none"></canvas>
	{#if loadError}
		<div
			class="absolute inset-0 flex items-center justify-center bg-zinc-100/95 p-3 text-center text-xs text-red-600 dark:bg-zinc-800/95"
		>
			{loadError}
		</div>
	{/if}
</div>

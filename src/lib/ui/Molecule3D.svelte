<script lang="ts">
	import type { MoleculeAtom, MoleculeBond } from '$lib/chemistry/openchemlib';
	import { detectQuality } from '$lib/render3d/webgl-detect';
	import { getMotionEnabled } from '$lib/settings';

	type Handle = { setMotion(enabled: boolean): void; dispose(): void };

	type Props = {
		atoms: ReadonlyArray<MoleculeAtom>;
		bonds: ReadonlyArray<MoleculeBond>;
	};

	let { atoms, bonds }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let handle: Handle | null = $state(null);
	let loadError: string | null = $state(null);

	$effect(() => {
		if (!canvasEl) return;
		const target = canvasEl;
		// Захват props в момент монтирования: при изменении molecule компонент пере-маунтится через keyed parent.
		const a = atoms;
		const b = bonds;
		let cancelled = false;
		let local: Handle | null = null;
		const quality = detectQuality();

		(async () => {
			try {
				const mod = await import('$lib/render3d/molecule-scene');
				if (cancelled) return;
				local = mod.mountMoleculeScene(target, {
					atoms: a,
					bonds: b,
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

<div
	class="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
>
	<canvas bind:this={canvasEl} class="block h-full w-full"></canvas>
	{#if loadError}
		<div
			class="absolute inset-0 flex items-center justify-center bg-zinc-100/95 p-4 text-center text-sm text-red-600 dark:bg-zinc-800/95"
		>
			{loadError}
		</div>
	{/if}
</div>

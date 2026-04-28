<script lang="ts">
	import type { MoleculeAtom, MoleculeBond } from '$lib/chemistry/openchemlib';
	import type { MoleculeSceneHandle } from '$lib/render3d/molecule-scene';
	import { detectQuality } from '$lib/render3d/webgl-detect';
	import { getMotionEnabled } from '$lib/settings';

	type Props = {
		atoms: ReadonlyArray<MoleculeAtom>;
		bonds: ReadonlyArray<MoleculeBond>;
		/** Bindable: родитель получит handle сцены и сможет звать .zoom()/.setMotion(). */
		handle?: MoleculeSceneHandle | null;
	};

	let { atoms, bonds, handle = $bindable<MoleculeSceneHandle | null>(null) }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let loadError: string | null = $state(null);

	$effect(() => {
		if (!canvasEl) return;
		const target = canvasEl;
		const a = atoms;
		const b = bonds;
		let cancelled = false;
		let local: MoleculeSceneHandle | null = null;
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

<div class="relative h-full w-full overflow-hidden">
	<canvas bind:this={canvasEl} class="block h-full w-full touch-none"></canvas>
	{#if loadError}
		<div
			class="absolute inset-0 flex items-center justify-center bg-zinc-100/95 p-4 text-center text-sm text-red-600 dark:bg-zinc-800/95"
		>
			{loadError}
		</div>
	{/if}
</div>

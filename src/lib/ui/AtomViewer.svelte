<script lang="ts">
	import type { PeriodicElement } from '../../data/elements';
	import AtomBohr2D from './AtomBohr2D.svelte';
	import AtomBohr3D from './AtomBohr3D.svelte';
	import { supportsWebGL2 } from '$lib/render3d/webgl-detect';
	import { t } from '$lib/i18n';

	type Mode = '3d' | '2d';

	type Props = { element: PeriodicElement };
	let { element }: Props = $props();

	const canUse3D = supportsWebGL2();
	let mode = $state<Mode>(canUse3D ? '3d' : '2d');
</script>

<div class="space-y-2">
	{#if canUse3D}
		<div class="flex justify-end" role="radiogroup" aria-label={t('render.label')}>
			<div class="inline-flex rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800">
				<button
					type="button"
					role="radio"
					aria-checked={mode === '3d'}
					class="rounded-md px-2 py-0.5 font-medium transition-colors"
					class:bg-white={mode === '3d'}
					class:shadow-sm={mode === '3d'}
					class:dark:bg-zinc-700={mode === '3d'}
					class:text-zinc-500={mode !== '3d'}
					class:dark:text-zinc-400={mode !== '3d'}
					onclick={() => (mode = '3d')}>{t('render.3d')}</button
				>
				<button
					type="button"
					role="radio"
					aria-checked={mode === '2d'}
					class="rounded-md px-2 py-0.5 font-medium transition-colors"
					class:bg-white={mode === '2d'}
					class:shadow-sm={mode === '2d'}
					class:dark:bg-zinc-700={mode === '2d'}
					class:text-zinc-500={mode !== '2d'}
					class:dark:text-zinc-400={mode !== '2d'}
					onclick={() => (mode = '2d')}>{t('render.2d')}</button
				>
			</div>
		</div>
	{/if}

	<!-- key по element.number — пере-маунт сцены при смене элемента (важно для 3D). -->
	{#key element.number}
		{#if mode === '3d' && canUse3D}
			<AtomBohr3D {element} />
		{:else}
			<div
				class="aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 p-2 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700"
			>
				<AtomBohr2D {element} />
			</div>
		{/if}
	{/key}
</div>

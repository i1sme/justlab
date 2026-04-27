<script lang="ts">
	import type { PeriodicElement } from '../../data/elements';
	import PeriodicTable2D from './PeriodicTable2D.svelte';
	import PeriodicTable3D from './PeriodicTable3D.svelte';
	import { supportsWebGL2 } from '$lib/render3d/webgl-detect';
	import { t } from '$lib/i18n';

	type Mode = '3d' | '2d';

	type Props = {
		onSelect?: (el: PeriodicElement) => void;
		selectedNumber?: number | null;
	};

	let { onSelect, selectedNumber = null }: Props = $props();

	// Адаптивный выбор: при отсутствии WebGL2 остаёмся в 2D без переключателя.
	const canUse3D = supportsWebGL2();
	let mode = $state<Mode>(canUse3D ? '3d' : '2d');
</script>

<div class="space-y-3">
	{#if canUse3D}
		<div class="flex justify-end" role="radiogroup" aria-label={t('render.label')}>
			<div class="inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
				<button
					type="button"
					role="radio"
					aria-checked={mode === '3d'}
					class="rounded-md px-3 py-1 font-medium transition-colors"
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
					class="rounded-md px-3 py-1 font-medium transition-colors"
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

	{#if mode === '3d'}
		<PeriodicTable3D {onSelect} {selectedNumber} />
	{:else}
		<PeriodicTable2D {onSelect} {selectedNumber} />
	{/if}
</div>

<script lang="ts">
	import { parseSmiles, type ParsedMolecule } from '$lib/chemistry/openchemlib';
	import type { MoleculeSceneHandle } from '$lib/render3d/molecule-scene';
	import { supportsWebGL2 } from '$lib/render3d/webgl-detect';
	import { t } from '$lib/i18n';
	import Molecule3D from './Molecule3D.svelte';
	import MoleculeLibrary from './MoleculeLibrary.svelte';
	import ViewerControls from './ViewerControls.svelte';

	type Mode = '3d' | '2d';

	const SVG_W = 480;
	const SVG_H = 320;
	const ZOOM_STEP = 1.2;
	const SCALE_MIN = 0.6;
	const SCALE_MAX = 2.5;

	let input = $state('CCO');
	let molecule = $state<ParsedMolecule | null>(null);
	let loading = $state(false);
	let error = $state(false);

	const canUse3D = supportsWebGL2();
	let mode = $state<Mode>(canUse3D ? '3d' : '2d');

	let collapsed = $state(false);
	let scale2D = $state(1);
	let isFullscreen = $state(false);
	let frameEl: HTMLDivElement | null = $state(null);
	let moleculeHandle = $state<MoleculeSceneHandle | null>(null);

	const canZoomIn = $derived(mode === '3d' ? !!molecule : scale2D < SCALE_MAX - 0.001);
	const canZoomOut = $derived(mode === '3d' ? !!molecule : scale2D > SCALE_MIN + 0.001);

	let lastQuery = '';
	let pendingTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const value = input;
		if (pendingTimer) clearTimeout(pendingTimer);
		pendingTimer = setTimeout(() => {
			void parse(value);
		}, 150);
		return () => {
			if (pendingTimer) clearTimeout(pendingTimer);
		};
	});

	async function parse(smiles: string): Promise<void> {
		const trimmed = smiles.trim();
		if (!trimmed) {
			molecule = null;
			error = false;
			loading = false;
			lastQuery = '';
			return;
		}
		if (trimmed === lastQuery && molecule) return;
		lastQuery = trimmed;

		loading = true;
		const result = await parseSmiles(trimmed, SVG_W, SVG_H);
		if (lastQuery !== trimmed) return;

		loading = false;
		if (result) {
			molecule = result;
			error = false;
			scale2D = 1; // новая молекула — сброс 2D-зума
		} else {
			molecule = null;
			error = true;
		}
	}

	function pickFromLibrary(smiles: string): void {
		input = smiles;
	}

	function onZoomIn(): void {
		if (mode === '3d') moleculeHandle?.zoom(ZOOM_STEP);
		else scale2D = Math.min(SCALE_MAX, scale2D * ZOOM_STEP);
	}
	function onZoomOut(): void {
		if (mode === '3d') moleculeHandle?.zoom(1 / ZOOM_STEP);
		else scale2D = Math.max(SCALE_MIN, scale2D / ZOOM_STEP);
	}

	async function toggleFullscreen(): Promise<void> {
		if (!frameEl) return;
		try {
			if (document.fullscreenElement === frameEl) {
				await document.exitFullscreen();
			} else {
				await frameEl.requestFullscreen();
			}
		} catch {
			// noop
		}
	}

	function onFullscreenChange(): void {
		isFullscreen = document.fullscreenElement === frameEl;
	}

	$effect(() => {
		document.addEventListener('fullscreenchange', onFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
	});
</script>

<section class="grid gap-4 lg:grid-cols-[1fr_360px]" aria-labelledby="molecule-viewer-title">
	<!-- Левая колонка: фрейм с тулбаром и контентом + метаданные снизу -->
	<div class="space-y-3 lg:col-start-1 lg:row-start-1">
		<div
			bind:this={frameEl}
			class="frame relative rounded-xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
		>
			{#if !collapsed}
				<div class="scene-host border-b border-zinc-200 dark:border-zinc-800">
					{#if loading && !molecule}
						<div class="grid h-full place-items-center text-sm text-zinc-500" role="status">
							{t('molecule.loading')}
						</div>
					{:else if molecule}
						{#if mode === '3d' && canUse3D}
							{#key molecule.canonicalSmiles}
								<Molecule3D
									atoms={molecule.atoms}
									bonds={molecule.bonds}
									bind:handle={moleculeHandle}
								/>
							{/key}
						{:else}
							<div class="grid h-full w-full place-items-center overflow-hidden p-4">
								<div
									class="molecule-svg transition-transform"
									style:transform="scale({scale2D})"
									style:transform-origin="center center"
								>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html molecule.svg2D}
								</div>
							</div>
						{/if}
					{:else if error}
						<div
							class="grid h-full place-items-center px-4 text-sm text-red-600 dark:text-red-400"
							role="alert"
						>
							{t('molecule.invalid')}
						</div>
					{/if}
				</div>
			{/if}

			<div class="flex items-center justify-end gap-2 p-1.5">
				{#if canUse3D && molecule}
					<div
						class="inline-flex rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800"
						role="radiogroup"
						aria-label={t('render.label')}
					>
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
				{/if}
				<ViewerControls
					{onZoomIn}
					{onZoomOut}
					onFullscreen={toggleFullscreen}
					onToggleCollapse={() => (collapsed = !collapsed)}
					{isFullscreen}
					{collapsed}
					{canZoomIn}
					{canZoomOut}
				/>
			</div>
		</div>

		{#if molecule}
			<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
				<dt class="text-zinc-600 dark:text-zinc-400">{t('molecule.formula')}</dt>
				<dd class="font-mono">{molecule.formula}</dd>
				<dt class="text-zinc-600 dark:text-zinc-400">{t('molecule.weight')}</dt>
				<dd class="font-mono">{molecule.relativeWeight.toFixed(2)}</dd>
				<dt class="text-zinc-600 dark:text-zinc-400">SMILES</dt>
				<dd class="truncate font-mono">{molecule.canonicalSmiles}</dd>
			</dl>
		{/if}
	</div>

	<!-- Правая sticky-колонка: библиотека + SMILES -->
	<aside
		class="space-y-3 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
	>
		<details
			open
			class="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800"
		>
			<summary class="cursor-pointer text-sm font-medium select-none">
				{t('molecule.library')}
			</summary>
			<div class="mt-3 max-h-[60vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-260px)]">
				<MoleculeLibrary onPick={pickFromLibrary} />
			</div>
		</details>

		<details
			class="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800"
		>
			<summary class="cursor-pointer text-sm font-medium select-none">
				{t('molecule.smiles')}
			</summary>
			<div class="mt-2">
				<input
					id="smiles-input"
					type="text"
					bind:value={input}
					placeholder={t('molecule.placeholder')}
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
				/>
			</div>
		</details>
	</aside>
</section>

<style>
	.scene-host {
		aspect-ratio: 3 / 2;
		width: 100%;
	}
	.molecule-svg :global(svg) {
		max-width: 100%;
		height: auto;
	}
	@media (prefers-color-scheme: dark) {
		.molecule-svg {
			filter: invert(1) hue-rotate(180deg);
		}
	}
	.frame:fullscreen {
		display: flex;
		flex-direction: column;
		background: var(--color-zinc-950, #09090b);
		border-radius: 0;
	}
	.frame:fullscreen .scene-host {
		flex: 1 1 0;
		min-height: 0;
		aspect-ratio: auto;
	}
</style>

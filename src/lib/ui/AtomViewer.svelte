<script lang="ts">
	import type { PeriodicElement } from '../../data/elements';
	import type { AtomSceneHandle } from '$lib/render3d/atom-scene';
	import AtomBohr2D from './AtomBohr2D.svelte';
	import AtomBohr3D from './AtomBohr3D.svelte';
	import ViewerControls from './ViewerControls.svelte';
	import { supportsWebGL2 } from '$lib/render3d/webgl-detect';
	import { getMotionEnabled } from '$lib/settings';
	import { t } from '$lib/i18n';

	type Mode = '3d' | '2d';

	type Props = { element: PeriodicElement };
	let { element }: Props = $props();

	const canUse3D = supportsWebGL2();
	let mode = $state<Mode>(canUse3D ? '3d' : '2d');
	let collapsed = $state(false);
	let scale2D = $state(1);
	let isFullscreen = $state(false);

	let frameEl: HTMLDivElement | null = $state(null);
	let atomHandle = $state<AtomSceneHandle | null>(null);

	const ZOOM_STEP = 1.2;
	const SCALE_MIN = 0.6;
	const SCALE_MAX = 2.5;

	const canZoomIn = $derived(mode === '3d' ? true : scale2D < SCALE_MAX - 0.001);
	const canZoomOut = $derived(mode === '3d' ? true : scale2D > SCALE_MIN + 0.001);

	function onZoomIn(): void {
		if (mode === '3d') atomHandle?.zoom(ZOOM_STEP);
		else scale2D = Math.min(SCALE_MAX, scale2D * ZOOM_STEP);
	}
	function onZoomOut(): void {
		if (mode === '3d') atomHandle?.zoom(1 / ZOOM_STEP);
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
			// Браузер мог заблокировать запрос (нет жеста, iframe-policy и т.п.) — молча игнорируем.
		}
	}

	function onFullscreenChange(): void {
		isFullscreen = document.fullscreenElement === frameEl;
	}

	$effect(() => {
		document.addEventListener('fullscreenchange', onFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
	});

	// Сбрасываем 2D-зум при смене элемента — новая Bohr-диаграмма стартует с 1×.
	// Чтение element.number даёт реактивную зависимость; всегда true для валидных Z.
	$effect(() => {
		if (element.number) scale2D = 1;
	});

	// Управляем motion 3D-сцены централизованно: пауза, когда 3D невидим
	// (mode 2D, collapsed) — экономим CPU. Когда виден — следуем глобальной настройке.
	$effect(() => {
		if (!atomHandle) return;
		const active3D = mode === '3d' && canUse3D && !collapsed;
		atomHandle.setMotion(active3D && getMotionEnabled());
	});
</script>

<div
	bind:this={frameEl}
	class="frame relative rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
>
	<!-- Обе сцены живут одновременно — переключение режима не уничтожает 3D-сцену
	     (зум/поворот сохраняются), а 2D-зум остаётся в scale2D. -->
	<div class="scene-host border-b border-zinc-200 dark:border-zinc-700" class:hidden={collapsed}>
		{#key element.number}
			<div class="h-full w-full" class:hidden={!(mode === '3d' && canUse3D)}>
				<AtomBohr3D {element} bind:handle={atomHandle} />
			</div>
			<div
				class="grid h-full w-full place-items-center overflow-hidden p-2 text-zinc-600 dark:text-zinc-300"
				class:hidden={mode === '3d' && canUse3D}
			>
				<div
					class="h-full w-full transition-transform"
					style:transform="scale({scale2D})"
					style:transform-origin="center center"
				>
					<AtomBohr2D {element} />
				</div>
			</div>
		{/key}
	</div>

	<div class="flex items-center justify-end gap-2 p-1.5">
		{#if canUse3D}
			<div
				class="inline-flex rounded-lg bg-white p-0.5 text-xs dark:bg-zinc-900"
				role="radiogroup"
				aria-label={t('render.label')}
			>
				<button
					type="button"
					role="radio"
					aria-checked={mode === '3d'}
					class="rounded-md px-2 py-0.5 font-medium transition-colors"
					class:bg-blue-100={mode === '3d'}
					class:dark:bg-blue-900={mode === '3d'}
					class:text-zinc-500={mode !== '3d'}
					class:dark:text-zinc-400={mode !== '3d'}
					onclick={() => (mode = '3d')}>{t('render.3d')}</button
				>
				<button
					type="button"
					role="radio"
					aria-checked={mode === '2d'}
					class="rounded-md px-2 py-0.5 font-medium transition-colors"
					class:bg-blue-100={mode === '2d'}
					class:dark:bg-blue-900={mode === '2d'}
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

<style>
	.scene-host {
		aspect-ratio: 1 / 1;
		width: 100%;
	}
	/* В fullscreen фрейм заполняет экран; контент растёт по flex. */
	.frame:fullscreen {
		display: flex;
		flex-direction: column;
		border-radius: 0;
	}
	.frame:fullscreen .scene-host {
		flex: 1 1 0;
		min-height: 0;
		aspect-ratio: auto;
	}
</style>

<script lang="ts">
	// Визуальный режим лаборатории — Three.js сцена со столом и посудой.
	// Состояние читается из общего lab-store: переключение visual ↔ formal не теряет
	// прогресс эксперимента.
	//
	// Сцена грузится через динамический import — formal-режим не платит за three.

	import type { LabSceneHandle } from '$lib/render3d/lab-scene';
	import { detectQuality, supportsWebGL2 } from '$lib/render3d/webgl-detect';
	import { getMotionEnabled } from '$lib/settings';
	import { getExperiment } from '$lib/lab';
	import { t } from '$lib/i18n';

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let loadError: string | null = $state(null);
	let webglSupported = $state(true);

	const experiment = $derived(getExperiment());

	let sceneHandle: LabSceneHandle | null = null;

	$effect(() => {
		if (typeof window === 'undefined') return;
		webglSupported = supportsWebGL2();
	});

	$effect(() => {
		if (!canvasEl || !webglSupported) return;
		const target = canvasEl;
		let cancelled = false;
		let local: LabSceneHandle | null = null;
		const quality = detectQuality();
		const initial = experiment.containers;

		(async () => {
			try {
				const mod = await import('$lib/render3d/lab-scene');
				if (cancelled) return;
				local = mod.mountLabScene(target, {
					containers: initial,
					reducedQuality: quality === 'low',
					motionEnabled: getMotionEnabled()
				});
				sceneHandle = local;
			} catch (err) {
				loadError = err instanceof Error ? err.message : String(err);
			}
		})();

		return () => {
			cancelled = true;
			local?.dispose();
			sceneHandle = null;
		};
	});

	// Реактивное обновление содержимого: меняется experiment.containers — синхронизируем сцену.
	$effect(() => {
		if (sceneHandle) sceneHandle.setContainers(experiment.containers);
	});

	// Реактивное переключение motion (анимаций).
	$effect(() => {
		if (sceneHandle) sceneHandle.setMotion(getMotionEnabled());
	});
</script>

<div class="visual-lab">
	{#if !webglSupported}
		<div class="fallback" role="status">
			<p class="text-sm text-zinc-700 dark:text-zinc-300">
				{t('lab.visual.noWebGL')}
			</p>
		</div>
	{:else}
		<canvas bind:this={canvasEl} class="lab-canvas" aria-label={t('lab.visual.canvasLabel')}
		></canvas>
		{#if loadError}
			<div class="error" role="alert">
				<p class="text-sm">{loadError}</p>
			</div>
		{/if}
		<div class="hint" aria-hidden="true">
			{t('lab.visual.dragHint')}
		</div>
	{/if}
</div>

<style>
	.visual-lab {
		position: relative;
		aspect-ratio: 16 / 10;
		min-height: 360px;
		width: 100%;
		border-radius: 1rem;
		overflow: hidden;
		background: #e8eef4;
		box-shadow:
			0 1px 0 rgba(0, 0, 0, 0.04),
			0 0 0 1px rgb(228 228 231);
	}
	@media (prefers-color-scheme: dark) {
		.visual-lab {
			box-shadow:
				0 1px 0 rgba(0, 0, 0, 0.4),
				0 0 0 1px rgb(63 63 70);
		}
	}
	.lab-canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}
	.fallback,
	.error {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 1rem;
		text-align: center;
	}
	.error {
		background: rgba(254, 226, 226, 0.95);
		color: rgb(127 29 29);
	}
	.hint {
		position: absolute;
		bottom: 0.5rem;
		left: 0.75rem;
		font-size: 0.7rem;
		color: rgba(0, 0, 0, 0.45);
		pointer-events: none;
	}
</style>

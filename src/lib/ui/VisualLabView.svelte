<script lang="ts">
	// Визуальный режим лаборатории — Three.js сцена со столом, посудой и реактивами.
	// Состояние читается из lab-store, клики из 3D пробрасываются обратно через колбэки —
	// сцена остаётся «тупой» отрисовкой без своего state.

	import type { BottleSpec, LabSceneHandle } from '$lib/render3d/lab-scene';
	import { detectQuality, supportsWebGL2 } from '$lib/render3d/webgl-detect';
	import { getMotionEnabled } from '$lib/settings';
	import {
		addSubstance,
		emptyContainer,
		getExperiment,
		getSelectedContainerId,
		heat,
		removeContainer,
		setSelectedContainerId
	} from '$lib/lab';
	import { t } from '$lib/i18n';

	// Курируемый набор «всегда видимых» реактивов в 3D — самые ходовые из инвентаря.
	// Полный список остаётся доступным через 2D-сайдбар (Inventory).
	const VISIBLE_BOTTLES: readonly BottleSpec[] = [
		{ substanceId: 'water' },
		{ substanceId: 'hydrochloric-acid' },
		{ substanceId: 'sodium-hydroxide' },
		{ substanceId: 'copper-sulfate' },
		{ substanceId: 'silver-nitrate' },
		{ substanceId: 'sodium-chloride' },
		{ substanceId: 'Zn' }
	];

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let loadError: string | null = $state(null);
	let webglSupported = $state(true);

	const experiment = $derived(getExperiment());
	const selectedId = $derived(getSelectedContainerId());
	const selectedContainer = $derived(experiment.containers.find((c) => c.id === selectedId));

	function fmtTemp(k: number): string {
		const c = k - 273.15;
		return `${Math.round(k)} K · ${Math.round(c)} °C`;
	}

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
		const initialContainers = experiment.containers;
		const initialSelected = selectedId;

		(async () => {
			try {
				const mod = await import('$lib/render3d/lab-scene');
				if (cancelled) return;
				local = mod.mountLabScene(target, {
					containers: initialContainers,
					bottles: VISIBLE_BOTTLES,
					selectedContainerId: initialSelected,
					reducedQuality: quality === 'low',
					motionEnabled: getMotionEnabled(),
					onContainerClick: (id) => {
						setSelectedContainerId(getSelectedContainerId() === id ? null : id);
					},
					onBottleClick: (substanceId) => {
						const target = getSelectedContainerId();
						if (!target) return; // молча игнорируем — UX-подсказка через рамку под выбранную колбу
						addSubstance(target, substanceId, 1);
					}
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

	// Реактивные обновления — содержимое посуды, выделение, motion.
	$effect(() => {
		if (sceneHandle) sceneHandle.setContainers(experiment.containers);
	});
	$effect(() => {
		if (sceneHandle) sceneHandle.setSelectedContainer(selectedId);
	});
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
		{#if selectedContainer}
			<!-- Контролы выбранного контейнера: оверлей справа сверху. -->
			<div class="sel-overlay">
				<div class="sel-head">
					<span class="sel-kind">
						{t(`lab.containerKind.${selectedContainer.kind}`)}
					</span>
					<span class="sel-id">{selectedContainer.id}</span>
				</div>
				<div class="sel-temp">🌡 {fmtTemp(selectedContainer.temperature)}</div>
				<div class="sel-buttons">
					<button
						type="button"
						class="sel-btn"
						aria-label={t('lab.coolStep')}
						title={t('lab.coolStep')}
						onclick={() => heat(selectedContainer.id, -25)}
					>
						−
					</button>
					<button
						type="button"
						class="sel-btn"
						aria-label={t('lab.heatStep')}
						title={t('lab.heatStep')}
						onclick={() => heat(selectedContainer.id, 25)}
					>
						+
					</button>
					<button
						type="button"
						class="sel-btn sel-btn--empty"
						aria-label={t('lab.emptyContainer')}
						title={t('lab.emptyContainer')}
						disabled={selectedContainer.contents.length === 0}
						onclick={() => emptyContainer(selectedContainer.id)}
					>
						⌫
					</button>
					<button
						type="button"
						class="sel-btn sel-btn--remove"
						aria-label={t('lab.removeContainer')}
						title={t('lab.removeContainer')}
						onclick={() => removeContainer(selectedContainer.id)}
					>
						✕
					</button>
				</div>
			</div>
		{/if}
		<div class="hint" aria-hidden="true">
			{#if !selectedId}
				{t('lab.visual.selectContainerHint')}
			{:else}
				{t('lab.visual.pourHint')}
			{/if}
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
		max-width: 80%;
		font-size: 0.75rem;
		color: rgba(0, 0, 0, 0.55);
		background: rgba(255, 255, 255, 0.7);
		padding: 0.2rem 0.5rem;
		border-radius: 0.25rem;
		pointer-events: none;
	}

	.sel-overlay {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		min-width: 9rem;
		padding: 0.5rem 0.6rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.92);
		box-shadow:
			0 1px 0 rgba(0, 0, 0, 0.04),
			0 4px 12px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	@media (prefers-color-scheme: dark) {
		.sel-overlay {
			background: rgba(24, 24, 27, 0.92);
			box-shadow:
				0 1px 0 rgba(0, 0, 0, 0.4),
				0 4px 12px rgba(0, 0, 0, 0.3);
		}
	}
	.sel-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.sel-kind {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		color: rgb(63 63 70);
	}
	.sel-id {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.65rem;
		color: rgb(161 161 170);
	}
	@media (prefers-color-scheme: dark) {
		.sel-kind {
			color: rgb(212 212 216);
		}
	}
	.sel-temp {
		font-size: 0.75rem;
		color: rgb(82 82 91);
	}
	@media (prefers-color-scheme: dark) {
		.sel-temp {
			color: rgb(212 212 216);
		}
	}
	.sel-buttons {
		display: flex;
		gap: 0.25rem;
	}
	.sel-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: rgb(82 82 91);
		background: rgb(244 244 245);
		transition: background-color 100ms ease;
	}
	.sel-btn:hover:not(:disabled) {
		background: rgb(228 228 231);
	}
	.sel-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.sel-btn--empty {
		color: rgb(220 38 38);
	}
	.sel-btn--remove {
		color: rgb(113 113 122);
	}
	@media (prefers-color-scheme: dark) {
		.sel-btn {
			color: rgb(212 212 216);
			background: rgb(39 39 42);
		}
		.sel-btn:hover:not(:disabled) {
			background: rgb(63 63 70);
		}
		.sel-btn--empty {
			color: rgb(248 113 113);
		}
		.sel-btn--remove {
			color: rgb(161 161 170);
		}
	}
</style>

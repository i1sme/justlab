<script lang="ts">
	// Визуальный режим лаборатории (2.5D). Master-detail: полка сверху + рабочая зона снизу.
	// Состояние — из $lib/lab. Компоненты «тупые»: рисуют + зовут колбэки.
	// Палитра (пастель) задаётся CSS-переменными на корне и наследуется детьми.
	// Цвета веществ при этом остаются научно достоверными (из Substance.phases[].color).

	import {
		isHeatingAction,
		targetTemperatureFor,
		type HeatingIntensity
	} from '$lib/render2d/heating-plate-logic';
	import {
		addSubstance,
		emptyContainer,
		getExperiment,
		getSelectedContainerId,
		heat,
		removeContainer,
		setSelectedContainerId
	} from '$lib/lab';
	import Shelf from './lab2d/Shelf.svelte';
	import Workspace from './lab2d/Workspace.svelte';
	import BottlePanel from './lab2d/BottlePanel.svelte';

	// Курируемый набор бутылок (как в прежней 3D-версии — ходовые реактивы).
	const BOTTLE_IDS: readonly string[] = [
		'water',
		'hydrochloric-acid',
		'sodium-hydroxide',
		'copper-sulfate',
		'silver-nitrate',
		'sodium-chloride',
		'Zn'
	];

	const experiment = $derived(getExperiment());
	const selectedId = $derived(getSelectedContainerId());
	const selected = $derived(experiment.containers.find((c) => c.id === selectedId) ?? null);

	function selectContainer(id: string): void {
		setSelectedContainerId(selectedId === id ? null : id);
	}

	function pickBottle(substanceId: string): void {
		if (!selectedId) return;
		addSubstance(selectedId, substanceId, 1);
	}

	function applyIntensity(level: HeatingIntensity): void {
		if (!selected) return;
		const action = isHeatingAction(level, selected.temperature);
		if (action === 'noop') return;
		heat(selected.id, targetTemperatureFor(level) - selected.temperature);
	}
</script>

<div class="visual-lab-v2">
	<Shelf containers={experiment.containers} {selectedId} onSelect={selectContainer} />

	<div class="lab-body">
		<BottlePanel substanceIds={BOTTLE_IDS} canPick={selectedId !== null} onPick={pickBottle} />

		<div class="lab-stage">
			<Workspace
				container={selected}
				onHeat={(d) => {
					if (selected) heat(selected.id, d);
				}}
				onIntensity={applyIntensity}
				onEmpty={() => {
					if (selected) emptyContainer(selected.id);
				}}
				onRemove={() => {
					if (selected) removeContainer(selected.id);
				}}
			/>
		</div>
	</div>
</div>

<style>
	.visual-lab-v2 {
		/* Пастельная палитра — единый источник, наследуется детьми через CSS custom properties. */
		--lab-table: #f5efe6;
		--lab-wall: #e7eef3;
		--lab-glass-stroke: #a8b8c3;
		--lab-glass-fill: rgba(220, 234, 242, 0.25);
		--lab-apparatus: #5b6b78;
		--lab-hot: #e8a87c;
		--lab-cold: #a8dadc;
		--lab-text: #3a3f4a;
		--lab-focus: #bfd7ed;

		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-radius: 1rem;
		padding: 0.75rem;
		background: var(--lab-table);
	}
	.lab-body {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: stretch;
	}
	.lab-stage {
		flex: 1 1 22rem;
		border-radius: 0.75rem;
		background: var(--lab-wall);
	}
	@media (prefers-color-scheme: dark) {
		.visual-lab-v2 {
			--lab-table: #1f242b;
			--lab-wall: #232a31;
			--lab-glass-stroke: #5b6b78;
			--lab-glass-fill: rgba(120, 150, 170, 0.18);
			--lab-text: #dce4ea;
		}
	}
</style>

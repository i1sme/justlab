<script lang="ts">
	// Плоская «нагревательная плитка»: панель НАГРЕВ + цифровой дисплей + кнопки O/I/II/III.
	// Целевые температуры и активный уровень — из чистого модуля heating-plate-logic.
	// Активная кнопка ВЫВОДИТСЯ из температуры контейнера (нет устаревшего UI-состояния).

	import type { Container } from '../../../data/types';
	import {
		INTENSITY_TARGETS,
		LEVELS,
		type HeatingIntensity
	} from '$lib/render2d/heating-plate-logic';
	import { t } from '$lib/i18n';

	type Props = {
		container: Container | null;
		onIntensity: (level: HeatingIntensity) => void;
	};
	let { container, onIntensity }: Props = $props();

	const LABELS: Record<HeatingIntensity, string> = { 0: 'O', 1: 'I', 2: 'II', 3: 'III' };

	// Активный уровень: тот, чья целевая T совпадает с текущей T контейнера (±0.5 K).
	// Если пользователь подстроил T кнопками −/+ к непресетному значению — активного нет.
	const activeLevel = $derived.by(() => {
		if (!container) return null;
		return LEVELS.find((l) => Math.abs(INTENSITY_TARGETS[l] - container.temperature) < 0.5) ?? null;
	});

	const tempText = $derived.by(() => {
		if (!container) return '—';
		const k = Math.round(container.temperature);
		const c = Math.round(container.temperature - 273.15);
		return `${k} K · ${c} °C`;
	});
</script>

<div class="plate" class:plate--disabled={!container}>
	<div class="plate-label">{t('lab.heater.label')}</div>
	<div class="plate-display" aria-live="polite">{tempText}</div>
	<div class="plate-buttons" role="group" aria-label={t('lab.heater.label')}>
		{#each LEVELS as level (level)}
			<button
				type="button"
				class="plate-btn"
				class:plate-btn--active={activeLevel === level}
				disabled={!container}
				aria-pressed={activeLevel === level}
				aria-label={`${t('lab.heater.levelPrefix')} ${LABELS[level]}`}
				onclick={() => onIntensity(level)}
			>
				{LABELS[level]}
			</button>
		{/each}
	</div>
</div>

<style>
	.plate {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--lab-apparatus, #5b6b78);
		width: 11rem;
	}
	.plate--disabled {
		opacity: 0.6;
	}
	.plate-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--lab-hot, #e8a87c);
		text-align: center;
	}
	.plate-display {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.95rem;
		text-align: center;
		color: #ff8c5a;
		background: #14181d;
		border-radius: 0.375rem;
		padding: 0.4rem 0.5rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.plate-buttons {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.3rem;
	}
	.plate-btn {
		aspect-ratio: 1;
		border-radius: 0.375rem;
		font-weight: 700;
		font-size: 0.85rem;
		color: #e8eef3;
		background: #3a3f4a;
		transition: background-color 100ms ease;
	}
	.plate-btn:hover:not(:disabled) {
		background: #4a505c;
	}
	.plate-btn--active {
		background: var(--lab-hot, #e8a87c);
		color: #2a1a10;
	}
	.plate-btn:disabled {
		cursor: not-allowed;
	}
</style>

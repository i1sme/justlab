<script lang="ts">
	// Рабочая зона: крупный выбранный контейнер + контролы (−/+/очистить/удалить) + плитка.
	import type { Container } from '../../../data/types';
	import type { HeatingIntensity } from '$lib/render2d/heating-plate-logic';
	import Glassware from './Glassware.svelte';
	import HeatingPlatePanel from './HeatingPlatePanel.svelte';
	import { t } from '$lib/i18n';

	type Props = {
		container: Container | null;
		onHeat: (deltaK: number) => void;
		onIntensity: (level: HeatingIntensity) => void;
		onEmpty: () => void;
		onRemove: () => void;
	};
	let { container, onHeat, onIntensity, onEmpty, onRemove }: Props = $props();
</script>

<div class="workspace">
	{#if container}
		<div class="ws-vessel">
			<Glassware {container} heightPx={300} />
		</div>

		<div class="ws-controls">
			<div class="ws-temp-controls" role="group" aria-label={t('lab.temperature')}>
				<button
					type="button"
					class="ws-btn"
					aria-label={t('lab.coolStep')}
					onclick={() => onHeat(-25)}>−</button
				>
				<button
					type="button"
					class="ws-btn"
					aria-label={t('lab.heatStep')}
					onclick={() => onHeat(25)}>+</button
				>
				<button
					type="button"
					class="ws-btn ws-btn--empty"
					aria-label={t('lab.emptyContainer')}
					disabled={container.contents.length === 0}
					onclick={onEmpty}
				>
					⌫
				</button>
				<button
					type="button"
					class="ws-btn ws-btn--remove"
					aria-label={t('lab.removeContainer')}
					onclick={onRemove}>✕</button
				>
			</div>

			<HeatingPlatePanel {container} {onIntensity} />
		</div>
	{:else}
		<div class="ws-empty" role="status">{t('lab.visual.empty')}</div>
	{/if}
</div>

<style>
	.workspace {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: center;
		gap: 1.5rem;
		min-height: 340px;
		padding: 1rem;
	}
	.ws-vessel {
		display: grid;
		place-items: end center;
	}
	.ws-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.ws-temp-controls {
		display: flex;
		gap: 0.3rem;
	}
	.ws-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.4rem;
		font-weight: 600;
		color: var(--lab-text, #3a3f4a);
		background: rgba(255, 255, 255, 0.6);
		transition: background-color 100ms ease;
	}
	.ws-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.95);
	}
	.ws-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.ws-btn--empty {
		color: #c0563f;
	}
	.ws-btn--remove {
		color: #7a828c;
	}
	.ws-empty {
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 300px;
		font-size: 0.9rem;
		color: var(--lab-text, #5b6b78);
		opacity: 0.7;
	}
	@media (prefers-color-scheme: dark) {
		.ws-btn {
			background: rgba(255, 255, 255, 0.08);
			color: #dce4ea;
		}
		.ws-btn:hover:not(:disabled) {
			background: rgba(255, 255, 255, 0.16);
		}
	}
</style>

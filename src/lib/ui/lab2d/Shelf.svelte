<script lang="ts">
	// Полка: горизонтальная лента миниатюр контейнеров. Клик = выбор.
	// Добавление/удаление контейнеров — в существующем ContainerToolbar (выше view), не здесь.
	import type { Container } from '../../../data/types';
	import Glassware from './Glassware.svelte';
	import { t } from '$lib/i18n';

	type Props = {
		containers: readonly Container[];
		selectedId: string | null;
		onSelect: (id: string) => void;
	};
	let { containers, selectedId, onSelect }: Props = $props();

	function tempDot(k: number): string {
		// Тёплый/холодный цветовой код точки-индикатора.
		if (k >= 373) return '#e8a87c';
		if (k <= 273) return '#a8dadc';
		return '#bfd7ed';
	}
</script>

<div class="shelf" role="group" aria-label={t('lab.visual.shelf')}>
	{#each containers as c (c.id)}
		<button
			type="button"
			class="shelf-item"
			class:shelf-item--selected={selectedId === c.id}
			aria-pressed={selectedId === c.id}
			title={`${t(`lab.containerKind.${c.kind}`)} · ${c.id}`}
			onclick={() => onSelect(c.id)}
		>
			<div class="shelf-mini">
				<Glassware container={c} sizePx={60} />
			</div>
			<span class="shelf-dot" style:background-color={tempDot(c.temperature)}></span>
		</button>
	{/each}
</div>

<style>
	.shelf {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding: 0.5rem;
		border-radius: 0.75rem;
		background: var(--lab-wall, #e7eef3);
	}
	.shelf-item {
		position: relative;
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 72px;
		height: 84px;
		border-radius: 0.5rem;
		border: 2px solid transparent;
		background: transparent;
		transition: border-color 120ms ease;
	}
	.shelf-item:hover {
		border-color: var(--lab-focus, #bfd7ed);
	}
	.shelf-item--selected {
		border-color: #6aa0d8;
		background: rgba(191, 215, 237, 0.4);
	}
	.shelf-mini {
		pointer-events: none;
	}
	.shelf-dot {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	@media (prefers-color-scheme: dark) {
		.shelf {
			background: #232a31;
		}
	}
</style>

<script lang="ts">
	import { ELEMENTS, CATEGORY_COLORS, type PeriodicElement } from '../../data';
	import { getLocale, t } from '$lib/i18n';

	type Props = {
		onSelect?: (element: PeriodicElement) => void;
		selectedNumber?: number | null;
	};

	let { onSelect, selectedNumber = null }: Props = $props();

	const categoryBg = CATEGORY_COLORS;
	const main = ELEMENTS.filter((e) => e.gridRow <= 7);
	const fBlock = ELEMENTS.filter((e) => e.gridRow >= 8);

	function ariaLabel(el: PeriodicElement): string {
		const name = el.name[getLocale()];
		const category = t(`category.${el.category}`);
		return `${el.symbol}, ${name}, ${category}, ${t('element.number')} ${el.number}`;
	}
</script>

<section class="w-full" aria-label={t('periodicTable.title')}>
	<div class="overflow-x-auto pb-3">
		<div class="min-w-[920px]">
			<!-- Основная таблица: периоды 1–7 -->
			<div class="periodic-grid">
				{#each main as el (el.number)}
					<button
						type="button"
						class="cell"
						class:cell-selected={selectedNumber === el.number}
						style:grid-column={el.gridCol}
						style:grid-row={el.gridRow}
						style:background-color={categoryBg[el.category]}
						aria-label={ariaLabel(el)}
						aria-pressed={selectedNumber === el.number}
						onclick={() => onSelect?.(el)}
					>
						<span class="cell-number">{el.number}</span>
						<span class="cell-symbol">{el.symbol}</span>
						<span class="cell-mass">{el.atomicMass.toFixed(el.atomicMass < 100 ? 2 : 1)}</span>
					</button>
				{/each}

				<!-- Маркеры f-блока в основной таблице (вместо La и Ac). -->
				<div
					class="f-marker"
					style:grid-column="3"
					style:grid-row="6"
					style:background-color={categoryBg.lanthanoid}
					aria-hidden="true"
				>
					57–71
				</div>
				<div
					class="f-marker"
					style:grid-column="3"
					style:grid-row="7"
					style:background-color={categoryBg.actinoid}
					aria-hidden="true"
				>
					89–103
				</div>
			</div>

			<!-- Сноска f-блока: лантаноиды и актиноиды -->
			<div class="periodic-grid mt-3">
				{#each fBlock as el (el.number)}
					<button
						type="button"
						class="cell"
						class:cell-selected={selectedNumber === el.number}
						style:grid-column={el.gridCol}
						style:grid-row={el.gridRow - 7}
						style:background-color={categoryBg[el.category]}
						aria-label={ariaLabel(el)}
						aria-pressed={selectedNumber === el.number}
						onclick={() => onSelect?.(el)}
					>
						<span class="cell-number">{el.number}</span>
						<span class="cell-symbol">{el.symbol}</span>
						<span class="cell-mass">{el.atomicMass.toFixed(el.atomicMass < 100 ? 2 : 1)}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.periodic-grid {
		display: grid;
		grid-template-columns: repeat(18, minmax(0, 1fr));
		grid-auto-rows: 1fr;
		gap: 3px;
	}

	.cell {
		aspect-ratio: 1 / 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 3px 4px;
		border-radius: 4px;
		color: #18181b;
		font-family: inherit;
		cursor: pointer;
		transition:
			transform 120ms ease,
			box-shadow 120ms ease;
		text-align: left;
		border: 0;
	}
	.cell:hover {
		transform: scale(1.12);
		z-index: 10;
		position: relative;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
	}
	.cell:focus-visible {
		outline: 2px solid #2563eb;
		outline-offset: 2px;
		z-index: 10;
		position: relative;
	}
	.cell-selected {
		/* Жирная двойная рамка + ярко-синее свечение, чтобы место выбора было сразу видно. */
		outline: 3px solid #2563eb;
		outline-offset: 2px;
		box-shadow:
			0 0 0 6px rgba(37, 99, 235, 0.25),
			0 6px 16px rgba(37, 99, 235, 0.35);
		transform: scale(1.1);
		z-index: 8;
		position: relative;
	}
	.cell-selected:hover {
		transform: scale(1.18);
	}
	.cell-number {
		font-size: 11px;
		font-weight: 500;
		line-height: 1;
	}
	.cell-symbol {
		font-size: 18px;
		font-weight: 700;
		line-height: 1;
		text-align: center;
	}
	.cell-mass {
		font-size: 10px;
		line-height: 1;
		text-align: center;
		opacity: 0.85;
	}

	.f-marker {
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 600;
		color: #18181b;
		opacity: 0.55;
	}

	@media (prefers-reduced-motion: reduce) {
		.cell {
			transition: none;
		}
		.cell:hover {
			transform: none;
		}
	}
</style>

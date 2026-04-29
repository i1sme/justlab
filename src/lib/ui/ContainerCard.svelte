<script lang="ts">
	import type { Container } from '../../data/types';
	import { findSubstance } from '../../data/substances';
	import { getLocale, t } from '$lib/i18n';
	import { emptyContainer, heat as heatStore, getPlayback } from '$lib/lab';
	import ReactionEffects from './ReactionEffects.svelte';

	type Props = {
		container: Container;
		selected?: boolean;
		onSelect?: () => void;
	};
	let { container, selected = false, onSelect }: Props = $props();

	const locale = $derived(getLocale());
	const playback = $derived(getPlayback(container.id));

	function fmtTemp(k: number): string {
		const c = k - 273.15;
		return `${Math.round(k)} K · ${Math.round(c)} °C`;
	}

	function colorOf(substanceId: string, phase: string): string {
		const s = findSubstance(substanceId);
		if (!s) return '#999999';
		const phaseData = s.phases[phase as keyof typeof s.phases];
		return phaseData?.color ?? '#777777';
	}

	function nameOf(substanceId: string): string {
		return findSubstance(substanceId)?.names[locale] ?? substanceId;
	}

	function formulaOf(substanceId: string): string {
		return findSubstance(substanceId)?.formula ?? substanceId;
	}
</script>

<!-- div вместо button — нужны вложенные кнопки контролов температуры/очистки. -->
<div
	role="button"
	tabindex="0"
	class="container-card"
	class:container-card--selected={selected}
	aria-pressed={selected}
	aria-label={selected ? t('lab.deselectContainer') : t('lab.selectContainer')}
	onclick={onSelect}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect?.();
		}
	}}
>
	<div class="flex items-center justify-between gap-2">
		<div class="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
			{t(`lab.containerKind.${container.kind}`)}
		</div>
		<div class="font-mono text-[10px] text-zinc-400">{container.id}</div>
	</div>

	<!-- Стилизованное «стекло» с содержимым: цветной столбик внизу, пропорционально количеству.
	     position: relative нужен для абсолютно-позиционированного слоя ReactionEffects. -->
	<div class="glass">
		{#if container.contents.length === 0}
			<div class="grid h-full place-items-center text-xs text-zinc-400 italic">
				{t('lab.empty')}
			</div>
		{:else}
			<div class="flex h-full flex-col-reverse gap-px overflow-hidden rounded-md">
				{#each container.contents as item (item.substanceId)}
					{@const total = container.contents.reduce((s, x) => s + x.amount, 0)}
					{@const pct = (item.amount / total) * 100}
					<div
						class="glass-slice"
						style:background-color={colorOf(item.substanceId, item.phase)}
						style:flex-basis="{pct}%"
						title={`${nameOf(item.substanceId)} (${formulaOf(item.substanceId)}) ×${item.amount}`}
					></div>
				{/each}
			</div>
		{/if}
		<ReactionEffects {playback} />
	</div>

	<!-- Список содержимого текстом — для читаемости. -->
	{#if container.contents.length > 0}
		<ul class="space-y-0.5 text-xs">
			{#each container.contents as item (item.substanceId)}
				<li class="flex items-baseline justify-between gap-2">
					<span class="truncate text-zinc-700 dark:text-zinc-300">
						{nameOf(item.substanceId)}
					</span>
					<span class="flex-shrink-0 font-mono text-zinc-500 dark:text-zinc-400">
						{formulaOf(item.substanceId)} ×{item.amount}
					</span>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="flex items-center justify-between gap-1.5">
		<div
			class="temp-display text-xs text-zinc-600 dark:text-zinc-400"
			class:temp-display--rise={playback?.tempPulse === 'rise'}
			class:temp-display--drop={playback?.tempPulse === 'drop'}
			title={t('lab.temperature')}
		>
			🌡 {fmtTemp(container.temperature)}
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="flex gap-0.5"
			role="group"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				class="temp-btn"
				aria-label={t('lab.coolStep')}
				onclick={() => heatStore(container.id, -25)}
			>
				−
			</button>
			<button
				type="button"
				class="temp-btn"
				aria-label={t('lab.heatStep')}
				onclick={() => heatStore(container.id, 25)}
			>
				+
			</button>
			{#if container.contents.length > 0}
				<button
					type="button"
					class="temp-btn text-red-600 dark:text-red-400"
					aria-label={t('lab.emptyContainer')}
					onclick={() => emptyContainer(container.id)}
					title={t('lab.emptyContainer')}
				>
					⌫
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.container-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		border: 2px solid rgb(228 228 231); /* zinc-200 */
		background: rgb(255 255 255);
		text-align: left;
		min-height: 200px;
		transition:
			border-color 120ms ease,
			transform 120ms ease,
			box-shadow 120ms ease;
		cursor: pointer;
	}
	@media (prefers-color-scheme: dark) {
		.container-card {
			border-color: rgb(63 63 70); /* zinc-700 */
			background: rgb(24 24 27); /* zinc-900 */
		}
	}
	.container-card:hover {
		border-color: rgb(147 197 253); /* blue-300 */
	}
	.container-card--selected {
		border-color: #2563eb;
		box-shadow:
			0 0 0 4px rgba(37, 99, 235, 0.18),
			0 4px 14px rgba(37, 99, 235, 0.18);
	}
	@media (prefers-reduced-motion: reduce) {
		.container-card {
			transition: none;
		}
	}

	.glass {
		position: relative;
		flex: 1 1 auto;
		min-height: 80px;
		border-radius: 0.5rem;
		border: 1px solid rgb(228 228 231);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.03) 100%);
		overflow: hidden;
	}
	@media (prefers-color-scheme: dark) {
		.glass {
			border-color: rgb(63 63 70);
			background: linear-gradient(
				180deg,
				rgba(255, 255, 255, 0) 0%,
				rgba(255, 255, 255, 0.02) 100%
			);
		}
	}
	.glass-slice {
		flex: 1 1 0;
		min-height: 4px;
		opacity: 0.85;
	}

	/* Температурный пульс — кольцо-индикатор во время реакции с тепловой динамикой. */
	.temp-display {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		border: 1.5px solid transparent;
		transition: border-color 250ms ease;
	}
	.temp-display--rise {
		border-color: rgba(239, 68, 68, 0.7); /* red-500 */
		animation: temp-pulse-rise 0.9s ease-in-out infinite alternate;
	}
	.temp-display--drop {
		border-color: rgba(59, 130, 246, 0.7); /* blue-500 */
		animation: temp-pulse-drop 0.9s ease-in-out infinite alternate;
	}
	@keyframes temp-pulse-rise {
		0% {
			box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35);
		}
		100% {
			box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
		}
	}
	@keyframes temp-pulse-drop {
		0% {
			box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.35);
		}
		100% {
			box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.temp-display--rise,
		.temp-display--drop {
			animation: none;
		}
	}

	.temp-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: rgb(82 82 91); /* zinc-600 */
		transition: background-color 100ms ease;
	}
	.temp-btn:hover {
		background: rgb(244 244 245); /* zinc-100 */
	}
	@media (prefers-color-scheme: dark) {
		.temp-btn {
			color: rgb(212 212 216); /* zinc-300 */
		}
		.temp-btn:hover {
			background: rgb(39 39 42); /* zinc-800 */
		}
	}
</style>

<script lang="ts">
	// Панель реактивов: вертикальный список бутылок. Клик = добавить 1 меру в выбранный контейнер.
	// Кнопки задизейблены, пока контейнер не выбран (как в существующем Inventory).
	import { findSubstance } from '../../../data/substances';
	import { getLocale, t } from '$lib/i18n';

	type Props = {
		substanceIds: readonly string[];
		canPick: boolean;
		onPick: (substanceId: string) => void;
	};
	let { substanceIds, canPick, onPick }: Props = $props();

	const locale = $derived(getLocale());
</script>

<div class="bottles">
	<div class="bottles-title">{t('lab.inventory')}</div>
	<ul class="bottles-list">
		{#each substanceIds as id (id)}
			{@const sub = findSubstance(id)}
			{#if sub}
				<li>
					<button
						type="button"
						class="bottle"
						disabled={!canPick}
						onclick={() => onPick(id)}
						title={sub.names[locale]}
					>
						<span
							class="bottle-cap"
							style:background-color={sub.phases[sub.defaultPhase]?.color ?? '#cbd5e1'}
						></span>
						<span class="bottle-name">{sub.names[locale]}</span>
						<span class="bottle-formula">{sub.formula}</span>
					</button>
				</li>
			{/if}
		{/each}
	</ul>
</div>

<style>
	.bottles {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 11rem;
	}
	.bottles-title {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--lab-text, #3a3f4a);
		opacity: 0.7;
	}
	.bottles-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.bottle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.4rem 0.6rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.6);
		text-align: left;
		transition: background-color 100ms ease;
	}
	.bottle:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.95);
	}
	.bottle:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.bottle-cap {
		flex: 0 0 auto;
		width: 0.9rem;
		height: 1.3rem;
		border-radius: 0.2rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
	}
	.bottle-name {
		flex: 1 1 auto;
		font-size: 0.8rem;
		color: var(--lab-text, #3a3f4a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.bottle-formula {
		flex: 0 0 auto;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.75rem;
		opacity: 0.7;
		color: var(--lab-text, #3a3f4a);
	}
	@media (prefers-color-scheme: dark) {
		.bottle {
			background: rgba(255, 255, 255, 0.08);
		}
		.bottle:hover:not(:disabled) {
			background: rgba(255, 255, 255, 0.16);
		}
		.bottle-name,
		.bottle-formula,
		.bottles-title {
			color: #dce4ea;
		}
	}
</style>

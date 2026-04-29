<script lang="ts">
	// Слой визуальных эффектов поверх контейнера. Реагирует на playback из reaction-playback.
	// Все эффекты — на чистом CSS, без Three.js (Phase 4 v1).
	// Будущая 3D-сцена (Phase 4.5+) сможет либо заменить этот слой, либо работать параллельно.

	import type { VisualEffect } from '../../data/types';
	import type { ActivePlayback } from '$lib/lab';

	type Props = { playback?: ActivePlayback };
	let { playback }: Props = $props();

	function range(n: number): number[] {
		return Array.from({ length: n }, (_, i) => i);
	}

	function effectsByKind(
		effects: readonly VisualEffect[],
		kind: VisualEffect['kind']
	): VisualEffect[] {
		return effects.filter((e) => e.kind === kind);
	}
</script>

{#if playback}
	{@const all = playback.effects}

	<!-- 1. Tint / color-shift — общий цветной overlay поверх содержимого -->
	{#each effectsByKind(all, 'color-shift') as fx, i (`tint-${i}`)}
		<div class="fx-tint" style:--c={fx.color || '#ffffff'} style:--o={fx.intensity * 0.45}></div>
	{/each}

	<!-- 2. Glow — пульсирующий halo вокруг контейнера -->
	{#each effectsByKind(all, 'glow') as fx, i (`glow-${i}`)}
		<div class="fx-glow" style:--c={fx.color || '#ffd23f'} style:--o={fx.intensity}></div>
	{/each}

	<!-- 3. Flame — танцующий градиент сверху -->
	{#each effectsByKind(all, 'flame') as fx, i (`flame-${i}`)}
		<div class="fx-flame" style:--c={fx.color || '#ff6b00'} style:--i={fx.intensity}></div>
	{/each}

	<!-- 4. Bubbles — поднимающиеся пузырьки -->
	{#each effectsByKind(all, 'bubbles') as fx, fxIdx (`bubbles-${fxIdx}`)}
		{@const count = Math.max(4, Math.round(10 * fx.intensity))}
		<div class="fx-particles" aria-hidden="true">
			{#each range(count) as i (i)}
				<span
					class="bubble"
					style:left="{((i * 19 + 11) % 90) + 5}%"
					style:--delay="{((i * 0.12) % 1.5).toFixed(2)}s"
					style:--size="{4 + ((i * 7) % 8)}px"
					style:--c={fx.color || 'rgba(255,255,255,0.7)'}
				></span>
			{/each}
		</div>
	{/each}

	<!-- 5. Smoke — пар/дым выше уровня -->
	{#each effectsByKind(all, 'smoke') as fx, fxIdx (`smoke-${fxIdx}`)}
		{@const count = Math.max(3, Math.round(6 * fx.intensity))}
		<div class="fx-particles" aria-hidden="true">
			{#each range(count) as i (i)}
				<span
					class="puff"
					style:left="{((i * 23 + 13) % 60) + 20}%"
					style:--delay="{((i * 0.4) % 2).toFixed(2)}s"
				></span>
			{/each}
		</div>
	{/each}

	<!-- 6. Precipitate — оседающие частицы -->
	{#each effectsByKind(all, 'precipitate') as fx, fxIdx (`precip-${fxIdx}`)}
		{@const count = Math.max(4, Math.round(14 * fx.intensity))}
		<div class="fx-particles" aria-hidden="true">
			{#each range(count) as i (i)}
				<span
					class="dot"
					style:left="{((i * 13 + 7) % 90) + 5}%"
					style:--delay="{((i * 0.05) % 0.8).toFixed(2)}s"
					style:--size="{2 + ((i * 5) % 4)}px"
					style:--c={fx.color || '#999999'}
				></span>
			{/each}
		</div>
	{/each}
{/if}

<style>
	/* Все эффекты — абсолютно позиционированные слои поверх parent'а (.glass).
	   Parent должен иметь `position: relative` (см. ContainerCard.svelte). */
	.fx-tint,
	.fx-glow,
	.fx-flame,
	.fx-particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		border-radius: inherit;
	}

	/* Tint — мягкий цветной overlay -------------------- */
	.fx-tint {
		background: var(--c);
		opacity: var(--o);
		mix-blend-mode: multiply;
		animation: tint-pulse 1.5s ease-in-out infinite alternate;
	}
	@keyframes tint-pulse {
		0% {
			opacity: calc(var(--o) * 0.6);
		}
		100% {
			opacity: var(--o);
		}
	}

	/* Glow — внешнее свечение -------------------------- */
	.fx-glow {
		box-shadow:
			0 0 calc(18px * var(--o)) calc(6px * var(--o)) var(--c),
			inset 0 0 calc(20px * var(--o)) var(--c);
		opacity: 0.85;
		animation: glow-pulse 1.1s ease-in-out infinite alternate;
	}
	@keyframes glow-pulse {
		0% {
			opacity: 0.55;
		}
		100% {
			opacity: 1;
		}
	}

	/* Flame — градиент сверху + flicker ---------------- */
	.fx-flame {
		height: 70%;
		bottom: auto;
		background: linear-gradient(180deg, var(--c) 0%, transparent 75%);
		opacity: var(--i);
		filter: blur(2px);
		transform-origin: center top;
		animation: flame-flicker 0.45s ease-in-out infinite alternate;
	}
	@keyframes flame-flicker {
		0% {
			transform: scaleY(1) scaleX(1);
			opacity: var(--i);
		}
		100% {
			transform: scaleY(1.1) scaleX(0.95);
			opacity: calc(var(--i) * 0.8);
		}
	}

	/* Bubbles — пузырьки снизу вверх ------------------- */
	.bubble {
		position: absolute;
		bottom: 0;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: var(--c);
		opacity: 0;
		animation: bubble-rise 1.5s ease-in var(--delay) infinite;
	}
	@keyframes bubble-rise {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		20% {
			opacity: 0.85;
		}
		80% {
			opacity: 0.85;
		}
		100% {
			transform: translateY(-100%);
			opacity: 0;
		}
	}

	/* Smoke / steam ------------------------------------- */
	.puff {
		position: absolute;
		bottom: 0;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: rgba(200, 200, 200, 0.55);
		filter: blur(4px);
		opacity: 0;
		animation: smoke-rise 2.2s ease-out var(--delay) infinite;
	}
	@keyframes smoke-rise {
		0% {
			transform: translateY(0) scale(0.5);
			opacity: 0;
		}
		30% {
			opacity: 0.6;
		}
		100% {
			transform: translateY(-160%) scale(2);
			opacity: 0;
		}
	}

	/* Precipitate — оседающие точки -------------------- */
	.dot {
		position: absolute;
		top: 0;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: var(--c);
		opacity: 0;
		animation: dot-fall 2s ease-in var(--delay) forwards;
	}
	@keyframes dot-fall {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		15% {
			opacity: 0.9;
		}
		80% {
			transform: translateY(80%);
			opacity: 0.9;
		}
		100% {
			transform: translateY(95%);
			opacity: 0.75;
		}
	}

	/* Системный prefers-reduced-motion — даже если playback запустился
	   (motion toggle не выкл), убираем плавающие частицы. Тинт и glow остаются как статика. */
	@media (prefers-reduced-motion: reduce) {
		.fx-tint,
		.fx-glow,
		.fx-flame {
			animation: none;
		}
		.bubble,
		.puff,
		.dot {
			display: none;
		}
	}
</style>

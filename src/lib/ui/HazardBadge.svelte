<script lang="ts">
	// Компактный бейдж GHS-пиктограммы (UN/ECE).
	// Реальные GHS-знаки — повёрнутые на 45° квадраты с красной рамкой; здесь — упрощённая версия:
	// маленький круглый чип с однобуквенным маркером и цветовым кодом по типу опасности.
	// Полноценные SVG-пиктограммы — кандидат на v0.4 (тогда же AR-режим).

	import type { GHSPictogram } from '../../data/types';
	import { t } from '$lib/i18n';

	type Props = { hazard: GHSPictogram };
	let { hazard }: Props = $props();

	const meta: Record<GHSPictogram, { mark: string; cls: string }> = {
		explosive: { mark: '!', cls: 'hb-explosive' },
		flammable: { mark: '🔥', cls: 'hb-flammable' },
		oxidizing: { mark: 'O', cls: 'hb-oxidizing' },
		'compressed-gas': { mark: 'G', cls: 'hb-gas' },
		corrosive: { mark: '✺', cls: 'hb-corrosive' },
		toxic: { mark: '☠', cls: 'hb-toxic' },
		harmful: { mark: '!', cls: 'hb-harmful' },
		'health-hazard': { mark: '‼', cls: 'hb-health' },
		environmental: { mark: '🌿', cls: 'hb-env' }
	};

	const m = $derived(meta[hazard]);
	const label = $derived(t(`hazard.${hazard}`));
</script>

<span class="hb {m.cls}" title={label} aria-label={label} role="img">
	{m.mark}
</span>

<style>
	.hb {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.05rem;
		height: 1.05rem;
		border-radius: 0.25rem;
		font-size: 0.65rem;
		font-weight: 700;
		line-height: 1;
		border: 1px solid rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}
	.hb-explosive {
		background: #fb923c; /* orange-400 */
		color: #fff;
	}
	.hb-flammable {
		background: #fde68a; /* amber-200 */
		font-size: 0.7rem;
	}
	.hb-oxidizing {
		background: #fbbf24; /* amber-400 */
		color: #1f2937;
	}
	.hb-gas {
		background: #cbd5e1; /* slate-300 */
		color: #1f2937;
	}
	.hb-corrosive {
		background: #f87171; /* red-400 */
		color: #fff;
	}
	.hb-toxic {
		background: #1f2937; /* gray-800 */
		color: #fff;
	}
	.hb-harmful {
		background: #fef08a; /* yellow-200 */
		color: #713f12; /* yellow-900 */
	}
	.hb-health {
		background: #ef4444; /* red-500 */
		color: #fff;
	}
	.hb-env {
		background: #bbf7d0; /* green-200 */
		font-size: 0.7rem;
	}
	@media (prefers-color-scheme: dark) {
		.hb {
			border-color: rgba(255, 255, 255, 0.15);
		}
	}
</style>

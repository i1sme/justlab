<script lang="ts">
	// Визуальный режим лаборатории (2.5D, перестройка R1+).
	// На время R1 здесь временная заглушка — реальная сцена (полка + рабочая зона)
	// собирается в последующих задачах R1. 3D-сцена (Three.js) выведена из проекта.
	import { t } from '$lib/i18n';
</script>

<div class="visual-lab-placeholder" role="status">
	<p>{t('lab.visual.rebuilding')}</p>
</div>

<style>
	.visual-lab-placeholder {
		display: grid;
		place-items: center;
		min-height: 360px;
		border-radius: 1rem;
		background: #f5efe6;
		color: #5b6b78;
		font-size: 0.9rem;
		text-align: center;
		padding: 2rem;
	}
	@media (prefers-color-scheme: dark) {
		.visual-lab-placeholder {
			background: #1f242b;
			color: #a8b8c3;
		}
	}
</style>

<script lang="ts">
	import MoleculeViewer from '$lib/ui/MoleculeViewer.svelte';
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{t('app.title')} — {t('molecule.title')}</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
	<header class="mb-5">
		<h1 class="text-3xl font-bold tracking-tight">{t('molecule.title')}</h1>
		<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{t('app.tagline')}</p>
	</header>

	<MoleculeViewer />
</main>

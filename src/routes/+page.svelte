<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{t('app.title')}</title>
	<meta name="description" content={t('app.tagline')} />
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
	<h1 class="text-5xl font-bold tracking-tight">{t('app.title')}</h1>
	<p class="mt-4 text-xl text-zinc-600 dark:text-zinc-400">{t('app.tagline')}</p>
	<p class="mt-8 text-base text-zinc-500">{t('home.soon')}</p>
</main>

// i18n/ — точечный API локализации поверх реактивного state.svelte.ts.
// `t()` читает текущую локаль через `getLocale()` — внутри Svelte-компонента это
// автоматически создаёт реактивную зависимость на $state в state.svelte.ts.

import { dictionaries, getLocale, setLocale, SUPPORTED_LOCALES, type Locale } from './state.svelte';

export type { Locale };
export { getLocale, setLocale, SUPPORTED_LOCALES };

/**
 * Точечный путь до строки: t('app.title').
 * Если ключ не найден — возвращаем сам ключ, чтобы быстро увидеть пропуск.
 */
export function t(key: string): string {
	const dict = dictionaries[getLocale()] as unknown;
	const parts = key.split('.');
	let cursor: unknown = dict;
	for (const part of parts) {
		if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
			cursor = (cursor as Record<string, unknown>)[part];
		} else {
			return key;
		}
	}
	return typeof cursor === 'string' ? cursor : key;
}

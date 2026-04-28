// Реактивный стейт локали (Svelte 5 runes).
// Изолирован в .svelte.ts, чтобы внешний index.ts оставался обычным TS-модулем.

import ru from './ru.json';
import en from './en.json';

export type Locale = 'ru' | 'en';

const STORAGE_KEY = 'justlab.locale';
const URL_PARAM = 'lang';
const SUPPORTED: readonly Locale[] = ['ru', 'en'];

function isValid(value: string | null | undefined): value is Locale {
	return value === 'ru' || value === 'en';
}

/**
 * Источники локали в порядке приоритета:
 * 1. URL `?lang=ru|en` (для шеринга ссылок с явным языком).
 * 2. localStorage (выбор пользователя).
 * 3. `navigator.language` (системный язык).
 * 4. fallback `'ru'`.
 */
function readInitialLocale(): Locale {
	if (typeof window !== 'undefined') {
		const urlLang = new URLSearchParams(window.location.search).get(URL_PARAM);
		if (isValid(urlLang)) return urlLang;
	}
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (isValid(stored)) return stored;
	}
	if (typeof navigator !== 'undefined') {
		const lang = navigator.language?.toLowerCase().split('-')[0];
		if (lang === 'en') return 'en';
	}
	return 'ru';
}

let locale = $state<Locale>(readInitialLocale());

export const dictionaries = { ru, en } as const;

export function getLocale(): Locale {
	return locale;
}

export function setLocale(next: Locale): void {
	if (!SUPPORTED.includes(next)) return;
	locale = next;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, next);
	}
	if (typeof document !== 'undefined') {
		document.documentElement.lang = next;
	}
	// Синхронизируем URL, чтобы ссылка получалась shareable.
	if (typeof window !== 'undefined' && window.history?.replaceState) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- одноразовый non-reactive helper
		const url = new URL(window.location.href);
		if (url.searchParams.get(URL_PARAM) !== next) {
			url.searchParams.set(URL_PARAM, next);
			window.history.replaceState(window.history.state, '', url);
		}
	}
}

export const SUPPORTED_LOCALES = SUPPORTED;

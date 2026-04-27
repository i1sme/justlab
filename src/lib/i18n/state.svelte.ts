// Реактивный стейт локали (Svelte 5 runes).
// Изолирован в .svelte.ts, чтобы внешний index.ts оставался обычным TS-модулем.

import ru from './ru.json';
import en from './en.json';

export type Locale = 'ru' | 'en';

const STORAGE_KEY = 'justlab.locale';
const SUPPORTED: readonly Locale[] = ['ru', 'en'];

function readInitialLocale(): Locale {
	if (typeof localStorage === 'undefined') return 'ru';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'ru' || stored === 'en') return stored;
	// fallback на язык браузера
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
}

export const SUPPORTED_LOCALES = SUPPORTED;

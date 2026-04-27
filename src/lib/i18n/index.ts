// i18n/ — минимальная локализация без рантайм-зависимостей.
// Реактивность поверх state добавим, когда появится UI выбора языка.

import ru from './ru.json';
import en from './en.json';

export type Locale = 'ru' | 'en';

const dictionaries: Record<Locale, unknown> = { ru, en };

let currentLocale: Locale = 'ru';

export function setLocale(locale: Locale): void {
	currentLocale = locale;
}

export function getLocale(): Locale {
	return currentLocale;
}

/**
 * Точечный путь до строки: t('app.title').
 * Если ключ не найден — возвращаем сам ключ, чтобы быстро увидеть пропуск.
 */
export function t(key: string): string {
	const parts = key.split('.');
	let cursor: unknown = dictionaries[currentLocale];
	for (const part of parts) {
		if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
			cursor = (cursor as Record<string, unknown>)[part];
		} else {
			return key;
		}
	}
	return typeof cursor === 'string' ? cursor : key;
}

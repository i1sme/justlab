// Агрегатор реакций по категориям + индекс для быстрого lookup'а движком.
//
// Архитектура (см. CLAUDE.md, «Lab архитектура»):
// - Каждая категория — отдельный файл. На текущем размере (~17 реакций) грузим всё
//   синхронно. Когда дойдём до сотен — превратим в lazy-import + chunk per category.
// - Индекс REACTIONS_BY_KEY использует канонический ключ из отсортированных
//   substance ID (включая катализатор) — O(1) lookup на стороне движка.

import type { Reaction } from '../types';
import { NEUTRALIZATION_REACTIONS } from './neutralization';
import { PRECIPITATION_REACTIONS } from './precipitation';
import { COMBUSTION_REACTIONS } from './combustion';
import { DISPLACEMENT_REACTIONS } from './displacement';
import { SYNTHESIS_REACTIONS } from './synthesis';
import { DECOMPOSITION_REACTIONS } from './decomposition';
import { FLAME_TEST_REACTIONS } from './flame-test';

export const REACTIONS: readonly Reaction[] = [
	...NEUTRALIZATION_REACTIONS,
	...PRECIPITATION_REACTIONS,
	...COMBUSTION_REACTIONS,
	...DISPLACEMENT_REACTIONS,
	...SYNTHESIS_REACTIONS,
	...DECOMPOSITION_REACTIONS,
	...FLAME_TEST_REACTIONS
];

export {
	NEUTRALIZATION_REACTIONS,
	PRECIPITATION_REACTIONS,
	COMBUSTION_REACTIONS,
	DISPLACEMENT_REACTIONS,
	SYNTHESIS_REACTIONS,
	DECOMPOSITION_REACTIONS,
	FLAME_TEST_REACTIONS
};

/**
 * Канонический ключ реакции — отсортированный список ID всех участников
 * (inputs + catalyst). Используется для построения индекса.
 */
function reactionKey(r: Reaction): string {
	const ids = new Set(r.inputs.map((i) => i.substanceId));
	if (r.conditions.catalystId) ids.add(r.conditions.catalystId);
	return [...ids].sort().join('+');
}

const _byKey = new Map<string, Reaction[]>();
for (const r of REACTIONS) {
	const key = reactionKey(r);
	const existing = _byKey.get(key);
	if (existing) existing.push(r);
	else _byKey.set(key, [r]);
}

/** Индекс «канонический ключ → реакции с таким набором участников». */
export const REACTIONS_BY_KEY: ReadonlyMap<string, readonly Reaction[]> = _byKey;

/** O(1) lookup по уникальному id реакции. */
export const REACTION_BY_ID: ReadonlyMap<string, Reaction> = new Map(
	REACTIONS.map((r) => [r.id, r])
);

/**
 * Построить тот же ключ, который использует индекс — для пользовательского набора веществ.
 * Дубликаты (если пользователь добавил вещество дважды) сворачиваются в один ID.
 */
export function buildLookupKey(substanceIds: Iterable<string>): string {
	return [...new Set(substanceIds)].sort().join('+');
}

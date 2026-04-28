// Reaction-engine: «дай мне набор реактивов и условия — найду подходящую реакцию или null».
//
// Контракт CLAUDE.md: engine честен. Никогда не выдумывает несуществующие реакции,
// возвращает `null`, и UI ответственен за «реакция неизвестна» сообщение.
//
// Семантика exact-match: набор substance ID у пользователя (включая катализаторы)
// должен ровно совпадать с тем, что объявлено в реакции. Лишние реактивы
// блокируют match — пользователь должен очистить инвентарь.

import { REACTIONS_BY_KEY, buildLookupKey } from '../../data/reactions';
import type { Reaction, ReactantSpec, ReactionConditions } from '../../data/types';

/** Условия в момент запроса (текущая температура контейнера, среда и т.п.). */
export interface UserConditions {
	/** Температура содержимого (K). По умолчанию ≈ комнатная (298 K). */
	temperature?: number;
	/** Давление (Па). По умолчанию атмосферное (≈101325 Па). */
	pressure?: number;
	/** Среда. По умолчанию подразумеваем 'water' для реакций в водной среде. */
	medium?: 'water' | 'air' | 'inert';
	/** Подсветка (для фотолиза). */
	light?: boolean;
	/** Электрический ток (для электролиза). */
	electricCurrent?: boolean;
}

/**
 * Найти реакцию для заданных входов и условий. Возвращает `null` если ничего не подходит.
 * Время поиска O(K) где K — число реакций с тем же набором участников (обычно 1–2).
 */
export function findReaction(
	inputs: readonly ReactantSpec[],
	conditions: UserConditions = {}
): Reaction | null {
	const key = buildLookupKey(inputs.map((i) => i.substanceId));
	const candidates = REACTIONS_BY_KEY.get(key);
	if (!candidates) return null;
	for (const r of candidates) {
		if (matchesReaction(r, inputs, conditions)) return r;
	}
	return null;
}

function matchesReaction(
	r: Reaction,
	userInputs: readonly ReactantSpec[],
	conditions: UserConditions
): boolean {
	// Каждый input реакции должен быть представлен у пользователя в нужном агрегатном состоянии.
	for (const reqInput of r.inputs) {
		const userInput = userInputs.find((u) => u.substanceId === reqInput.substanceId);
		if (!userInput) return false;
		if (reqInput.state && userInput.state && reqInput.state !== userInput.state) return false;
	}
	return matchesConditions(r.conditions, conditions);
}

function matchesConditions(req: ReactionConditions, cur: UserConditions): boolean {
	if (req.temperature) {
		const T = cur.temperature ?? 298;
		if (T < req.temperature.min) return false;
		if (req.temperature.max !== undefined && T > req.temperature.max) return false;
	}
	if (req.pressure !== undefined) {
		const P = cur.pressure ?? 101325;
		// Допускаем отклонение в пределах порядка — пользователь редко выставляет точно.
		if (P < req.pressure / 10) return false;
	}
	if (req.medium) {
		const userMedium = cur.medium ?? 'water';
		if (req.medium !== userMedium) return false;
	}
	if (req.light && !cur.light) return false;
	if (req.electricCurrent && !cur.electricCurrent) return false;
	// Catalyst handled by ключ — он в lookupKey.
	return true;
}

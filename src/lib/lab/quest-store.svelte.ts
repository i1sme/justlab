// Реактивный store квестов: активная цель + список выполненных + persist.
//
// Принципы:
//   - Завершение определяется срабатыванием конкретной реакции из БД.
//     lab-store вызывает recordReaction() при каждом triggeredReaction.
//   - Никаких выдуманных продуктов: квест считается выполненным только если
//     движок реакций действительно нашёл эту реакцию.
//   - Прогресс хранится в localStorage (отдельно от userMode и motion).

import { QUESTS, findQuest, type Quest } from '../../data/quests';

const STORAGE_KEY_COMPLETED = 'justlab.quests.completed';
const STORAGE_KEY_ACTIVE = 'justlab.quests.active';

function readCompleted(): string[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(STORAGE_KEY_COMPLETED);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

function readActive(): string | null {
	if (typeof localStorage === 'undefined') return null;
	const v = localStorage.getItem(STORAGE_KEY_ACTIVE);
	return v && QUESTS.some((q) => q.id === v) ? v : null;
}

let completedIds = $state<readonly string[]>(readCompleted());
let activeId = $state<string | null>(readActive());
/** ID последнего только что выполненного квеста — для всплывающего «выполнено!». */
let justCompletedId = $state<string | null>(null);

export function getActiveQuest(): Quest | null {
	return activeId ? (findQuest(activeId) ?? null) : null;
}

export function getActiveQuestId(): string | null {
	return activeId;
}

export function getCompletedIds(): readonly string[] {
	return completedIds;
}

export function isCompleted(id: string): boolean {
	return completedIds.includes(id);
}

export function getJustCompletedId(): string | null {
	return justCompletedId;
}

/** Установить активный квест (или null). Persist. */
export function setActiveQuest(id: string | null): void {
	if (id !== null && !findQuest(id)) return;
	activeId = id;
	if (typeof localStorage !== 'undefined') {
		if (id) localStorage.setItem(STORAGE_KEY_ACTIVE, id);
		else localStorage.removeItem(STORAGE_KEY_ACTIVE);
	}
}

/** Сбросить флаг «только что выполнено» — после показа toast'а. */
export function clearJustCompleted(): void {
	justCompletedId = null;
}

/**
 * Уведомление от lab-store: сработала реакция reactionId. Если активный квест её ждал —
 * помечаем выполненным и поднимаем justCompletedId.
 */
export function recordReaction(reactionId: string): void {
	if (!activeId) return;
	const q = findQuest(activeId);
	if (!q) return;
	if (q.goal.kind !== 'reaction-triggered') return;
	if (q.goal.reactionId !== reactionId) return;

	if (!completedIds.includes(activeId)) {
		completedIds = [...completedIds, activeId];
		persistCompleted();
		justCompletedId = activeId;
	}
}

/** Полностью забыть весь прогресс — для отладки/сброса. */
export function resetQuestProgress(): void {
	completedIds = [];
	activeId = null;
	justCompletedId = null;
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(STORAGE_KEY_COMPLETED);
		localStorage.removeItem(STORAGE_KEY_ACTIVE);
	}
}

function persistCompleted(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedIds));
}

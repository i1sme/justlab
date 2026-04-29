// Глобальные пользовательские настройки (Svelte 5 runes).
//
// Содержит:
//   - motionEnabled — анимации в 3D-сценах
//   - userMode — Новичок/Школа/Вуз (CLAUDE.md: «Lab архитектура»)
//
// Все настройки персистятся в localStorage. Для сложных вещей (журнал экспериментов)
// в будущем поднимем Dexie/IndexedDB; для простых enum'ов localStorage достаточно.

import type { Difficulty } from '../../data/types';

// ============================================================
// motionEnabled
// ============================================================

const MOTION_KEY = 'justlab.motion';

function readMotionInitial(): boolean {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(MOTION_KEY);
		if (stored === 'on') return true;
		if (stored === 'off') return false;
	}
	if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
		return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
	return true;
}

let motionEnabled = $state<boolean>(readMotionInitial());

export function getMotionEnabled(): boolean {
	return motionEnabled;
}

export function setMotionEnabled(next: boolean): void {
	motionEnabled = next;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(MOTION_KEY, next ? 'on' : 'off');
	}
}

export function toggleMotion(): void {
	setMotionEnabled(!motionEnabled);
}

// ============================================================
// userMode (Новичок / Школа / Вуз)
// ============================================================

/** Уровень пользователя. `null` — ещё не выбран (показываем wizard). */
export type UserMode = 'beginner' | 'school' | 'university';

const USER_MODE_KEY = 'justlab.userMode';

function isUserMode(v: string | null | undefined): v is UserMode {
	return v === 'beginner' || v === 'school' || v === 'university';
}

function readUserModeInitial(): UserMode | null {
	if (typeof localStorage === 'undefined') return null;
	const stored = localStorage.getItem(USER_MODE_KEY);
	return isUserMode(stored) ? stored : null;
}

let userMode = $state<UserMode | null>(readUserModeInitial());

/** Возвращает текущий userMode либо `null` (первый запуск, показываем wizard). */
export function getUserMode(): UserMode | null {
	return userMode;
}

/** Эффективный mode (с учётом дефолта `school` если не выбран). */
export function getEffectiveUserMode(): UserMode {
	return userMode ?? 'school';
}

export function setUserMode(next: UserMode): void {
	userMode = next;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(USER_MODE_KEY, next);
	}
}

/**
 * Виден ли элемент данной difficulty в текущем режиме?
 *
 *   beginner и school режимы — скрывают university-уровень.
 *   university режим — показывает всё.
 *
 * Между beginner и school разница в UX (подсказки, упрощения), не в контенте.
 */
export function isVisibleAtMode(itemDifficulty: Difficulty, mode: UserMode | null): boolean {
	const effective = mode ?? 'school';
	if (effective === 'university') return true;
	return itemDifficulty !== 'university';
}

// ============================================================
// labView (Формальная / Визуальная лаборатория)
// ============================================================

/**
 * Какой режим отображения лаборатории показывать:
 *   - 'formal' — карточки контейнеров, цифры температуры, текст реакций (как сейчас).
 *   - 'visual' — 3D-сцена со столом, посудой и приборами (Three.js).
 * Не привязан к userMode — пользователь сам выбирает в шапке /lab.
 */
export type LabView = 'formal' | 'visual';

const LAB_VIEW_KEY = 'justlab.labView';

function readLabViewInitial(): LabView {
	if (typeof localStorage === 'undefined') return 'formal';
	const stored = localStorage.getItem(LAB_VIEW_KEY);
	return stored === 'visual' ? 'visual' : 'formal';
}

let labView = $state<LabView>(readLabViewInitial());

export function getLabView(): LabView {
	return labView;
}

export function setLabView(next: LabView): void {
	labView = next;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(LAB_VIEW_KEY, next);
	}
}

export function toggleLabView(): void {
	setLabView(labView === 'formal' ? 'visual' : 'formal');
}

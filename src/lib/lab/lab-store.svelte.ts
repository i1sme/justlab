// Реактивный store-обёртка над чистым reducer'ом lab-state.
// Svelte 5 runes: $state хранит текущий Experiment, dispatch применяет action.
// Все компоненты читают через get-функции, чтобы было реактивно (Svelte отследит).

import {
	applyAction,
	createInitialState,
	createAddSubstance,
	createHeat,
	createCool,
	createMix
} from './lab-state';
import { getPlayback, startPlayback, stopAll } from './reaction-playback.svelte';
import { recordReaction as recordQuestReaction } from './quest-store.svelte';
import type { Action, ContainerContent, Experiment, Reaction } from '../../data/types';

/**
 * Запись об «известной» реакции — для UI ReactionInfo.
 */
export interface LastReactionRecord {
	reaction: Reaction;
	containerId: string;
	t: number;
}

/**
 * Запись об «неизвестной» комбинации — пользователь смешал 2+ вещества,
 * но реакция не нашлась в БД. Принцип CLAUDE.md: «не выдумываем продукты».
 */
export interface UnknownAttemptRecord {
	containerId: string;
	contents: readonly ContainerContent[];
	t: number;
}

let experiment = $state<Experiment>(createInitialState());
let lastReaction = $state<LastReactionRecord | null>(null);
let lastUnknown = $state<UnknownAttemptRecord | null>(null);
/** ID контейнера, выбранного пользователем (для добавления реактивов). */
let selectedContainerId = $state<string | null>(null);

export function getExperiment(): Experiment {
	return experiment;
}

export function getLastReaction(): LastReactionRecord | null {
	return lastReaction;
}

export function getLastUnknown(): UnknownAttemptRecord | null {
	return lastUnknown;
}

export function getSelectedContainerId(): string | null {
	return selectedContainerId;
}

export function setSelectedContainerId(id: string | null): void {
	selectedContainerId = id;
}

export function dispatch(action: Action): void {
	const outcome = applyAction(experiment, action);
	experiment = outcome.state;
	if (outcome.triggeredReaction) {
		lastReaction = { ...outcome.triggeredReaction, t: action.t };
		lastUnknown = null;
		// Запускаем визуальное воспроизведение в контейнере (timeline keyframes).
		startPlayback(outcome.triggeredReaction.containerId, outcome.triggeredReaction.reaction);
		// Уведомляем квестовый store — может быть, это цель активного задания.
		recordQuestReaction(outcome.triggeredReaction.reaction.id);
		return;
	}
	// Реакция не сработала — если пользователь явно пытался комбинировать
	// (add-substance/mix) и в результате контейнер содержит 2+ уникальных вещества,
	// фиксируем «неизвестная реакция» для честного UI.
	const targetId = unknownTargetContainer(action);
	if (targetId) {
		const c = outcome.state.containers.find((c) => c.id === targetId);
		if (c && c.contents.length >= 2) {
			lastUnknown = { containerId: c.id, contents: c.contents, t: action.t };
		}
	}
}

function unknownTargetContainer(action: Action): string | null {
	if (action.type === 'add-substance') return action.containerId;
	if (action.type === 'mix') return action.targetId;
	return null;
}

/** Сбросить эксперимент в исходное состояние (новые пустые контейнеры). */
export function resetExperiment(): void {
	stopAll();
	experiment = createInitialState();
	lastReaction = null;
	lastUnknown = null;
	selectedContainerId = null;
}

/** Очистить содержимое одного контейнера, не удаляя его. */
export function emptyContainer(containerId: string): void {
	experiment = {
		...experiment,
		containers: experiment.containers.map((c) =>
			c.id === containerId
				? { ...c, contents: [], temperature: experiment.environment.temperature }
				: c
		),
		updatedAt: Date.now()
	};
	if (lastUnknown?.containerId === containerId) lastUnknown = null;
	if (lastReaction?.containerId === containerId) lastReaction = null;
}

// === Convenience wrappers (для UI) ===

export function addSubstance(containerId: string, substanceId: string, amount = 1): void {
	dispatch(createAddSubstance(containerId, substanceId, amount));
}

export function heat(containerId: string, deltaK: number): void {
	const c = experiment.containers.find((c) => c.id === containerId);
	if (!c) return;
	const targetTemp = Math.max(0, c.temperature + deltaK);
	dispatch(deltaK >= 0 ? createHeat(containerId, targetTemp) : createCool(containerId, targetTemp));
}

export function mix(sourceId: string, targetId: string): void {
	dispatch(createMix(sourceId, targetId));
}

/**
 * Повторно проиграть анимацию последней реакции (без изменения состояния — содержимое
 * контейнера уже превращено в outputs). Если playback уже идёт — startPlayback его сбросит.
 * Если motion off — ничего не произойдёт (внутренний guard в startPlayback).
 */
export function replayLastReaction(): boolean {
	if (!lastReaction) return false;
	if (getPlayback(lastReaction.containerId)) return false; // уже играет
	startPlayback(lastReaction.containerId, lastReaction.reaction);
	return true;
}

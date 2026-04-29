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
import { startPlayback, stopAll } from './reaction-playback.svelte';
import type { Action, Experiment, Reaction } from '../../data/types';

let experiment = $state<Experiment>(createInitialState());
let lastReaction = $state<{ reaction: Reaction; containerId: string; t: number } | null>(null);
/** ID контейнера, выбранного пользователем (для добавления реактивов). */
let selectedContainerId = $state<string | null>(null);

export function getExperiment(): Experiment {
	return experiment;
}

export function getLastReaction(): { reaction: Reaction; containerId: string; t: number } | null {
	return lastReaction;
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
		// Запускаем визуальное воспроизведение в контейнере (timeline keyframes).
		startPlayback(outcome.triggeredReaction.containerId, outcome.triggeredReaction.reaction);
	}
}

/** Сбросить эксперимент в исходное состояние (новые пустые контейнеры). */
export function resetExperiment(): void {
	stopAll();
	experiment = createInitialState();
	lastReaction = null;
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

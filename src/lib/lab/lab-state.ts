// Чистый reducer лабораторного состояния (event-sourcing).
// Принципы из CLAUDE.md «Lab архитектура»:
//   - Action[] — журнал, LabState пере-вычисляется из него (даёт undo + URL share + machine-of-time).
//   - После Action'а, изменившего содержимое контейнера → reaction-engine ищет реакцию.
//     Если нашлась — содержимое контейнера заменяется на outputs (CLAUDE.md: «не выдумываем»).
//   - Reducer чистый и тестируемый. Реактивный store-обёртка живёт в lab-store.svelte.ts.

import type {
	Experiment,
	Container,
	ContainerKind,
	ContainerContent,
	Action,
	Reaction,
	Phase
} from '../../data/types';
import { findReaction } from '../chemistry/reaction-engine';
import { findSubstance } from '../../data/substances';

// ============================================================
// Initial state
// ============================================================

const STARTER_SLOTS: ReadonlyArray<{ kind: ContainerKind; idx: number }> = [
	{ kind: 'beaker', idx: 0 },
	{ kind: 'beaker', idx: 1 },
	{ kind: 'test-tube', idx: 2 },
	{ kind: 'crucible', idx: 3 }
];

/** Стандартные условия: 25°C ≈ 298 K, атмосферное давление. */
export const ROOM_TEMPERATURE = 298;
export const ATMOSPHERIC_PRESSURE = 101325;

export function createInitialState(now: number = Date.now()): Experiment {
	return {
		id: `exp-${now}`,
		schemaVersion: 1,
		createdAt: now,
		updatedAt: now,
		containers: STARTER_SLOTS.map((s, i) => ({
			id: `c${i + 1}`,
			kind: s.kind,
			slotIndex: s.idx,
			contents: [],
			temperature: ROOM_TEMPERATURE
		})),
		actions: [],
		environment: { temperature: ROOM_TEMPERATURE, pressure: ATMOSPHERIC_PRESSURE }
	};
}

// ============================================================
// Reducer
// ============================================================

export interface ApplyOutcome {
	state: Experiment;
	/** Если action привёл к срабатыванию реакции — она здесь. */
	triggeredReaction?: { reaction: Reaction; containerId: string };
}

/**
 * Применить Action. Возвращает новое состояние и (опционально) сработавшую реакцию.
 * Никогда не мутирует входной state — возвращает новый объект.
 */
export function applyAction(state: Experiment, action: Action): ApplyOutcome {
	switch (action.type) {
		case 'add-substance':
			return reduceContainer(state, action.containerId, action, (c) =>
				appendContent(c, action.substanceId, action.amount)
			);

		case 'add-catalyst':
			return reduceContainer(state, action.containerId, action, (c) =>
				appendContent(c, action.catalystId, 1)
			);

		case 'mix':
			return reduceMix(state, action);

		case 'heat':
		case 'cool':
			return reduceContainer(state, action.containerId, action, (c) => ({
				...c,
				temperature: action.targetTemp
			}));

		case 'wait':
			// Ожидание не меняет содержимое, но может позже использоваться в reversible-реакциях.
			return { state: appendActionLog(state, action) };

		case 'add-container': {
			const id = nextContainerId(state);
			const newContainer: Container = {
				id,
				kind: action.kind,
				slotIndex: action.slotIndex,
				contents: [],
				temperature: state.environment.temperature
			};
			return {
				state: appendActionLog(
					{ ...state, containers: [...state.containers, newContainer] },
					action
				)
			};
		}

		case 'remove-container':
			return {
				state: appendActionLog(
					{
						...state,
						containers: state.containers.filter((c) => c.id !== action.containerId)
					},
					action
				)
			};
	}
}

// ============================================================
// Helpers (внутренние)
// ============================================================

function appendActionLog(state: Experiment, action: Action): Experiment {
	return {
		...state,
		actions: [...state.actions, action],
		updatedAt: action.t
	};
}

function nextContainerId(state: Experiment): string {
	// Простой счётчик: ищем максимальный c<N> и +1.
	let max = 0;
	for (const c of state.containers) {
		const m = /^c(\d+)$/.exec(c.id);
		if (m) max = Math.max(max, Number(m[1]));
	}
	return `c${max + 1}`;
}

function inferPhase(substanceId: string): Phase {
	const s = findSubstance(substanceId);
	return s?.defaultPhase ?? 'liquid';
}

function appendContent(c: Container, substanceId: string, amount: number): Container {
	if (!findSubstance(substanceId)) return c; // неизвестное вещество — игнорируем
	const phase = inferPhase(substanceId);
	const existing = c.contents.find((x) => x.substanceId === substanceId);
	const newContents: ContainerContent[] = existing
		? c.contents.map((x) =>
				x.substanceId === substanceId ? { ...x, amount: x.amount + amount } : x
			)
		: [...c.contents, { substanceId, amount, phase }];
	return { ...c, contents: newContents };
}

/**
 * Применить трансформацию к одному контейнеру + проверить реакцию в нём.
 * Если реакция найдена — содержимое заменяется на outputs.
 */
function reduceContainer(
	state: Experiment,
	containerId: string,
	action: Action,
	transform: (c: Container) => Container
): ApplyOutcome {
	let containers = state.containers.map((c) => (c.id === containerId ? transform(c) : c));
	const updated = containers.find((c) => c.id === containerId);
	let triggered: ApplyOutcome['triggeredReaction'];
	if (updated) {
		const reaction = findReactionForContainer(updated, state.environment);
		if (reaction) {
			containers = containers.map((c) =>
				c.id === containerId ? applyReactionOutputs(c, reaction) : c
			);
			triggered = { reaction, containerId };
		}
	}
	return {
		state: appendActionLog({ ...state, containers }, action),
		triggeredReaction: triggered
	};
}

function reduceMix(state: Experiment, action: Extract<Action, { type: 'mix' }>): ApplyOutcome {
	const source = state.containers.find((c) => c.id === action.sourceId);
	const target = state.containers.find((c) => c.id === action.targetId);
	if (!source || !target || source.id === target.id) {
		return { state: appendActionLog(state, action) };
	}

	// Сливаем contents источника в цель: одинаковые вещества складываются.
	const merged: ContainerContent[] = target.contents.map((c) => ({ ...c }));
	for (const item of source.contents) {
		const existing = merged.find((m) => m.substanceId === item.substanceId);
		if (existing) existing.amount += item.amount;
		else merged.push({ ...item });
	}

	let containers = state.containers.map((c) => {
		if (c.id === action.sourceId) return { ...c, contents: [] };
		if (c.id === action.targetId) return { ...c, contents: merged };
		return c;
	});

	const targetUpdated = containers.find((c) => c.id === action.targetId);
	let triggered: ApplyOutcome['triggeredReaction'];
	if (targetUpdated) {
		const reaction = findReactionForContainer(targetUpdated, state.environment);
		if (reaction) {
			containers = containers.map((c) =>
				c.id === action.targetId ? applyReactionOutputs(c, reaction) : c
			);
			triggered = { reaction, containerId: action.targetId };
		}
	}

	return {
		state: appendActionLog({ ...state, containers }, action),
		triggeredReaction: triggered
	};
}

function findReactionForContainer(
	c: Container,
	environment: Experiment['environment']
): Reaction | null {
	if (c.contents.length === 0) return null;
	return findReaction(
		c.contents.map((x) => ({ substanceId: x.substanceId, amount: x.amount, state: x.phase })),
		{
			temperature: c.temperature,
			pressure: environment.pressure,
			// Среда определяется наличием воды как основного компонента.
			// Уточнённая логика появится в Phase 4+.
			medium: c.contents.some((x) => x.phase === 'aqueous' || x.substanceId === 'water')
				? 'water'
				: 'air'
		}
	);
}

function applyReactionOutputs(c: Container, reaction: Reaction): Container {
	const newContents: ContainerContent[] = reaction.outputs.map((o) => ({
		substanceId: o.substanceId,
		amount: o.amount,
		phase: o.state ?? inferPhase(o.substanceId)
	}));
	return { ...c, contents: newContents };
}

// ============================================================
// Action factories — удобные обёртки для UI
// ============================================================

export function createAddSubstance(
	containerId: string,
	substanceId: string,
	amount: number,
	t: number = Date.now()
): Action {
	return { type: 'add-substance', containerId, substanceId, amount, t };
}

export function createHeat(
	containerId: string,
	targetTemp: number,
	t: number = Date.now()
): Action {
	return { type: 'heat', containerId, targetTemp, t };
}

export function createCool(
	containerId: string,
	targetTemp: number,
	t: number = Date.now()
): Action {
	return { type: 'cool', containerId, targetTemp, t };
}

export function createMix(sourceId: string, targetId: string, t: number = Date.now()): Action {
	return { type: 'mix', sourceId, targetId, t };
}

export function createAddContainer(
	kind: ContainerKind,
	slotIndex: number,
	t: number = Date.now()
): Action {
	return { type: 'add-container', kind, slotIndex, t };
}

export function createRemoveContainer(containerId: string, t: number = Date.now()): Action {
	return { type: 'remove-container', containerId, t };
}

// Тесты лабораторного reducer'а: чистота, добавление веществ, нагрев, mix,
// автоматическое срабатывание reaction-engine после изменений.

import { describe, expect, it } from 'vitest';
import {
	createInitialState,
	applyAction,
	createAddSubstance,
	createHeat,
	createMix
} from './lab-state';

describe('createInitialState', () => {
	it('создаёт 4 пустых контейнера при комнатной температуре', () => {
		const s = createInitialState(0);
		expect(s.containers).toHaveLength(4);
		expect(s.containers.every((c) => c.contents.length === 0)).toBe(true);
		expect(s.containers.every((c) => c.temperature === 298)).toBe(true);
		expect(s.environment.temperature).toBe(298);
		expect(s.actions).toHaveLength(0);
	});

	it('id-шники контейнеров уникальны: c1..c4', () => {
		const s = createInitialState(0);
		const ids = s.containers.map((c) => c.id).sort();
		expect(ids).toEqual(['c1', 'c2', 'c3', 'c4']);
	});
});

describe('applyAction — иммутабельность', () => {
	it('reducer не мутирует входной state', () => {
		const s0 = createInitialState(0);
		const snapshot = JSON.stringify(s0);
		applyAction(s0, createAddSubstance('c1', 'water', 1, 100));
		expect(JSON.stringify(s0)).toBe(snapshot);
	});

	it('action логируется в state.actions', () => {
		const s0 = createInitialState(0);
		const out = applyAction(s0, createAddSubstance('c1', 'water', 1, 100));
		expect(out.state.actions).toHaveLength(1);
		expect(out.state.actions[0].type).toBe('add-substance');
		expect(out.state.updatedAt).toBe(100);
	});
});

describe('add-substance', () => {
	it('добавляет вещество в указанный контейнер с правильной фазой', () => {
		const s0 = createInitialState(0);
		const { state } = applyAction(s0, createAddSubstance('c1', 'water', 2, 100));
		const c1 = state.containers.find((c) => c.id === 'c1')!;
		expect(c1.contents).toHaveLength(1);
		expect(c1.contents[0]).toEqual({ substanceId: 'water', amount: 2, phase: 'liquid' });
	});

	it('повторное добавление складывает amount', () => {
		let s = createInitialState(0);
		s = applyAction(s, createAddSubstance('c1', 'water', 1, 100)).state;
		s = applyAction(s, createAddSubstance('c1', 'water', 3, 200)).state;
		const c1 = s.containers.find((c) => c.id === 'c1')!;
		expect(c1.contents[0].amount).toBe(4);
	});

	it('неизвестный substance ID игнорируется (no-op кроме лога)', () => {
		const s0 = createInitialState(0);
		const { state } = applyAction(s0, createAddSubstance('c1', 'unobtanium', 1, 100));
		expect(state.containers.find((c) => c.id === 'c1')!.contents).toHaveLength(0);
		expect(state.actions).toHaveLength(1); // action всё равно записан
	});
});

describe('heat / cool', () => {
	it('heat меняет temperature контейнера', () => {
		const s0 = createInitialState(0);
		const { state } = applyAction(s0, createHeat('c1', 800, 100));
		expect(state.containers.find((c) => c.id === 'c1')!.temperature).toBe(800);
		expect(state.containers.find((c) => c.id === 'c2')!.temperature).toBe(298); // не задели
	});
});

describe('reaction integration — engine срабатывает после action', () => {
	it('HCl + NaOH в одном контейнере даёт NaCl + H₂O', () => {
		let s = createInitialState(0);
		s = applyAction(s, createAddSubstance('c1', 'hydrochloric-acid', 1, 100)).state;

		// До второго реагента — реакции нет.
		const c1Before = s.containers.find((c) => c.id === 'c1')!;
		expect(c1Before.contents.map((x) => x.substanceId)).toEqual(['hydrochloric-acid']);

		const out = applyAction(s, createAddSubstance('c1', 'sodium-hydroxide', 1, 200));
		expect(out.triggeredReaction?.reaction.id).toBe('hcl-naoh');

		const c1After = out.state.containers.find((c) => c.id === 'c1')!;
		const ids = c1After.contents.map((x) => x.substanceId).sort();
		expect(ids).toEqual(['sodium-chloride', 'water']);
	});

	it('CH₄ + O₂ при холоде — реакции нет, при нагреве — горение', () => {
		let s = createInitialState(0);
		s = applyAction(s, createAddSubstance('c1', 'methane', 1, 100)).state;
		const cold = applyAction(s, createAddSubstance('c1', 'oxygen-gas', 2, 200));
		expect(cold.triggeredReaction).toBeUndefined();

		const hot = applyAction(cold.state, createHeat('c1', 1000, 300));
		expect(hot.triggeredReaction?.reaction.id).toBe('methane-combustion');

		const c1 = hot.state.containers.find((c) => c.id === 'c1')!;
		const ids = c1.contents.map((x) => x.substanceId).sort();
		expect(ids).toEqual(['carbon-dioxide', 'water']);
	});

	it('каталитическое разложение H₂O₂ + MnO₂', () => {
		let s = createInitialState(0);
		s = applyAction(s, createAddSubstance('c1', 'hydrogen-peroxide', 2, 100)).state;
		const out = applyAction(s, createAddSubstance('c1', 'manganese-dioxide', 1, 200));
		expect(out.triggeredReaction?.reaction.id).toBe('h2o2-mno2-decomp');
	});
});

describe('mix — слияние содержимого', () => {
	it('mix склеивает содержимое двух контейнеров и опустошает источник', () => {
		let s = createInitialState(0);
		s = applyAction(s, createAddSubstance('c1', 'hydrochloric-acid', 1, 100)).state;
		s = applyAction(s, createAddSubstance('c2', 'sodium-hydroxide', 1, 200)).state;
		const out = applyAction(s, createMix('c1', 'c2', 300));

		// Источник опустошён.
		const c1 = out.state.containers.find((c) => c.id === 'c1')!;
		expect(c1.contents).toHaveLength(0);

		// Цель содержит продукты реакции.
		expect(out.triggeredReaction?.reaction.id).toBe('hcl-naoh');
		const c2 = out.state.containers.find((c) => c.id === 'c2')!;
		const ids = c2.contents.map((x) => x.substanceId).sort();
		expect(ids).toEqual(['sodium-chloride', 'water']);
	});

	it('mix самого с собой — no-op', () => {
		let s = createInitialState(0);
		s = applyAction(s, createAddSubstance('c1', 'water', 1, 100)).state;
		const out = applyAction(s, createMix('c1', 'c1', 200));
		expect(out.state.containers.find((c) => c.id === 'c1')!.contents).toHaveLength(1);
	});

	it('mix несуществующего контейнера — no-op кроме лога', () => {
		const s = createInitialState(0);
		const out = applyAction(s, createMix('c1', 'cZZ', 200));
		expect(out.state.actions).toHaveLength(1);
	});
});

describe('add-container / remove-container', () => {
	it('add-container даёт новый id', () => {
		const s0 = createInitialState(0);
		const out = applyAction(s0, {
			type: 'add-container',
			kind: 'flask',
			slotIndex: 4,
			t: 100
		});
		expect(out.state.containers).toHaveLength(5);
		expect(out.state.containers[4].id).toBe('c5');
		expect(out.state.containers[4].kind).toBe('flask');
	});

	it('remove-container удаляет по id', () => {
		const s0 = createInitialState(0);
		const out = applyAction(s0, { type: 'remove-container', containerId: 'c2', t: 100 });
		expect(out.state.containers.map((c) => c.id)).toEqual(['c1', 'c3', 'c4']);
	});
});

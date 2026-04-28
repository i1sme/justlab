// Качественные реакции окрашивания пламени — атомная эмиссия щелочных и щёлочноземельных металлов.
// Технически это физическое явление, не химическая реакция, но для UX лаборатории
// представляем как «реакция»: вход = металл, условие = высокая температура.

import type { Reaction } from '../types';

const FLAME_DURATION = 3;

export const FLAME_TEST_REACTIONS: readonly Reaction[] = [
	{
		id: 'flame-test-na',
		category: 'flame-test',
		inputs: [{ substanceId: 'Na', amount: 1, state: 'solid' }],
		outputs: [{ substanceId: 'Na', amount: 1, state: 'gas' }], // ионизированный пар
		conditions: { temperature: { min: 700 } },
		reversible: false,
		duration: FLAME_DURATION,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.4,
				effects: [
					{ kind: 'flame', intensity: 1, color: '#ffd23f' },
					{ kind: 'glow', intensity: 0.9, color: '#ffd23f' }
				]
			},
			{ t: FLAME_DURATION, effects: [] }
		],
		equation: 'Na (в пламени) → ярко-жёлтое свечение',
		description: {
			ru: 'Натрий окрашивает пламя в характерный жёлтый цвет — линии D натрия (589 нм). Используется в аналитической химии.',
			en: 'Sodium colors a flame characteristically yellow — sodium D-lines (589 nm). Used in analytical chemistry.'
		},
		glossaryRefs: ['atom', 'electron'],
		difficulty: 'school',
		tags: ['classic', 'qualitative-test', 'spectacular']
	},
	{
		id: 'flame-test-k',
		category: 'flame-test',
		inputs: [{ substanceId: 'K', amount: 1, state: 'solid' }],
		outputs: [{ substanceId: 'K', amount: 1, state: 'gas' }],
		conditions: { temperature: { min: 700 } },
		reversible: false,
		duration: FLAME_DURATION,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.4,
				effects: [
					{ kind: 'flame', intensity: 1, color: '#a64bf4' },
					{ kind: 'glow', intensity: 0.8, color: '#a64bf4' }
				]
			},
			{ t: FLAME_DURATION, effects: [] }
		],
		equation: 'K (в пламени) → фиолетовое свечение',
		description: {
			ru: 'Калий окрашивает пламя в фиолетовый цвет. Чтобы его увидеть на фоне натрия, смотрят через синее кобальтовое стекло.',
			en: 'Potassium colors flame violet. To see it past sodium contamination, observe through blue cobalt glass.'
		},
		glossaryRefs: ['atom', 'electron'],
		difficulty: 'school',
		tags: ['classic', 'qualitative-test']
	},
	{
		id: 'flame-test-ca',
		category: 'flame-test',
		inputs: [{ substanceId: 'Ca', amount: 1, state: 'solid' }],
		outputs: [{ substanceId: 'Ca', amount: 1, state: 'gas' }],
		conditions: { temperature: { min: 800 } },
		reversible: false,
		duration: FLAME_DURATION,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.4,
				effects: [
					{ kind: 'flame', intensity: 1, color: '#ff7e36' },
					{ kind: 'glow', intensity: 0.9, color: '#ff7e36' }
				]
			},
			{ t: FLAME_DURATION, effects: [] }
		],
		equation: 'Ca (в пламени) → кирпично-красное свечение',
		description: {
			ru: 'Кальций даёт оранжево-красное (кирпично-красное) пламя. Часто видно при горении кальцийсодержащих минералов.',
			en: 'Calcium gives an orange-red (brick-red) flame. Often visible when calcium-containing minerals burn.'
		},
		glossaryRefs: ['atom', 'electron'],
		difficulty: 'school',
		tags: ['qualitative-test']
	},
	{
		id: 'flame-test-cu',
		category: 'flame-test',
		inputs: [{ substanceId: 'Cu', amount: 1, state: 'solid' }],
		outputs: [{ substanceId: 'Cu', amount: 1, state: 'gas' }],
		conditions: { temperature: { min: 900 } },
		reversible: false,
		duration: FLAME_DURATION,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.4,
				effects: [
					{ kind: 'flame', intensity: 1, color: '#37e89e' },
					{ kind: 'glow', intensity: 0.8, color: '#37e89e' }
				]
			},
			{ t: FLAME_DURATION, effects: [] }
		],
		equation: 'Cu (в пламени) → изумрудно-зелёное свечение',
		description: {
			ru: 'Медь даёт яркое изумрудно-зелёное пламя. Используется в фейерверках для зелёных огней.',
			en: 'Copper gives a bright emerald-green flame. Used in fireworks to produce green fire.'
		},
		glossaryRefs: ['atom', 'electron'],
		difficulty: 'school',
		tags: ['qualitative-test', 'spectacular']
	}
];

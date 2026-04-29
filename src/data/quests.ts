// Курируемые мини-цели для лаборатории. Используют существующие реакции из БД,
// никаких новых выдуманных продуктов (CLAUDE.md, принцип №3).
//
// На v1 поддерживаем единственный тип цели — `reaction-triggered`: ученик
// должен получить именно эту реакцию (id из reactions/). В будущем можно
// добавить produce-substance / mix-without-reaction / temperature-target.

import type { Difficulty } from './types';

export type QuestGoal =
	/** Сработала конкретная реакция. */
	{ kind: 'reaction-triggered'; reactionId: string };

export interface Quest {
	id: string;
	difficulty: Difficulty;
	/** Категория для группировки в UI. */
	category: 'salt' | 'precipitate' | 'gas' | 'flame' | 'combustion';
	title: { ru: string; en: string };
	description: { ru: string; en: string };
	hint?: { ru: string; en: string };
	goal: QuestGoal;
}

export const QUESTS: readonly Quest[] = [
	{
		id: 'q-table-salt',
		difficulty: 'beginner',
		category: 'salt',
		title: {
			ru: 'Получи поваренную соль',
			en: 'Make table salt'
		},
		description: {
			ru: 'Соль NaCl — самая известная в мире. Её можно получить нейтрализацией кислоты основанием.',
			en: 'NaCl is the world’s best-known salt. Get it by neutralising an acid with a base.'
		},
		hint: {
			ru: 'Подсказка: соляная кислота + гидроксид натрия.',
			en: 'Hint: hydrochloric acid + sodium hydroxide.'
		},
		goal: { kind: 'reaction-triggered', reactionId: 'hcl-naoh' }
	},
	{
		id: 'q-silver-precipitate',
		difficulty: 'school',
		category: 'precipitate',
		title: {
			ru: 'Получи белый осадок',
			en: 'Make a white precipitate'
		},
		description: {
			ru: 'AgCl — нерастворимый творожистый осадок. Классика качественного анализа на ион Cl⁻.',
			en: 'AgCl is an insoluble curd-like precipitate. A classic test for Cl⁻ ion.'
		},
		hint: {
			ru: 'Подсказка: смешай нитрат серебра и хлорид натрия в водном растворе.',
			en: 'Hint: mix silver nitrate with sodium chloride in aqueous solution.'
		},
		goal: { kind: 'reaction-triggered', reactionId: 'agno3-nacl' }
	},
	{
		id: 'q-hydrogen-gas',
		difficulty: 'school',
		category: 'gas',
		title: {
			ru: 'Выдели водород',
			en: 'Evolve hydrogen gas'
		},
		description: {
			ru: 'Активный металл вытесняет водород из кислоты — пузырьки H₂.',
			en: 'An active metal displaces hydrogen from an acid — H₂ bubbles up.'
		},
		hint: {
			ru: 'Подсказка: цинк (или магний) + соляная кислота.',
			en: 'Hint: zinc (or magnesium) + hydrochloric acid.'
		},
		goal: { kind: 'reaction-triggered', reactionId: 'zn-hcl' }
	},
	{
		id: 'q-flame-yellow',
		difficulty: 'school',
		category: 'flame',
		title: {
			ru: 'Зажги жёлтое пламя',
			en: 'Ignite a yellow flame'
		},
		description: {
			ru: 'Соединения натрия дают характерный ярко-жёлтый цвет пламени — линия 589 нм.',
			en: 'Sodium compounds colour a flame bright yellow — the 589 nm line.'
		},
		hint: {
			ru: 'Подсказка: положи натрий в тигель и нагрей.',
			en: 'Hint: put sodium in a crucible and heat it.'
		},
		goal: { kind: 'reaction-triggered', reactionId: 'flame-test-na' }
	},
	{
		id: 'q-burn-magnesium',
		difficulty: 'school',
		category: 'combustion',
		title: {
			ru: 'Сожги магний',
			en: 'Burn magnesium'
		},
		description: {
			ru: 'Магний горит ослепительно ярким белым пламенем, образуя оксид MgO.',
			en: 'Magnesium burns with a blinding white flame, forming MgO.'
		},
		hint: {
			ru: 'Подсказка: смешай магний и кислород в тигле, нагрей до воспламенения.',
			en: 'Hint: mix magnesium and oxygen in a crucible, heat to ignition.'
		},
		goal: { kind: 'reaction-triggered', reactionId: 'magnesium-combustion' }
	}
] as const;

export function findQuest(id: string): Quest | undefined {
	return QUESTS.find((q) => q.id === id);
}

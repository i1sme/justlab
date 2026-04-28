// Курируемая БД неорганических соединений: соли, гидроксиды, оксиды, гидриды,
// двухатомные газы. Используются в reaction-engine и инвентаре лаборатории,
// но НЕ показываются в MoleculeLibrary (там SMILES молекулярных соединений,
// ионные SMILES типа `[Na+].[OH-]` рендерятся как разделённые ионы).
//
// Добавляем новое соединение только если оно фигурирует в seed-реакциях.

import type { Substance } from './types';

export const INORGANIC_SUBSTANCES: readonly Substance[] = [
	// === Двухатомные газы (H₂, O₂, N₂, Cl₂) ===
	{
		id: 'hydrogen-gas',
		kind: 'molecule',
		formula: 'H₂',
		names: { ru: 'Водород (газ)', en: 'Hydrogen gas' },
		phases: { gas: { color: '#ffffff', opacity: 0.15 } },
		defaultPhase: 'gas',
		boilingPoint: 20.3,
		molarMass: 2.016,
		hazards: ['flammable'],
		glossaryRefs: ['molecule'],
		difficulty: 'school'
	},
	{
		id: 'oxygen-gas',
		kind: 'molecule',
		formula: 'O₂',
		names: { ru: 'Кислород (газ)', en: 'Oxygen gas' },
		phases: { gas: { color: '#bfdbfe', opacity: 0.2 } },
		defaultPhase: 'gas',
		boilingPoint: 90.2,
		molarMass: 31.998,
		hazards: ['oxidizing'],
		glossaryRefs: ['molecule'],
		difficulty: 'school'
	},
	{
		id: 'nitrogen-gas',
		kind: 'molecule',
		formula: 'N₂',
		names: { ru: 'Азот (газ)', en: 'Nitrogen gas' },
		phases: { gas: { color: '#e0e7ff', opacity: 0.15 } },
		defaultPhase: 'gas',
		boilingPoint: 77.4,
		molarMass: 28.014,
		glossaryRefs: ['molecule'],
		difficulty: 'school'
	},

	// === Гидроксиды (щёлочи) ===
	{
		id: 'sodium-hydroxide',
		kind: 'molecule',
		formula: 'NaOH',
		names: { ru: 'Гидроксид натрия (едкий натр)', en: 'Sodium hydroxide' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { color: '#ffffff', opacity: 0.7 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 591,
		boilingPoint: 1661,
		molarMass: 39.997,
		hazards: ['corrosive'],
		glossaryRefs: ['base'],
		difficulty: 'school'
	},
	{
		id: 'potassium-hydroxide',
		kind: 'molecule',
		formula: 'KOH',
		names: { ru: 'Гидроксид калия (едкое кали)', en: 'Potassium hydroxide' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { color: '#ffffff', opacity: 0.7 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 633,
		boilingPoint: 1600,
		molarMass: 56.106,
		hazards: ['corrosive'],
		glossaryRefs: ['base'],
		difficulty: 'school'
	},
	{
		id: 'copper-hydroxide-ii',
		kind: 'molecule',
		formula: 'Cu(OH)₂',
		names: { ru: 'Гидроксид меди (II)', en: 'Copper(II) hydroxide' },
		phases: { solid: { color: '#3b82f6' } }, // голубой осадок
		defaultPhase: 'solid',
		molarMass: 97.561,
		glossaryRefs: ['base'],
		difficulty: 'school'
	},

	// === Соли (хлориды, нитраты, сульфаты, ацетаты) ===
	{
		id: 'sodium-chloride',
		kind: 'molecule',
		formula: 'NaCl',
		names: { ru: 'Хлорид натрия (поваренная соль)', en: 'Sodium chloride' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'solid',
		meltingPoint: 1074,
		boilingPoint: 1738,
		molarMass: 58.443,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'potassium-sulfate',
		kind: 'molecule',
		formula: 'K₂SO₄',
		names: { ru: 'Сульфат калия', en: 'Potassium sulfate' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 1342,
		molarMass: 174.259,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'sodium-acetate',
		kind: 'molecule',
		formula: 'CH₃COONa',
		names: { ru: 'Ацетат натрия', en: 'Sodium acetate' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		molarMass: 82.034,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'sodium-nitrate',
		kind: 'molecule',
		formula: 'NaNO₃',
		names: { ru: 'Нитрат натрия', en: 'Sodium nitrate' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		molarMass: 84.995,
		hazards: ['oxidizing'],
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'silver-nitrate',
		kind: 'molecule',
		formula: 'AgNO₃',
		names: { ru: 'Нитрат серебра', en: 'Silver nitrate' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 482,
		molarMass: 169.873,
		hazards: ['corrosive', 'oxidizing'],
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'silver-chloride',
		kind: 'molecule',
		formula: 'AgCl',
		names: { ru: 'Хлорид серебра', en: 'Silver chloride' },
		phases: { solid: { color: '#fafafa' } }, // белый творожистый осадок
		defaultPhase: 'solid',
		meltingPoint: 728,
		molarMass: 143.321,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'barium-chloride',
		kind: 'molecule',
		formula: 'BaCl₂',
		names: { ru: 'Хлорид бария', en: 'Barium chloride' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 1235,
		molarMass: 208.23,
		hazards: ['toxic'],
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'barium-sulfate',
		kind: 'molecule',
		formula: 'BaSO₄',
		names: { ru: 'Сульфат бария', en: 'Barium sulfate' },
		phases: { solid: { color: '#ffffff' } }, // белый осадок
		defaultPhase: 'solid',
		meltingPoint: 1853,
		molarMass: 233.39,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'sodium-sulfate',
		kind: 'molecule',
		formula: 'Na₂SO₄',
		names: { ru: 'Сульфат натрия', en: 'Sodium sulfate' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 1157,
		molarMass: 142.04,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'copper-sulfate',
		kind: 'molecule',
		formula: 'CuSO₄',
		names: { ru: 'Сульфат меди (медный купорос)', en: 'Copper(II) sulfate' },
		phases: {
			solid: { color: '#1e88e5' }, // синие кристаллы пентагидрата
			aqueous: { color: '#42a5f5', opacity: 0.7 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 383,
		molarMass: 159.609,
		hazards: ['harmful'],
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'iron-sulfate-ii',
		kind: 'molecule',
		formula: 'FeSO₄',
		names: { ru: 'Сульфат железа (II) (железный купорос)', en: 'Iron(II) sulfate' },
		phases: {
			solid: { color: '#a5d6a7' }, // светло-зелёные кристаллы гептагидрата
			aqueous: { color: '#a5d6a7', opacity: 0.7 }
		},
		defaultPhase: 'aqueous',
		molarMass: 151.908,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'zinc-chloride',
		kind: 'molecule',
		formula: 'ZnCl₂',
		names: { ru: 'Хлорид цинка', en: 'Zinc chloride' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 563,
		molarMass: 136.286,
		hazards: ['corrosive'],
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'magnesium-chloride',
		kind: 'molecule',
		formula: 'MgCl₂',
		names: { ru: 'Хлорид магния', en: 'Magnesium chloride' },
		phases: {
			solid: { color: '#ffffff' },
			aqueous: { opacity: 0.95 }
		},
		defaultPhase: 'aqueous',
		meltingPoint: 987,
		molarMass: 95.211,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},

	// === Оксиды и карбонаты ===
	{
		id: 'magnesium-oxide',
		kind: 'molecule',
		formula: 'MgO',
		names: { ru: 'Оксид магния', en: 'Magnesium oxide' },
		phases: { solid: { color: '#fafafa' } },
		defaultPhase: 'solid',
		meltingPoint: 3125,
		molarMass: 40.304,
		glossaryRefs: ['compound'],
		difficulty: 'school'
	},
	{
		id: 'calcium-oxide',
		kind: 'molecule',
		formula: 'CaO',
		names: { ru: 'Оксид кальция (негашёная известь)', en: 'Calcium oxide' },
		phases: { solid: { color: '#ffffff' } },
		defaultPhase: 'solid',
		meltingPoint: 2886,
		molarMass: 56.077,
		hazards: ['corrosive'],
		glossaryRefs: ['compound'],
		difficulty: 'school'
	},
	{
		id: 'calcium-carbonate',
		kind: 'molecule',
		formula: 'CaCO₃',
		names: { ru: 'Карбонат кальция (известняк)', en: 'Calcium carbonate' },
		phases: { solid: { color: '#fafafa' } },
		defaultPhase: 'solid',
		molarMass: 100.087,
		glossaryRefs: ['salt'],
		difficulty: 'school'
	},
	{
		id: 'manganese-dioxide',
		kind: 'molecule',
		formula: 'MnO₂',
		names: { ru: 'Диоксид марганца', en: 'Manganese dioxide' },
		phases: { solid: { color: '#1f1f1f' } }, // тёмно-чёрный порошок-катализатор
		defaultPhase: 'solid',
		molarMass: 86.937,
		hazards: ['oxidizing'],
		glossaryRefs: ['catalyst'],
		difficulty: 'school'
	}
];

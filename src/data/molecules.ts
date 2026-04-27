// Курируемая БД молекул: для дружественного ввода без знания SMILES.
// Поля: SMILES для парсинга, классическая формула для UI, локализованные имена,
// категория для группировки в UI.
//
// Источник: общеизвестная химия, школьная программа и популярные вещества.
// SMILES вручную выверены на парсимость через OpenChemLib.

export type MoleculeCategoryKey =
	| 'inorganic'
	| 'acid'
	| 'organic'
	| 'aromatic'
	| 'biology'
	| 'drug';

export interface CuratedMolecule {
	key: string;
	smiles: string;
	/** Классическая «школьная» формула для отображения. */
	formula: string;
	name: { ru: string; en: string };
	category: MoleculeCategoryKey;
}

export const MOLECULES: readonly CuratedMolecule[] = [
	// --- Неорганика ---
	{
		key: 'water',
		smiles: 'O',
		formula: 'H₂O',
		name: { ru: 'Вода', en: 'Water' },
		category: 'inorganic'
	},
	{
		key: 'ammonia',
		smiles: 'N',
		formula: 'NH₃',
		name: { ru: 'Аммиак', en: 'Ammonia' },
		category: 'inorganic'
	},
	{
		key: 'carbon-dioxide',
		smiles: 'O=C=O',
		formula: 'CO₂',
		name: { ru: 'Углекислый газ', en: 'Carbon dioxide' },
		category: 'inorganic'
	},
	{
		key: 'sulfur-dioxide',
		smiles: 'O=S=O',
		formula: 'SO₂',
		name: { ru: 'Диоксид серы', en: 'Sulfur dioxide' },
		category: 'inorganic'
	},
	{
		key: 'hydrogen-peroxide',
		smiles: 'OO',
		formula: 'H₂O₂',
		name: { ru: 'Перекись водорода', en: 'Hydrogen peroxide' },
		category: 'inorganic'
	},

	// --- Кислоты ---
	{
		key: 'hydrochloric-acid',
		smiles: 'Cl',
		formula: 'HCl',
		name: { ru: 'Соляная кислота', en: 'Hydrochloric acid' },
		category: 'acid'
	},
	{
		key: 'sulfuric-acid',
		smiles: 'OS(=O)(=O)O',
		formula: 'H₂SO₄',
		name: { ru: 'Серная кислота', en: 'Sulfuric acid' },
		category: 'acid'
	},
	{
		key: 'nitric-acid',
		smiles: 'O[N+](=O)[O-]',
		formula: 'HNO₃',
		name: { ru: 'Азотная кислота', en: 'Nitric acid' },
		category: 'acid'
	},
	{
		key: 'acetic-acid',
		smiles: 'CC(=O)O',
		formula: 'CH₃COOH',
		name: { ru: 'Уксусная кислота', en: 'Acetic acid' },
		category: 'acid'
	},
	{
		key: 'formic-acid',
		smiles: 'C(=O)O',
		formula: 'HCOOH',
		name: { ru: 'Муравьиная кислота', en: 'Formic acid' },
		category: 'acid'
	},
	{
		key: 'carbonic-acid',
		smiles: 'OC(=O)O',
		formula: 'H₂CO₃',
		name: { ru: 'Угольная кислота', en: 'Carbonic acid' },
		category: 'acid'
	},

	// --- Простая органика ---
	{
		key: 'methane',
		smiles: 'C',
		formula: 'CH₄',
		name: { ru: 'Метан', en: 'Methane' },
		category: 'organic'
	},
	{
		key: 'ethane',
		smiles: 'CC',
		formula: 'C₂H₆',
		name: { ru: 'Этан', en: 'Ethane' },
		category: 'organic'
	},
	{
		key: 'ethanol',
		smiles: 'CCO',
		formula: 'C₂H₆O',
		name: { ru: 'Этанол (спирт)', en: 'Ethanol' },
		category: 'organic'
	},
	{
		key: 'methanol',
		smiles: 'CO',
		formula: 'CH₃OH',
		name: { ru: 'Метанол', en: 'Methanol' },
		category: 'organic'
	},
	{
		key: 'acetone',
		smiles: 'CC(C)=O',
		formula: 'C₃H₆O',
		name: { ru: 'Ацетон', en: 'Acetone' },
		category: 'organic'
	},
	{
		key: 'glycerol',
		smiles: 'OCC(O)CO',
		formula: 'C₃H₈O₃',
		name: { ru: 'Глицерин', en: 'Glycerol' },
		category: 'organic'
	},
	{
		key: 'ethylene',
		smiles: 'C=C',
		formula: 'C₂H₄',
		name: { ru: 'Этилен', en: 'Ethylene' },
		category: 'organic'
	},

	// --- Ароматика ---
	{
		key: 'benzene',
		smiles: 'c1ccccc1',
		formula: 'C₆H₆',
		name: { ru: 'Бензол', en: 'Benzene' },
		category: 'aromatic'
	},
	{
		key: 'toluene',
		smiles: 'Cc1ccccc1',
		formula: 'C₇H₈',
		name: { ru: 'Толуол', en: 'Toluene' },
		category: 'aromatic'
	},
	{
		key: 'phenol',
		smiles: 'Oc1ccccc1',
		formula: 'C₆H₆O',
		name: { ru: 'Фенол', en: 'Phenol' },
		category: 'aromatic'
	},
	{
		key: 'naphthalene',
		smiles: 'c1ccc2ccccc2c1',
		formula: 'C₁₀H₈',
		name: { ru: 'Нафталин', en: 'Naphthalene' },
		category: 'aromatic'
	},

	// --- Биохимия ---
	{
		key: 'glucose',
		smiles: 'OC[C@H]1O[C@H](O)[C@H](O)[C@@H](O)[C@@H]1O',
		formula: 'C₆H₁₂O₆',
		name: { ru: 'Глюкоза', en: 'Glucose' },
		category: 'biology'
	},
	{
		key: 'glycine',
		smiles: 'NCC(=O)O',
		formula: 'C₂H₅NO₂',
		name: { ru: 'Глицин', en: 'Glycine' },
		category: 'biology'
	},
	{
		key: 'alanine',
		smiles: 'C[C@@H](N)C(=O)O',
		formula: 'C₃H₇NO₂',
		name: { ru: 'Аланин', en: 'Alanine' },
		category: 'biology'
	},
	{
		key: 'urea',
		smiles: 'NC(=O)N',
		formula: 'CH₄N₂O',
		name: { ru: 'Мочевина', en: 'Urea' },
		category: 'biology'
	},
	{
		key: 'lactic-acid',
		smiles: 'CC(O)C(=O)O',
		formula: 'C₃H₆O₃',
		name: { ru: 'Молочная кислота', en: 'Lactic acid' },
		category: 'biology'
	},

	// --- Лекарства / повседневные вещества ---
	{
		key: 'aspirin',
		smiles: 'CC(=O)Oc1ccccc1C(=O)O',
		formula: 'C₉H₈O₄',
		name: { ru: 'Аспирин', en: 'Aspirin' },
		category: 'drug'
	},
	{
		key: 'paracetamol',
		smiles: 'CC(=O)Nc1ccc(O)cc1',
		formula: 'C₈H₉NO₂',
		name: { ru: 'Парацетамол', en: 'Paracetamol' },
		category: 'drug'
	},
	{
		key: 'caffeine',
		smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
		formula: 'C₈H₁₀N₄O₂',
		name: { ru: 'Кофеин', en: 'Caffeine' },
		category: 'drug'
	},
	{
		key: 'vitamin-c',
		smiles: 'OC[C@H](O)[C@H]1OC(=O)C(O)=C1O',
		formula: 'C₆H₈O₆',
		name: { ru: 'Витамин C', en: 'Vitamin C' },
		category: 'drug'
	}
];

export const MOLECULE_CATEGORIES: readonly MoleculeCategoryKey[] = [
	'inorganic',
	'acid',
	'organic',
	'aromatic',
	'biology',
	'drug'
];

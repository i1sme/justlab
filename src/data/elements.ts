// Курируемая БД 118 элементов периодической таблицы.
// Источники: IUPAC CIAAW 2021 (атомные массы), стандартная классификация по категориям.
// gridCol/gridRow — позиция в 18-колоночной "длинной" таблице.
// Лантаноиды (57-71) → row 8, cols 3-17; актиноиды (89-103) → row 9, cols 3-17.

export type ElementCategory =
	| 'alkali-metal'
	| 'alkaline-earth-metal'
	| 'transition-metal'
	| 'post-transition-metal'
	| 'metalloid'
	| 'nonmetal'
	| 'halogen'
	| 'noble-gas'
	| 'lanthanoid'
	| 'actinoid';

export type ElementBlock = 's' | 'p' | 'd' | 'f';

export interface PeriodicElement {
	/** Atomic number, 1..118 */
	number: number;
	/** IUPAC symbol, e.g. "H", "Fe" */
	symbol: string;
	/** Localised names */
	name: { ru: string; en: string };
	/** Standard atomic weight (или массовое число для синтетических, по IUPAC) */
	atomicMass: number;
	category: ElementCategory;
	/** 1..18 для основной таблицы; null для f-блока */
	group: number | null;
	/** 1..7 — реальный период (не строка в gridRow) */
	period: number;
	block: ElementBlock;
	/** 1..18 — колонка в визуальной сетке */
	gridCol: number;
	/** 1..9 — строка в визуальной сетке (8 = lanthanoids, 9 = actinoids) */
	gridRow: number;
}

/** Все 118 элементов в порядке возрастания атомного номера. */
export const ELEMENTS: readonly PeriodicElement[] = [
	// Период 1
	{
		number: 1,
		symbol: 'H',
		name: { ru: 'Водород', en: 'Hydrogen' },
		atomicMass: 1.008,
		category: 'nonmetal',
		group: 1,
		period: 1,
		block: 's',
		gridCol: 1,
		gridRow: 1
	},
	{
		number: 2,
		symbol: 'He',
		name: { ru: 'Гелий', en: 'Helium' },
		atomicMass: 4.0026,
		category: 'noble-gas',
		group: 18,
		period: 1,
		block: 's',
		gridCol: 18,
		gridRow: 1
	},

	// Период 2
	{
		number: 3,
		symbol: 'Li',
		name: { ru: 'Литий', en: 'Lithium' },
		atomicMass: 6.94,
		category: 'alkali-metal',
		group: 1,
		period: 2,
		block: 's',
		gridCol: 1,
		gridRow: 2
	},
	{
		number: 4,
		symbol: 'Be',
		name: { ru: 'Бериллий', en: 'Beryllium' },
		atomicMass: 9.0122,
		category: 'alkaline-earth-metal',
		group: 2,
		period: 2,
		block: 's',
		gridCol: 2,
		gridRow: 2
	},
	{
		number: 5,
		symbol: 'B',
		name: { ru: 'Бор', en: 'Boron' },
		atomicMass: 10.81,
		category: 'metalloid',
		group: 13,
		period: 2,
		block: 'p',
		gridCol: 13,
		gridRow: 2
	},
	{
		number: 6,
		symbol: 'C',
		name: { ru: 'Углерод', en: 'Carbon' },
		atomicMass: 12.011,
		category: 'nonmetal',
		group: 14,
		period: 2,
		block: 'p',
		gridCol: 14,
		gridRow: 2
	},
	{
		number: 7,
		symbol: 'N',
		name: { ru: 'Азот', en: 'Nitrogen' },
		atomicMass: 14.007,
		category: 'nonmetal',
		group: 15,
		period: 2,
		block: 'p',
		gridCol: 15,
		gridRow: 2
	},
	{
		number: 8,
		symbol: 'O',
		name: { ru: 'Кислород', en: 'Oxygen' },
		atomicMass: 15.999,
		category: 'nonmetal',
		group: 16,
		period: 2,
		block: 'p',
		gridCol: 16,
		gridRow: 2
	},
	{
		number: 9,
		symbol: 'F',
		name: { ru: 'Фтор', en: 'Fluorine' },
		atomicMass: 18.998,
		category: 'halogen',
		group: 17,
		period: 2,
		block: 'p',
		gridCol: 17,
		gridRow: 2
	},
	{
		number: 10,
		symbol: 'Ne',
		name: { ru: 'Неон', en: 'Neon' },
		atomicMass: 20.18,
		category: 'noble-gas',
		group: 18,
		period: 2,
		block: 'p',
		gridCol: 18,
		gridRow: 2
	},

	// Период 3
	{
		number: 11,
		symbol: 'Na',
		name: { ru: 'Натрий', en: 'Sodium' },
		atomicMass: 22.99,
		category: 'alkali-metal',
		group: 1,
		period: 3,
		block: 's',
		gridCol: 1,
		gridRow: 3
	},
	{
		number: 12,
		symbol: 'Mg',
		name: { ru: 'Магний', en: 'Magnesium' },
		atomicMass: 24.305,
		category: 'alkaline-earth-metal',
		group: 2,
		period: 3,
		block: 's',
		gridCol: 2,
		gridRow: 3
	},
	{
		number: 13,
		symbol: 'Al',
		name: { ru: 'Алюминий', en: 'Aluminium' },
		atomicMass: 26.982,
		category: 'post-transition-metal',
		group: 13,
		period: 3,
		block: 'p',
		gridCol: 13,
		gridRow: 3
	},
	{
		number: 14,
		symbol: 'Si',
		name: { ru: 'Кремний', en: 'Silicon' },
		atomicMass: 28.085,
		category: 'metalloid',
		group: 14,
		period: 3,
		block: 'p',
		gridCol: 14,
		gridRow: 3
	},
	{
		number: 15,
		symbol: 'P',
		name: { ru: 'Фосфор', en: 'Phosphorus' },
		atomicMass: 30.974,
		category: 'nonmetal',
		group: 15,
		period: 3,
		block: 'p',
		gridCol: 15,
		gridRow: 3
	},
	{
		number: 16,
		symbol: 'S',
		name: { ru: 'Сера', en: 'Sulfur' },
		atomicMass: 32.06,
		category: 'nonmetal',
		group: 16,
		period: 3,
		block: 'p',
		gridCol: 16,
		gridRow: 3
	},
	{
		number: 17,
		symbol: 'Cl',
		name: { ru: 'Хлор', en: 'Chlorine' },
		atomicMass: 35.45,
		category: 'halogen',
		group: 17,
		period: 3,
		block: 'p',
		gridCol: 17,
		gridRow: 3
	},
	{
		number: 18,
		symbol: 'Ar',
		name: { ru: 'Аргон', en: 'Argon' },
		atomicMass: 39.95,
		category: 'noble-gas',
		group: 18,
		period: 3,
		block: 'p',
		gridCol: 18,
		gridRow: 3
	},

	// Период 4
	{
		number: 19,
		symbol: 'K',
		name: { ru: 'Калий', en: 'Potassium' },
		atomicMass: 39.098,
		category: 'alkali-metal',
		group: 1,
		period: 4,
		block: 's',
		gridCol: 1,
		gridRow: 4
	},
	{
		number: 20,
		symbol: 'Ca',
		name: { ru: 'Кальций', en: 'Calcium' },
		atomicMass: 40.078,
		category: 'alkaline-earth-metal',
		group: 2,
		period: 4,
		block: 's',
		gridCol: 2,
		gridRow: 4
	},
	{
		number: 21,
		symbol: 'Sc',
		name: { ru: 'Скандий', en: 'Scandium' },
		atomicMass: 44.956,
		category: 'transition-metal',
		group: 3,
		period: 4,
		block: 'd',
		gridCol: 3,
		gridRow: 4
	},
	{
		number: 22,
		symbol: 'Ti',
		name: { ru: 'Титан', en: 'Titanium' },
		atomicMass: 47.867,
		category: 'transition-metal',
		group: 4,
		period: 4,
		block: 'd',
		gridCol: 4,
		gridRow: 4
	},
	{
		number: 23,
		symbol: 'V',
		name: { ru: 'Ванадий', en: 'Vanadium' },
		atomicMass: 50.942,
		category: 'transition-metal',
		group: 5,
		period: 4,
		block: 'd',
		gridCol: 5,
		gridRow: 4
	},
	{
		number: 24,
		symbol: 'Cr',
		name: { ru: 'Хром', en: 'Chromium' },
		atomicMass: 51.996,
		category: 'transition-metal',
		group: 6,
		period: 4,
		block: 'd',
		gridCol: 6,
		gridRow: 4
	},
	{
		number: 25,
		symbol: 'Mn',
		name: { ru: 'Марганец', en: 'Manganese' },
		atomicMass: 54.938,
		category: 'transition-metal',
		group: 7,
		period: 4,
		block: 'd',
		gridCol: 7,
		gridRow: 4
	},
	{
		number: 26,
		symbol: 'Fe',
		name: { ru: 'Железо', en: 'Iron' },
		atomicMass: 55.845,
		category: 'transition-metal',
		group: 8,
		period: 4,
		block: 'd',
		gridCol: 8,
		gridRow: 4
	},
	{
		number: 27,
		symbol: 'Co',
		name: { ru: 'Кобальт', en: 'Cobalt' },
		atomicMass: 58.933,
		category: 'transition-metal',
		group: 9,
		period: 4,
		block: 'd',
		gridCol: 9,
		gridRow: 4
	},
	{
		number: 28,
		symbol: 'Ni',
		name: { ru: 'Никель', en: 'Nickel' },
		atomicMass: 58.693,
		category: 'transition-metal',
		group: 10,
		period: 4,
		block: 'd',
		gridCol: 10,
		gridRow: 4
	},
	{
		number: 29,
		symbol: 'Cu',
		name: { ru: 'Медь', en: 'Copper' },
		atomicMass: 63.546,
		category: 'transition-metal',
		group: 11,
		period: 4,
		block: 'd',
		gridCol: 11,
		gridRow: 4
	},
	{
		number: 30,
		symbol: 'Zn',
		name: { ru: 'Цинк', en: 'Zinc' },
		atomicMass: 65.38,
		category: 'transition-metal',
		group: 12,
		period: 4,
		block: 'd',
		gridCol: 12,
		gridRow: 4
	},
	{
		number: 31,
		symbol: 'Ga',
		name: { ru: 'Галлий', en: 'Gallium' },
		atomicMass: 69.723,
		category: 'post-transition-metal',
		group: 13,
		period: 4,
		block: 'p',
		gridCol: 13,
		gridRow: 4
	},
	{
		number: 32,
		symbol: 'Ge',
		name: { ru: 'Германий', en: 'Germanium' },
		atomicMass: 72.63,
		category: 'metalloid',
		group: 14,
		period: 4,
		block: 'p',
		gridCol: 14,
		gridRow: 4
	},
	{
		number: 33,
		symbol: 'As',
		name: { ru: 'Мышьяк', en: 'Arsenic' },
		atomicMass: 74.922,
		category: 'metalloid',
		group: 15,
		period: 4,
		block: 'p',
		gridCol: 15,
		gridRow: 4
	},
	{
		number: 34,
		symbol: 'Se',
		name: { ru: 'Селен', en: 'Selenium' },
		atomicMass: 78.971,
		category: 'nonmetal',
		group: 16,
		period: 4,
		block: 'p',
		gridCol: 16,
		gridRow: 4
	},
	{
		number: 35,
		symbol: 'Br',
		name: { ru: 'Бром', en: 'Bromine' },
		atomicMass: 79.904,
		category: 'halogen',
		group: 17,
		period: 4,
		block: 'p',
		gridCol: 17,
		gridRow: 4
	},
	{
		number: 36,
		symbol: 'Kr',
		name: { ru: 'Криптон', en: 'Krypton' },
		atomicMass: 83.798,
		category: 'noble-gas',
		group: 18,
		period: 4,
		block: 'p',
		gridCol: 18,
		gridRow: 4
	},

	// Период 5
	{
		number: 37,
		symbol: 'Rb',
		name: { ru: 'Рубидий', en: 'Rubidium' },
		atomicMass: 85.468,
		category: 'alkali-metal',
		group: 1,
		period: 5,
		block: 's',
		gridCol: 1,
		gridRow: 5
	},
	{
		number: 38,
		symbol: 'Sr',
		name: { ru: 'Стронций', en: 'Strontium' },
		atomicMass: 87.62,
		category: 'alkaline-earth-metal',
		group: 2,
		period: 5,
		block: 's',
		gridCol: 2,
		gridRow: 5
	},
	{
		number: 39,
		symbol: 'Y',
		name: { ru: 'Иттрий', en: 'Yttrium' },
		atomicMass: 88.906,
		category: 'transition-metal',
		group: 3,
		period: 5,
		block: 'd',
		gridCol: 3,
		gridRow: 5
	},
	{
		number: 40,
		symbol: 'Zr',
		name: { ru: 'Цирконий', en: 'Zirconium' },
		atomicMass: 91.224,
		category: 'transition-metal',
		group: 4,
		period: 5,
		block: 'd',
		gridCol: 4,
		gridRow: 5
	},
	{
		number: 41,
		symbol: 'Nb',
		name: { ru: 'Ниобий', en: 'Niobium' },
		atomicMass: 92.906,
		category: 'transition-metal',
		group: 5,
		period: 5,
		block: 'd',
		gridCol: 5,
		gridRow: 5
	},
	{
		number: 42,
		symbol: 'Mo',
		name: { ru: 'Молибден', en: 'Molybdenum' },
		atomicMass: 95.95,
		category: 'transition-metal',
		group: 6,
		period: 5,
		block: 'd',
		gridCol: 6,
		gridRow: 5
	},
	{
		number: 43,
		symbol: 'Tc',
		name: { ru: 'Технеций', en: 'Technetium' },
		atomicMass: 98,
		category: 'transition-metal',
		group: 7,
		period: 5,
		block: 'd',
		gridCol: 7,
		gridRow: 5
	},
	{
		number: 44,
		symbol: 'Ru',
		name: { ru: 'Рутений', en: 'Ruthenium' },
		atomicMass: 101.07,
		category: 'transition-metal',
		group: 8,
		period: 5,
		block: 'd',
		gridCol: 8,
		gridRow: 5
	},
	{
		number: 45,
		symbol: 'Rh',
		name: { ru: 'Родий', en: 'Rhodium' },
		atomicMass: 102.906,
		category: 'transition-metal',
		group: 9,
		period: 5,
		block: 'd',
		gridCol: 9,
		gridRow: 5
	},
	{
		number: 46,
		symbol: 'Pd',
		name: { ru: 'Палладий', en: 'Palladium' },
		atomicMass: 106.42,
		category: 'transition-metal',
		group: 10,
		period: 5,
		block: 'd',
		gridCol: 10,
		gridRow: 5
	},
	{
		number: 47,
		symbol: 'Ag',
		name: { ru: 'Серебро', en: 'Silver' },
		atomicMass: 107.868,
		category: 'transition-metal',
		group: 11,
		period: 5,
		block: 'd',
		gridCol: 11,
		gridRow: 5
	},
	{
		number: 48,
		symbol: 'Cd',
		name: { ru: 'Кадмий', en: 'Cadmium' },
		atomicMass: 112.414,
		category: 'transition-metal',
		group: 12,
		period: 5,
		block: 'd',
		gridCol: 12,
		gridRow: 5
	},
	{
		number: 49,
		symbol: 'In',
		name: { ru: 'Индий', en: 'Indium' },
		atomicMass: 114.818,
		category: 'post-transition-metal',
		group: 13,
		period: 5,
		block: 'p',
		gridCol: 13,
		gridRow: 5
	},
	{
		number: 50,
		symbol: 'Sn',
		name: { ru: 'Олово', en: 'Tin' },
		atomicMass: 118.71,
		category: 'post-transition-metal',
		group: 14,
		period: 5,
		block: 'p',
		gridCol: 14,
		gridRow: 5
	},
	{
		number: 51,
		symbol: 'Sb',
		name: { ru: 'Сурьма', en: 'Antimony' },
		atomicMass: 121.76,
		category: 'metalloid',
		group: 15,
		period: 5,
		block: 'p',
		gridCol: 15,
		gridRow: 5
	},
	{
		number: 52,
		symbol: 'Te',
		name: { ru: 'Теллур', en: 'Tellurium' },
		atomicMass: 127.6,
		category: 'metalloid',
		group: 16,
		period: 5,
		block: 'p',
		gridCol: 16,
		gridRow: 5
	},
	{
		number: 53,
		symbol: 'I',
		name: { ru: 'Йод', en: 'Iodine' },
		atomicMass: 126.904,
		category: 'halogen',
		group: 17,
		period: 5,
		block: 'p',
		gridCol: 17,
		gridRow: 5
	},
	{
		number: 54,
		symbol: 'Xe',
		name: { ru: 'Ксенон', en: 'Xenon' },
		atomicMass: 131.293,
		category: 'noble-gas',
		group: 18,
		period: 5,
		block: 'p',
		gridCol: 18,
		gridRow: 5
	},

	// Период 6 (без лантаноидов в основной строке)
	{
		number: 55,
		symbol: 'Cs',
		name: { ru: 'Цезий', en: 'Caesium' },
		atomicMass: 132.905,
		category: 'alkali-metal',
		group: 1,
		period: 6,
		block: 's',
		gridCol: 1,
		gridRow: 6
	},
	{
		number: 56,
		symbol: 'Ba',
		name: { ru: 'Барий', en: 'Barium' },
		atomicMass: 137.327,
		category: 'alkaline-earth-metal',
		group: 2,
		period: 6,
		block: 's',
		gridCol: 2,
		gridRow: 6
	},
	// Лантаноиды 57-71 идут в gridRow: 8

	{
		number: 72,
		symbol: 'Hf',
		name: { ru: 'Гафний', en: 'Hafnium' },
		atomicMass: 178.49,
		category: 'transition-metal',
		group: 4,
		period: 6,
		block: 'd',
		gridCol: 4,
		gridRow: 6
	},
	{
		number: 73,
		symbol: 'Ta',
		name: { ru: 'Тантал', en: 'Tantalum' },
		atomicMass: 180.948,
		category: 'transition-metal',
		group: 5,
		period: 6,
		block: 'd',
		gridCol: 5,
		gridRow: 6
	},
	{
		number: 74,
		symbol: 'W',
		name: { ru: 'Вольфрам', en: 'Tungsten' },
		atomicMass: 183.84,
		category: 'transition-metal',
		group: 6,
		period: 6,
		block: 'd',
		gridCol: 6,
		gridRow: 6
	},
	{
		number: 75,
		symbol: 'Re',
		name: { ru: 'Рений', en: 'Rhenium' },
		atomicMass: 186.207,
		category: 'transition-metal',
		group: 7,
		period: 6,
		block: 'd',
		gridCol: 7,
		gridRow: 6
	},
	{
		number: 76,
		symbol: 'Os',
		name: { ru: 'Осмий', en: 'Osmium' },
		atomicMass: 190.23,
		category: 'transition-metal',
		group: 8,
		period: 6,
		block: 'd',
		gridCol: 8,
		gridRow: 6
	},
	{
		number: 77,
		symbol: 'Ir',
		name: { ru: 'Иридий', en: 'Iridium' },
		atomicMass: 192.217,
		category: 'transition-metal',
		group: 9,
		period: 6,
		block: 'd',
		gridCol: 9,
		gridRow: 6
	},
	{
		number: 78,
		symbol: 'Pt',
		name: { ru: 'Платина', en: 'Platinum' },
		atomicMass: 195.084,
		category: 'transition-metal',
		group: 10,
		period: 6,
		block: 'd',
		gridCol: 10,
		gridRow: 6
	},
	{
		number: 79,
		symbol: 'Au',
		name: { ru: 'Золото', en: 'Gold' },
		atomicMass: 196.967,
		category: 'transition-metal',
		group: 11,
		period: 6,
		block: 'd',
		gridCol: 11,
		gridRow: 6
	},
	{
		number: 80,
		symbol: 'Hg',
		name: { ru: 'Ртуть', en: 'Mercury' },
		atomicMass: 200.592,
		category: 'transition-metal',
		group: 12,
		period: 6,
		block: 'd',
		gridCol: 12,
		gridRow: 6
	},
	{
		number: 81,
		symbol: 'Tl',
		name: { ru: 'Таллий', en: 'Thallium' },
		atomicMass: 204.38,
		category: 'post-transition-metal',
		group: 13,
		period: 6,
		block: 'p',
		gridCol: 13,
		gridRow: 6
	},
	{
		number: 82,
		symbol: 'Pb',
		name: { ru: 'Свинец', en: 'Lead' },
		atomicMass: 207.2,
		category: 'post-transition-metal',
		group: 14,
		period: 6,
		block: 'p',
		gridCol: 14,
		gridRow: 6
	},
	{
		number: 83,
		symbol: 'Bi',
		name: { ru: 'Висмут', en: 'Bismuth' },
		atomicMass: 208.98,
		category: 'post-transition-metal',
		group: 15,
		period: 6,
		block: 'p',
		gridCol: 15,
		gridRow: 6
	},
	{
		number: 84,
		symbol: 'Po',
		name: { ru: 'Полоний', en: 'Polonium' },
		atomicMass: 209,
		category: 'metalloid',
		group: 16,
		period: 6,
		block: 'p',
		gridCol: 16,
		gridRow: 6
	},
	{
		number: 85,
		symbol: 'At',
		name: { ru: 'Астат', en: 'Astatine' },
		atomicMass: 210,
		category: 'halogen',
		group: 17,
		period: 6,
		block: 'p',
		gridCol: 17,
		gridRow: 6
	},
	{
		number: 86,
		symbol: 'Rn',
		name: { ru: 'Радон', en: 'Radon' },
		atomicMass: 222,
		category: 'noble-gas',
		group: 18,
		period: 6,
		block: 'p',
		gridCol: 18,
		gridRow: 6
	},

	// Период 7 (без актиноидов в основной строке)
	{
		number: 87,
		symbol: 'Fr',
		name: { ru: 'Франций', en: 'Francium' },
		atomicMass: 223,
		category: 'alkali-metal',
		group: 1,
		period: 7,
		block: 's',
		gridCol: 1,
		gridRow: 7
	},
	{
		number: 88,
		symbol: 'Ra',
		name: { ru: 'Радий', en: 'Radium' },
		atomicMass: 226,
		category: 'alkaline-earth-metal',
		group: 2,
		period: 7,
		block: 's',
		gridCol: 2,
		gridRow: 7
	},
	// Актиноиды 89-103 идут в gridRow: 9

	{
		number: 104,
		symbol: 'Rf',
		name: { ru: 'Резерфордий', en: 'Rutherfordium' },
		atomicMass: 267,
		category: 'transition-metal',
		group: 4,
		period: 7,
		block: 'd',
		gridCol: 4,
		gridRow: 7
	},
	{
		number: 105,
		symbol: 'Db',
		name: { ru: 'Дубний', en: 'Dubnium' },
		atomicMass: 268,
		category: 'transition-metal',
		group: 5,
		period: 7,
		block: 'd',
		gridCol: 5,
		gridRow: 7
	},
	{
		number: 106,
		symbol: 'Sg',
		name: { ru: 'Сиборгий', en: 'Seaborgium' },
		atomicMass: 269,
		category: 'transition-metal',
		group: 6,
		period: 7,
		block: 'd',
		gridCol: 6,
		gridRow: 7
	},
	{
		number: 107,
		symbol: 'Bh',
		name: { ru: 'Борий', en: 'Bohrium' },
		atomicMass: 270,
		category: 'transition-metal',
		group: 7,
		period: 7,
		block: 'd',
		gridCol: 7,
		gridRow: 7
	},
	{
		number: 108,
		symbol: 'Hs',
		name: { ru: 'Хассий', en: 'Hassium' },
		atomicMass: 277,
		category: 'transition-metal',
		group: 8,
		period: 7,
		block: 'd',
		gridCol: 8,
		gridRow: 7
	},
	{
		number: 109,
		symbol: 'Mt',
		name: { ru: 'Мейтнерий', en: 'Meitnerium' },
		atomicMass: 278,
		category: 'transition-metal',
		group: 9,
		period: 7,
		block: 'd',
		gridCol: 9,
		gridRow: 7
	},
	{
		number: 110,
		symbol: 'Ds',
		name: { ru: 'Дармштадтий', en: 'Darmstadtium' },
		atomicMass: 281,
		category: 'transition-metal',
		group: 10,
		period: 7,
		block: 'd',
		gridCol: 10,
		gridRow: 7
	},
	{
		number: 111,
		symbol: 'Rg',
		name: { ru: 'Рентгений', en: 'Roentgenium' },
		atomicMass: 282,
		category: 'transition-metal',
		group: 11,
		period: 7,
		block: 'd',
		gridCol: 11,
		gridRow: 7
	},
	{
		number: 112,
		symbol: 'Cn',
		name: { ru: 'Коперниций', en: 'Copernicium' },
		atomicMass: 285,
		category: 'transition-metal',
		group: 12,
		period: 7,
		block: 'd',
		gridCol: 12,
		gridRow: 7
	},
	{
		number: 113,
		symbol: 'Nh',
		name: { ru: 'Нихоний', en: 'Nihonium' },
		atomicMass: 286,
		category: 'post-transition-metal',
		group: 13,
		period: 7,
		block: 'p',
		gridCol: 13,
		gridRow: 7
	},
	{
		number: 114,
		symbol: 'Fl',
		name: { ru: 'Флеровий', en: 'Flerovium' },
		atomicMass: 289,
		category: 'post-transition-metal',
		group: 14,
		period: 7,
		block: 'p',
		gridCol: 14,
		gridRow: 7
	},
	{
		number: 115,
		symbol: 'Mc',
		name: { ru: 'Московий', en: 'Moscovium' },
		atomicMass: 289,
		category: 'post-transition-metal',
		group: 15,
		period: 7,
		block: 'p',
		gridCol: 15,
		gridRow: 7
	},
	{
		number: 116,
		symbol: 'Lv',
		name: { ru: 'Ливерморий', en: 'Livermorium' },
		atomicMass: 293,
		category: 'post-transition-metal',
		group: 16,
		period: 7,
		block: 'p',
		gridCol: 16,
		gridRow: 7
	},
	{
		number: 117,
		symbol: 'Ts',
		name: { ru: 'Теннессин', en: 'Tennessine' },
		atomicMass: 294,
		category: 'halogen',
		group: 17,
		period: 7,
		block: 'p',
		gridCol: 17,
		gridRow: 7
	},
	{
		number: 118,
		symbol: 'Og',
		name: { ru: 'Оганесон', en: 'Oganesson' },
		atomicMass: 294,
		category: 'noble-gas',
		group: 18,
		period: 7,
		block: 'p',
		gridCol: 18,
		gridRow: 7
	},

	// Лантаноиды (gridRow: 8, gridCol: 3..17)
	{
		number: 57,
		symbol: 'La',
		name: { ru: 'Лантан', en: 'Lanthanum' },
		atomicMass: 138.905,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 3,
		gridRow: 8
	},
	{
		number: 58,
		symbol: 'Ce',
		name: { ru: 'Церий', en: 'Cerium' },
		atomicMass: 140.116,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 4,
		gridRow: 8
	},
	{
		number: 59,
		symbol: 'Pr',
		name: { ru: 'Празеодим', en: 'Praseodymium' },
		atomicMass: 140.908,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 5,
		gridRow: 8
	},
	{
		number: 60,
		symbol: 'Nd',
		name: { ru: 'Неодим', en: 'Neodymium' },
		atomicMass: 144.242,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 6,
		gridRow: 8
	},
	{
		number: 61,
		symbol: 'Pm',
		name: { ru: 'Прометий', en: 'Promethium' },
		atomicMass: 145,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 7,
		gridRow: 8
	},
	{
		number: 62,
		symbol: 'Sm',
		name: { ru: 'Самарий', en: 'Samarium' },
		atomicMass: 150.36,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 8,
		gridRow: 8
	},
	{
		number: 63,
		symbol: 'Eu',
		name: { ru: 'Европий', en: 'Europium' },
		atomicMass: 151.964,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 9,
		gridRow: 8
	},
	{
		number: 64,
		symbol: 'Gd',
		name: { ru: 'Гадолиний', en: 'Gadolinium' },
		atomicMass: 157.25,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 10,
		gridRow: 8
	},
	{
		number: 65,
		symbol: 'Tb',
		name: { ru: 'Тербий', en: 'Terbium' },
		atomicMass: 158.925,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 11,
		gridRow: 8
	},
	{
		number: 66,
		symbol: 'Dy',
		name: { ru: 'Диспрозий', en: 'Dysprosium' },
		atomicMass: 162.5,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 12,
		gridRow: 8
	},
	{
		number: 67,
		symbol: 'Ho',
		name: { ru: 'Гольмий', en: 'Holmium' },
		atomicMass: 164.93,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 13,
		gridRow: 8
	},
	{
		number: 68,
		symbol: 'Er',
		name: { ru: 'Эрбий', en: 'Erbium' },
		atomicMass: 167.259,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 14,
		gridRow: 8
	},
	{
		number: 69,
		symbol: 'Tm',
		name: { ru: 'Тулий', en: 'Thulium' },
		atomicMass: 168.934,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 15,
		gridRow: 8
	},
	{
		number: 70,
		symbol: 'Yb',
		name: { ru: 'Иттербий', en: 'Ytterbium' },
		atomicMass: 173.045,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 16,
		gridRow: 8
	},
	{
		number: 71,
		symbol: 'Lu',
		name: { ru: 'Лютеций', en: 'Lutetium' },
		atomicMass: 174.967,
		category: 'lanthanoid',
		group: null,
		period: 6,
		block: 'f',
		gridCol: 17,
		gridRow: 8
	},

	// Актиноиды (gridRow: 9, gridCol: 3..17)
	{
		number: 89,
		symbol: 'Ac',
		name: { ru: 'Актиний', en: 'Actinium' },
		atomicMass: 227,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 3,
		gridRow: 9
	},
	{
		number: 90,
		symbol: 'Th',
		name: { ru: 'Торий', en: 'Thorium' },
		atomicMass: 232.038,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 4,
		gridRow: 9
	},
	{
		number: 91,
		symbol: 'Pa',
		name: { ru: 'Протактиний', en: 'Protactinium' },
		atomicMass: 231.036,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 5,
		gridRow: 9
	},
	{
		number: 92,
		symbol: 'U',
		name: { ru: 'Уран', en: 'Uranium' },
		atomicMass: 238.029,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 6,
		gridRow: 9
	},
	{
		number: 93,
		symbol: 'Np',
		name: { ru: 'Нептуний', en: 'Neptunium' },
		atomicMass: 237,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 7,
		gridRow: 9
	},
	{
		number: 94,
		symbol: 'Pu',
		name: { ru: 'Плутоний', en: 'Plutonium' },
		atomicMass: 244,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 8,
		gridRow: 9
	},
	{
		number: 95,
		symbol: 'Am',
		name: { ru: 'Америций', en: 'Americium' },
		atomicMass: 243,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 9,
		gridRow: 9
	},
	{
		number: 96,
		symbol: 'Cm',
		name: { ru: 'Кюрий', en: 'Curium' },
		atomicMass: 247,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 10,
		gridRow: 9
	},
	{
		number: 97,
		symbol: 'Bk',
		name: { ru: 'Берклий', en: 'Berkelium' },
		atomicMass: 247,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 11,
		gridRow: 9
	},
	{
		number: 98,
		symbol: 'Cf',
		name: { ru: 'Калифорний', en: 'Californium' },
		atomicMass: 251,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 12,
		gridRow: 9
	},
	{
		number: 99,
		symbol: 'Es',
		name: { ru: 'Эйнштейний', en: 'Einsteinium' },
		atomicMass: 252,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 13,
		gridRow: 9
	},
	{
		number: 100,
		symbol: 'Fm',
		name: { ru: 'Фермий', en: 'Fermium' },
		atomicMass: 257,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 14,
		gridRow: 9
	},
	{
		number: 101,
		symbol: 'Md',
		name: { ru: 'Менделевий', en: 'Mendelevium' },
		atomicMass: 258,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 15,
		gridRow: 9
	},
	{
		number: 102,
		symbol: 'No',
		name: { ru: 'Нобелий', en: 'Nobelium' },
		atomicMass: 259,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 16,
		gridRow: 9
	},
	{
		number: 103,
		symbol: 'Lr',
		name: { ru: 'Лоуренсий', en: 'Lawrencium' },
		atomicMass: 266,
		category: 'actinoid',
		group: null,
		period: 7,
		block: 'f',
		gridCol: 17,
		gridRow: 9
	}
];

/** Quick lookup by atomic number. */
export const ELEMENT_BY_NUMBER: ReadonlyMap<number, PeriodicElement> = new Map(
	ELEMENTS.map((el) => [el.number, el])
);

/** Quick lookup by symbol (case-sensitive, IUPAC). */
export const ELEMENT_BY_SYMBOL: ReadonlyMap<string, PeriodicElement> = new Map(
	ELEMENTS.map((el) => [el.symbol, el])
);

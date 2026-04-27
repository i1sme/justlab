// OpenChemLib-обёртка с ленивым импортом.
// Главный поток: ОК для SMILES-парсинга маленьких молекул (миллисекунды).
// Для тяжёлых молекул / RDKit будем поднимать Web Worker (см. lib/workers/).

export interface MoleculeAtom {
	element: string;
	x: number;
	y: number;
	z: number;
}

export interface MoleculeBond {
	a: number;
	b: number;
	order: number;
}

export interface ParsedMolecule {
	formula: string;
	relativeWeight: number;
	canonicalSmiles: string;
	atoms: MoleculeAtom[];
	bonds: MoleculeBond[];
	/** Pre-rendered 2D SVG (для быстрого показа без повторного парсинга). */
	svg2D: string;
}

type OCLNamespace = typeof import('openchemlib');
let oclPromise: Promise<OCLNamespace> | null = null;

/** Возвращает (и кеширует) loaded `openchemlib` модуль — отдельный чанк в build. */
export function loadOpenChemLib(): Promise<OCLNamespace> {
	if (!oclPromise) {
		oclPromise = import('openchemlib') as Promise<OCLNamespace>;
	}
	return oclPromise;
}

/**
 * Разобрать SMILES: возвращает структуру (атомы/связи) + готовый 2D SVG.
 * `null` при невалидном SMILES.
 *
 * NB: OpenChemLib генерирует только 2D-координаты (Z=0). Для true 3D-эмбеддинга
 * понадобится RDKit (full-build) или forcefield-implementation — пока используем
 * плоские координаты, отдавая 3D-визуал «глубину» через сферы и вращение сцены.
 */
export async function parseSmiles(
	smiles: string,
	width = 480,
	height = 320
): Promise<ParsedMolecule | null> {
	const trimmed = smiles.trim();
	if (!trimmed) return null;

	const ocl = await loadOpenChemLib();
	try {
		const mol = ocl.Molecule.fromSmiles(trimmed);
		if (!mol || mol.getAllAtoms() === 0) return null;

		// Принудительная генерация 2D-координат.
		mol.inventCoordinates();

		const atomCount = mol.getAllAtoms();
		const atoms: MoleculeAtom[] = [];
		for (let i = 0; i < atomCount; i++) {
			atoms.push({
				element: mol.getAtomLabel(i),
				x: mol.getAtomX(i),
				y: mol.getAtomY(i),
				z: mol.getAtomZ(i)
			});
		}

		const bondCount = mol.getAllBonds();
		const bonds: MoleculeBond[] = [];
		for (let i = 0; i < bondCount; i++) {
			bonds.push({
				a: mol.getBondAtom(0, i),
				b: mol.getBondAtom(1, i),
				order: mol.getBondOrder(i)
			});
		}

		const svg2D = mol.toSVG(width, height, undefined, {
			suppressChiralText: true,
			suppressESR: true,
			suppressCIPParity: true
		});
		const f = mol.getMolecularFormula();

		return {
			formula: f.formula,
			relativeWeight: f.relativeWeight,
			canonicalSmiles: mol.toSmiles(),
			atoms,
			bonds,
			svg2D
		};
	} catch {
		return null;
	}
}

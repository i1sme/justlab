// Web Worker для OpenChemLib: парсинг SMILES, 2D-координаты, SVG.
// Принципы CLAUDE.md: главный поток только рендерит — всё парсинг-расчётное здесь.
// Comlink абстрагирует postMessage в обычные async-вызовы.

import * as Comlink from 'comlink';
import * as OCL from 'openchemlib';

export interface WorkerMoleculeAtom {
	element: string;
	x: number;
	y: number;
	z: number;
}

export interface WorkerMoleculeBond {
	a: number;
	b: number;
	order: number;
}

export interface WorkerParsedMolecule {
	formula: string;
	relativeWeight: number;
	canonicalSmiles: string;
	atoms: WorkerMoleculeAtom[];
	bonds: WorkerMoleculeBond[];
	svg2D: string;
}

const api = {
	parseSmiles(smiles: string, width: number, height: number): WorkerParsedMolecule | null {
		const trimmed = smiles.trim();
		if (!trimmed) return null;
		try {
			const mol = OCL.Molecule.fromSmiles(trimmed);
			if (!mol || mol.getAllAtoms() === 0) return null;

			mol.inventCoordinates();

			const atomCount = mol.getAllAtoms();
			const atoms: WorkerMoleculeAtom[] = [];
			for (let i = 0; i < atomCount; i++) {
				atoms.push({
					element: mol.getAtomLabel(i),
					x: mol.getAtomX(i),
					y: mol.getAtomY(i),
					z: mol.getAtomZ(i)
				});
			}

			const bondCount = mol.getAllBonds();
			const bonds: WorkerMoleculeBond[] = [];
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
};

Comlink.expose(api);

export type OCLWorkerAPI = typeof api;

// Главный поток: тонкая обёртка над Web Worker с OpenChemLib.
// Worker создаётся один раз лениво (при первом запросе) и переиспользуется.
// Это удовлетворяет правилу CLAUDE.md «парсинг — только в воркере».

import * as Comlink from 'comlink';
import type { OCLWorkerAPI } from '$lib/workers/openchemlib-worker';

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
	/** Готовый 2D SVG (для быстрого 2D-режима без повторного парсинга). */
	svg2D: string;
}

let workerInstance: Worker | null = null;
let workerApi: Comlink.Remote<OCLWorkerAPI> | null = null;

function getWorker(): Comlink.Remote<OCLWorkerAPI> {
	if (!workerApi) {
		workerInstance = new Worker(new URL('../workers/openchemlib-worker.ts', import.meta.url), {
			type: 'module'
		});
		workerApi = Comlink.wrap<OCLWorkerAPI>(workerInstance);
	}
	return workerApi;
}

/**
 * Разобрать SMILES в структуру с готовым 2D SVG. `null` для невалидного SMILES.
 *
 * NB: координаты Z=0 (OpenChemLib делает только 2D layout). Настоящая 3D-эмбедда
 * — отдельная задача (full RDKit / forcefield), пока 3D-сцена крутит плоскую структуру.
 */
export async function parseSmiles(
	smiles: string,
	width = 480,
	height = 320
): Promise<ParsedMolecule | null> {
	const result = await getWorker().parseSmiles(smiles, width, height);
	return result;
}

/** Освободить worker (например, при unmount всего приложения). */
export function disposeOCLWorker(): void {
	if (workerInstance) {
		workerInstance.terminate();
		workerInstance = null;
		workerApi = null;
	}
}

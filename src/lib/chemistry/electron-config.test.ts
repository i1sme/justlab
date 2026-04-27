import { describe, expect, it } from 'vitest';
import { shellDistribution } from './electron-config';

describe('shellDistribution', () => {
	it('водород: одна оболочка, 1 электрон', () => {
		expect(shellDistribution(1)).toEqual([1]);
	});

	it('гелий: оболочка K заполнена', () => {
		expect(shellDistribution(2)).toEqual([2]);
	});

	it('углерод (Z=6): K=2, L=4', () => {
		expect(shellDistribution(6)).toEqual([2, 4]);
	});

	it('неон (Z=10): K=2, L=8', () => {
		expect(shellDistribution(10)).toEqual([2, 8]);
	});

	it('натрий (Z=11): K=2, L=8, M=1', () => {
		expect(shellDistribution(11)).toEqual([2, 8, 1]);
	});

	it('аргон (Z=18): K=2, L=8, M=8', () => {
		expect(shellDistribution(18)).toEqual([2, 8, 8]);
	});

	it('железо (Z=26): K=2, L=8, M=14, N=2', () => {
		// 4s заполняется до 3d по Aufbau
		expect(shellDistribution(26)).toEqual([2, 8, 14, 2]);
	});

	it('криптон (Z=36): K=2, L=8, M=18, N=8', () => {
		expect(shellDistribution(36)).toEqual([2, 8, 18, 8]);
	});

	it('свинец (Z=82): K=2, L=8, M=18, N=32, O=18, P=4', () => {
		expect(shellDistribution(82)).toEqual([2, 8, 18, 32, 18, 4]);
	});

	it('оганесон (Z=118): K=2, L=8, M=18, N=32, O=32, P=18, Q=8', () => {
		expect(shellDistribution(118)).toEqual([2, 8, 18, 32, 32, 18, 8]);
	});

	it('сумма электронов всегда равна Z', () => {
		for (const z of [1, 5, 11, 26, 50, 82, 100, 118]) {
			const dist = shellDistribution(z);
			expect(
				dist.reduce((a, b) => a + b, 0),
				`Z=${z}`
			).toBe(z);
		}
	});
});

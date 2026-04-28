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

	// === Аномалии Aufbau ===
	it('хром (Z=24): один 4s проваливается в 3d', () => {
		// Aufbau дал бы [2,8,12,2]; реально 3d⁵ 4s¹
		expect(shellDistribution(24)).toEqual([2, 8, 13, 1]);
	});

	it('медь (Z=29): полностью заполненный 3d', () => {
		expect(shellDistribution(29)).toEqual([2, 8, 18, 1]);
	});

	it('палладий (Z=46): оба 5s проваливаются в 4d', () => {
		expect(shellDistribution(46)).toEqual([2, 8, 18, 18, 0]);
	});

	it('серебро (Z=47): 4d¹⁰ 5s¹', () => {
		expect(shellDistribution(47)).toEqual([2, 8, 18, 18, 1]);
	});

	it('золото (Z=79): 5d¹⁰ 6s¹', () => {
		expect(shellDistribution(79)).toEqual([2, 8, 18, 32, 18, 1]);
	});

	it('лантан (Z=57): 5d¹ а не 4f¹', () => {
		expect(shellDistribution(57)).toEqual([2, 8, 18, 18, 9, 2]);
	});

	it('уран (Z=92): 5f³ 6d¹ 7s²', () => {
		expect(shellDistribution(92)).toEqual([2, 8, 18, 32, 21, 9, 2]);
	});

	it('сумма для аномалий тоже равна Z', () => {
		for (const z of [24, 29, 46, 47, 78, 79, 57, 64, 89, 92, 96, 103]) {
			expect(
				shellDistribution(z).reduce((a, b) => a + b, 0),
				`Z=${z}`
			).toBe(z);
		}
	});
});

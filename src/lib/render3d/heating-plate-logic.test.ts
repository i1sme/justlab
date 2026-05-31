import { describe, expect, it } from 'vitest';
import {
	INTENSITY_TARGETS,
	LEVELS,
	targetTemperatureFor,
	isHeatingAction,
	glowOpacityFor,
	type HeatingIntensity
} from './heating-plate-logic';

describe('INTENSITY_TARGETS', () => {
	it('OFF возвращает к комнатной температуре 298 K', () => {
		expect(INTENSITY_TARGETS[0]).toBe(298);
	});

	it('целевые температуры монотонно растут: OFF < I < II < III', () => {
		for (let i = 1; i <= 3; i++) {
			expect(INTENSITY_TARGETS[i as HeatingIntensity]).toBeGreaterThan(
				INTENSITY_TARGETS[(i - 1) as HeatingIntensity]
			);
		}
	});

	it('точные значения порогов (контракт для калькуляций)', () => {
		expect(INTENSITY_TARGETS[1]).toBe(400);
		expect(INTENSITY_TARGETS[2]).toBe(700);
		expect(INTENSITY_TARGETS[3]).toBe(1100);
	});
});

describe('targetTemperatureFor', () => {
	it('возвращает значение из таблицы для каждого уровня', () => {
		for (const lvl of LEVELS) {
			expect(targetTemperatureFor(lvl)).toBe(INTENSITY_TARGETS[lvl]);
		}
	});
});

describe('isHeatingAction', () => {
	it('heat когда целевая выше текущей сверх ε', () => {
		expect(isHeatingAction(3, 298)).toBe('heat');
		expect(isHeatingAction(1, 350)).toBe('heat');
	});

	it('cool когда целевая ниже текущей сверх ε', () => {
		expect(isHeatingAction(0, 800)).toBe('cool');
		expect(isHeatingAction(1, 1000)).toBe('cool');
	});

	it('noop когда уже на целевой температуре (в пределах ε)', () => {
		expect(isHeatingAction(2, 700)).toBe('noop');
		expect(isHeatingAction(2, 700.5)).toBe('noop');
		expect(isHeatingAction(0, 298)).toBe('noop');
	});
});

describe('glowOpacityFor', () => {
	it('OFF не светится (opacity 0)', () => {
		expect(glowOpacityFor(0)).toBe(0);
	});

	it('opacity монотонно растёт от OFF к III', () => {
		expect(glowOpacityFor(1)).toBeGreaterThan(glowOpacityFor(0));
		expect(glowOpacityFor(2)).toBeGreaterThan(glowOpacityFor(1));
		expect(glowOpacityFor(3)).toBeGreaterThan(glowOpacityFor(2));
	});

	it('opacity в диапазоне 0..1', () => {
		for (const lvl of LEVELS) {
			const o = glowOpacityFor(lvl);
			expect(o).toBeGreaterThanOrEqual(0);
			expect(o).toBeLessThanOrEqual(1);
		}
	});
});

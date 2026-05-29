import { describe, expect, it } from 'vitest';
import {
	glasswareProfile,
	glasswareHeight,
	radiusAtHeight,
	interiorRadiusAt,
	liquidFillHeight,
	WALL_THICKNESS
} from './glassware-profiles';
import type { ContainerKind } from '../../data/types';

const KINDS: ContainerKind[] = ['beaker', 'flask', 'test-tube', 'crucible', 'petri'];

describe('glasswareProfile', () => {
	it('каждый профиль начинается на оси (закрытое дно) и монотонен по высоте', () => {
		for (const kind of KINDS) {
			const pts = glasswareProfile(kind);
			expect(pts.length).toBeGreaterThanOrEqual(2);
			expect(pts[0].r).toBe(0);
			for (let i = 1; i < pts.length; i++) {
				expect(pts[i].y).toBeGreaterThanOrEqual(pts[i - 1].y);
			}
		}
	});

	it('колба (flask) сужается кверху: верхний радиус меньше базового', () => {
		const pts = glasswareProfile('flask');
		const baseR = Math.max(...pts.map((p) => p.r));
		const topR = pts[pts.length - 1].r;
		expect(topR).toBeLessThan(baseR);
	});

	it('стакан (beaker) почти цилиндр: верх ≈ база', () => {
		const pts = glasswareProfile('beaker');
		const baseR = pts[1].r;
		const topR = pts[pts.length - 1].r;
		expect(Math.abs(topR - baseR)).toBeLessThan(0.05);
	});

	it('чашка Петри ниже стакана, пробирка выше стакана', () => {
		expect(glasswareHeight('petri')).toBeLessThan(glasswareHeight('beaker'));
		expect(glasswareHeight('test-tube')).toBeGreaterThan(glasswareHeight('beaker'));
	});
});

describe('radiusAtHeight / interiorRadiusAt', () => {
	it('стакан: радиус постоянен по высоте стенки', () => {
		expect(radiusAtHeight('beaker', 0.1)).toBeCloseTo(0.18, 5);
		expect(radiusAtHeight('beaker', 0.2)).toBeCloseTo(0.18, 5);
	});

	it('внутренний радиус меньше внешнего ровно на толщину стенки', () => {
		const y = 0.1;
		expect(interiorRadiusAt('beaker', y)).toBeCloseTo(
			radiusAtHeight('beaker', y) - WALL_THICKNESS,
			5
		);
	});

	it('внутренний радиус никогда не отрицателен', () => {
		for (const kind of KINDS) {
			for (let y = 0; y <= glasswareHeight(kind); y += 0.05) {
				expect(interiorRadiusAt(kind, y)).toBeGreaterThanOrEqual(0);
			}
		}
	});
});

describe('liquidFillHeight', () => {
	it('0 при fillRatio=0, растёт, и оставляет headroom ниже края', () => {
		for (const kind of KINDS) {
			expect(liquidFillHeight(kind, 0)).toBe(0);
			const full = liquidFillHeight(kind, 1);
			expect(full).toBeGreaterThan(0);
			expect(full).toBeLessThan(glasswareHeight(kind));
			expect(liquidFillHeight(kind, 0.5)).toBeLessThan(full);
		}
	});

	it('клампит fillRatio за пределами 0..1', () => {
		expect(liquidFillHeight('beaker', -1)).toBe(0);
		expect(liquidFillHeight('beaker', 5)).toBe(liquidFillHeight('beaker', 1));
	});
});

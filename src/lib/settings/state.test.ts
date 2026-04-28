// Unit-тесты на чистые helpers из settings (без рунов).
// `isVisibleAtMode` — гейт контента по уровню пользователя.

import { describe, expect, it } from 'vitest';
import { isVisibleAtMode } from './state.svelte';

describe('isVisibleAtMode', () => {
	it('university-режим показывает всё', () => {
		expect(isVisibleAtMode('beginner', 'university')).toBe(true);
		expect(isVisibleAtMode('school', 'university')).toBe(true);
		expect(isVisibleAtMode('university', 'university')).toBe(true);
	});

	it('school-режим скрывает только university', () => {
		expect(isVisibleAtMode('beginner', 'school')).toBe(true);
		expect(isVisibleAtMode('school', 'school')).toBe(true);
		expect(isVisibleAtMode('university', 'school')).toBe(false);
	});

	it('beginner-режим скрывает только university (но даёт UX-подсказки)', () => {
		expect(isVisibleAtMode('beginner', 'beginner')).toBe(true);
		expect(isVisibleAtMode('school', 'beginner')).toBe(true);
		expect(isVisibleAtMode('university', 'beginner')).toBe(false);
	});

	it('null-режим (первый запуск) трактуется как school', () => {
		expect(isVisibleAtMode('beginner', null)).toBe(true);
		expect(isVisibleAtMode('school', null)).toBe(true);
		expect(isVisibleAtMode('university', null)).toBe(false);
	});
});

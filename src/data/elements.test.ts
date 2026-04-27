// Структурные тесты курируемой БД элементов.
// Цель — отлавливать опечатки (дубликаты позиций в сетке, пропуски, кривой gridCol).
// Содержательные значения (массы, имена) тут не проверяем — за это отвечает источник.

import { describe, expect, it } from 'vitest';
import { ELEMENTS, ELEMENT_BY_NUMBER, ELEMENT_BY_SYMBOL } from './elements';

describe('ELEMENTS dataset', () => {
	it('содержит ровно 118 элементов', () => {
		expect(ELEMENTS).toHaveLength(118);
	});

	it('номера 1..118 уникальны и без пропусков', () => {
		const numbers = ELEMENTS.map((e) => e.number).sort((a, b) => a - b);
		expect(numbers).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
	});

	it('символы IUPAC уникальны', () => {
		const symbols = new Set(ELEMENTS.map((e) => e.symbol));
		expect(symbols.size).toBe(118);
	});

	it('каждый элемент имеет ru- и en-имя (непустые)', () => {
		for (const el of ELEMENTS) {
			expect(el.name.ru, `ru name for ${el.symbol}`).toBeTruthy();
			expect(el.name.en, `en name for ${el.symbol}`).toBeTruthy();
		}
	});

	it('gridCol в [1, 18], gridRow в [1, 9]', () => {
		for (const el of ELEMENTS) {
			expect(el.gridCol, `${el.symbol} gridCol`).toBeGreaterThanOrEqual(1);
			expect(el.gridCol, `${el.symbol} gridCol`).toBeLessThanOrEqual(18);
			expect(el.gridRow, `${el.symbol} gridRow`).toBeGreaterThanOrEqual(1);
			expect(el.gridRow, `${el.symbol} gridRow`).toBeLessThanOrEqual(9);
		}
	});

	it('никакие два элемента не делят одну ячейку (gridCol, gridRow)', () => {
		const seen = new Map<string, string>();
		for (const el of ELEMENTS) {
			const key = `${el.gridCol}:${el.gridRow}`;
			const existing = seen.get(key);
			expect(existing, `Конфликт ячейки ${key}: ${existing} и ${el.symbol}`).toBeUndefined();
			seen.set(key, el.symbol);
		}
	});

	it('лантаноиды (57-71) лежат в gridRow=8, актиноиды (89-103) — в gridRow=9', () => {
		for (const el of ELEMENTS) {
			if (el.number >= 57 && el.number <= 71) {
				expect(el.category, `${el.symbol} category`).toBe('lanthanoid');
				expect(el.gridRow, `${el.symbol} gridRow`).toBe(8);
			}
			if (el.number >= 89 && el.number <= 103) {
				expect(el.category, `${el.symbol} category`).toBe('actinoid');
				expect(el.gridRow, `${el.symbol} gridRow`).toBe(9);
			}
		}
	});

	it('период согласован с gridRow для не-f-блока', () => {
		// gridRow=8/9 — это footer-строки лантаноидов/актиноидов; период там 6/7.
		// Для остальных period должен совпадать с gridRow.
		for (const el of ELEMENTS) {
			if (el.gridRow <= 7) {
				expect(el.period, `${el.symbol} period vs gridRow`).toBe(el.gridRow);
			}
		}
	});

	it('атомные массы возрастают с номером (с допуском на известные инверсии)', () => {
		// Массив ELEMENTS упорядочен по строкам визуальной таблицы, а не по номеру —
		// явно сортируем перед монотонной проверкой.
		const byNumber = [...ELEMENTS].sort((a, b) => a.number - b.number);
		for (let i = 1; i < byNumber.length; i++) {
			const prev = byNumber[i - 1];
			const cur = byNumber[i];
			// Известные инверсии (Co/Ni, Te/I, Ar/K, Th/Pa, U/Np) укладываются в ~1.
			const delta = cur.atomicMass - prev.atomicMass;
			expect(delta, `${prev.symbol}->${cur.symbol}: delta=${delta}`).toBeGreaterThan(-5);
		}
	});
});

describe('Lookup maps', () => {
	it('ELEMENT_BY_NUMBER возвращает корректный элемент', () => {
		const el = ELEMENT_BY_NUMBER.get(26);
		expect(el?.symbol).toBe('Fe');
		expect(el?.name.ru).toBe('Железо');
	});

	it('ELEMENT_BY_SYMBOL чувствителен к регистру (IUPAC)', () => {
		expect(ELEMENT_BY_SYMBOL.get('Fe')?.number).toBe(26);
		expect(ELEMENT_BY_SYMBOL.get('FE')).toBeUndefined();
		expect(ELEMENT_BY_SYMBOL.get('fe')).toBeUndefined();
	});

	it('размер lookup-карт = 118', () => {
		expect(ELEMENT_BY_NUMBER.size).toBe(118);
		expect(ELEMENT_BY_SYMBOL.size).toBe(118);
	});
});

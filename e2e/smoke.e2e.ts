// Smoke-тесты основных пользовательских путей: главная (таблица),
// карточка элемента, страница молекул, глоссарий, переключатель локали.
//
// Запуск: `npm run test:e2e`. Playwright поднимает `npm run build && npm run preview`
// перед стартом (см. playwright.config.ts).

import { test, expect } from '@playwright/test';

test('home page renders the periodic table', async ({ page }) => {
	await page.goto('/');
	// Заголовок страницы есть и не пустой.
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	// Карточка железа в таблице (aria-label всегда начинается с символа).
	await expect(page.locator('[aria-label^="Fe,"]').first()).toBeVisible();
});

test('clicking an element opens details panel with its name', async ({ page }) => {
	await page.goto('/');
	await page.locator('[aria-label^="Fe,"]').first().click();
	// В панели деталей появляется заголовок с локализованным именем.
	await expect(page.getByRole('heading', { level: 2 })).toContainText(/Железо|Iron/);
});

test('element search jumps to a match', async ({ page }) => {
	await page.goto('/');
	// Ищем по IUPAC-символу — он одинаков в обеих локалях.
	await page.getByRole('combobox').fill('Fe');
	await expect(page.getByRole('option').first()).toContainText('Fe');
});

test('locale switcher changes UI language', async ({ page }) => {
	await page.goto('/');
	const heading = page.getByRole('heading', { level: 1 });
	const before = (await heading.textContent())?.trim() ?? '';

	const isRu = /Периодическая/i.test(before);
	const target = isRu ? 'EN' : 'RU';
	await page.getByRole('radio', { name: target }).click();

	await expect(heading).not.toHaveText(before);
});

test('molecule page: library picks render the viewer with formula', async ({ page }) => {
	await page.goto('/molecule');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	// \b перед "Ethanol" не пускает регекс матчить "Methanol", у которого тот же подстрока.
	// Воркер с OpenChemLib грузится лениво — даём щедрый таймаут на ответ.
	await page.getByRole('button', { name: /\b(Ethanol|Этанол)\b/i }).click();

	const formulaCell = page.locator('dd').filter({ hasText: 'C2H6O' }).first();
	await expect(formulaCell).toBeVisible({ timeout: 30000 });
});

test('glossary: search filters the term list', async ({ page }) => {
	await page.goto('/glossary');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	await page.getByRole('searchbox').fill('атом');
	// Должно остаться хотя бы одно определение, содержащее "Атом" или "Atomic"
	await expect(page.getByText(/Атом|Atom/).first()).toBeVisible();
});

test('navigation between sections works', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /Молекулы|Molecules/i }).click();
	await expect(page).toHaveURL(/\/molecule\/?$/);

	await page.getByRole('link', { name: /Глоссарий|Glossary/i }).click();
	await expect(page).toHaveURL(/\/glossary\/?$/);

	await page.getByRole('link', { name: /Таблица|Periodic/i }).click();
	await expect(page).toHaveURL(/^[^/]*\/?$|\/$/);
});

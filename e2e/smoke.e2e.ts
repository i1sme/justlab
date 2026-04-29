// Smoke-тесты основных пользовательских путей: главная (таблица),
// карточка элемента, страница молекул, глоссарий, переключатель локали, wizard.
//
// Запуск: `npm run test:e2e`. Playwright поднимает `npm run build && npm run preview`
// перед стартом (см. playwright.config.ts).

import { test, expect } from '@playwright/test';

// По умолчанию подавляем first-run wizard: ставим school в localStorage до загрузки SPA.
// Тесты, которые проверяют сам wizard, переопределяют это в своём describe.
test.beforeEach(async ({ context }) => {
	await context.addInitScript(() => {
		localStorage.setItem('justlab.userMode', 'school');
	});
});

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

	await page.getByRole('link', { name: /Лаборатория|^Lab/i }).click();
	await expect(page).toHaveURL(/\/lab\/?$/);

	await page.getByRole('link', { name: /Таблица|Periodic/i }).click();
	await expect(page).toHaveURL(/^[^/]*\/?$|\/$/);
});

test.describe('lab — взаимодействие с реактивами', () => {
	test('добавление HCl + NaOH в контейнер запускает реакцию', async ({ page }) => {
		await page.goto('/lab');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		// Кликаем по первому контейнеру (c1) — должен стать selected.
		const firstContainer = page.locator('[role="button"][aria-pressed]').first();
		await firstContainer.click();
		await expect(firstContainer).toHaveAttribute('aria-pressed', 'true');

		// Раскрываем категорию «Кислоты» (по умолчанию open) и добавляем HCl.
		// Имя кнопки = "Соляная кислота HCl" (или English вариант).
		await page
			.getByRole('button', { name: /Соляная кислота|^Hydrochloric/i })
			.first()
			.click();

		// Затем добавляем NaOH из категории «Основания».
		await page
			.getByRole('button', { name: /Гидроксид натрия|Sodium hydroxide/i })
			.first()
			.click();

		// Реакция должна появиться в ReactionInfo: уравнение содержит NaCl.
		await expect(page.getByText(/HCl.*NaOH.*NaCl.*H₂O|HCl.*NaCl/).first()).toBeVisible({
			timeout: 5000
		});
	});

	test('пустой клик по веществу без выбранного контейнера ничего не делает', async ({ page }) => {
		await page.goto('/lab');
		// Подсказка о выборе контейнера видна.
		await expect(page.getByRole('status').filter({ hasText: /выбери|first/i })).toBeVisible();

		// Кнопки веществ задизейблены.
		const firstSubstance = page.getByRole('button', { name: /Вода|Water/i }).first();
		await expect(firstSubstance).toBeDisabled();
	});
});

test.describe('first-run wizard', () => {
	// Переопределяем глобальный beforeEach: localStorage без userMode → wizard всплывает.
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(() => {
			localStorage.removeItem('justlab.userMode');
		});
	});

	test('wizard appears on first visit', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('dialog')).toBeVisible();
		// В заголовке диалога — приветствие.
		await expect(page.getByRole('dialog')).toContainText(/настроим|tailor/i);
	});

	test('picking a mode closes wizard and persists in localStorage', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('dialog')).toBeVisible();

		// Кликаем по карточке "Школа/School".
		await page
			.getByRole('button', { name: /Школа|^School/i })
			.first()
			.click();

		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Проверяем persistence напрямую через localStorage —
		// reload не подходит, потому что addInitScript снова чистит ключ.
		const stored = await page.evaluate(() => localStorage.getItem('justlab.userMode'));
		expect(stored).toBe('school');
	});
});

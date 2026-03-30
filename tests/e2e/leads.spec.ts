import { test, expect, type Page } from '@playwright/test';

// Requer: TEST_USER_EMAIL, TEST_USER_PASSWORD no .env
// Opcionalmente: TEST_LEAD_NAME para nome único a cada run

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10_000 });
}

test.describe('Funil de Leads', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para executar estes testes'
    );
    await login(page);
  });

  test('exibe a página de leads', async ({ page }) => {
    await page.goto('/dashboard/leads');
    await expect(page).toHaveURL(/.*leads/);
    // Verifica heading ou elemento principal
    await expect(page.getByRole('heading', { name: /leads/i })).toBeVisible();
  });

  test('cria novo lead e exibe na lista', async ({ page }) => {
    const leadName = process.env.TEST_LEAD_NAME ?? `Paciente E2E ${Date.now()}`;

    await page.goto('/dashboard/leads');

    // Abre formulário/modal de criação
    await page.click('text=Novo Lead');

    // Preenche o formulário
    await page.fill('input[name="full_name"]', leadName);
    await page.fill('input[name="phone"]', '11999999999');

    // Seleciona origem (se houver select)
    const sourceSelect = page.locator('select[name="source"]');
    if (await sourceSelect.isVisible()) {
      await sourceSelect.selectOption('WHATSAPP');
    }

    // Submete
    await page.click('button[type="submit"]');

    // Aguarda o lead aparecer na lista
    await expect(page.getByText(leadName)).toBeVisible({ timeout: 5_000 });
  });

  test('navega para detalhes do lead', async ({ page }) => {
    await page.goto('/dashboard/leads');

    // Clica no primeiro lead da lista
    const firstLead = page.locator('a[href*="/dashboard/leads/"]').first();
    await firstLead.click();

    // Verifica que está em uma página de detalhe
    await expect(page).toHaveURL(/\/dashboard\/leads\/[0-9a-f-]{36}/);
  });

  test('exibe badge de status no detalhe do lead', async ({ page }) => {
    await page.goto('/dashboard/leads');

    const firstLead = page.locator('a[href*="/dashboard/leads/"]').first();
    if (!(await firstLead.isVisible())) {
      test.skip(true, 'Nenhum lead existente para testar detalhes');
    }
    await firstLead.click();

    // StatusBadge deve estar visível na página de detalhe
    await expect(
      page.locator('.rounded-full, [class*="badge"], [class*="status"]').first()
    ).toBeVisible();
  });
});

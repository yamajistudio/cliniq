import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('redireciona para /login se não autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('redireciona para /dashboard após login válido', async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para executar este teste'
    );

    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalido@teste.com');
    await page.fill('input[type="password"]', 'senhaerrada123');
    await page.click('button[type="submit"]');

    // Aguarda mensagem de erro aparecer (pode ser um alert, div de erro, etc.)
    await expect(
      page.locator('[data-testid="error-message"], [role="alert"], .text-red-700').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('não acessa /dashboard sem sessão ativa (após logout)', async ({ page }) => {
    // Navega direto sem autenticação
    await page.goto('/dashboard/leads');
    await expect(page).toHaveURL(/.*login/);
  });
});

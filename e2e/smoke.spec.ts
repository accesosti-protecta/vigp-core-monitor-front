import { expect, test } from '@playwright/test';

test.describe('Consulta de EECC', () => {
  test('sin sesion muestra la pantalla de sesion expirada', async ({ page }) => {
    await page.route('**/api/session', (r) => r.fulfill({ status: 401, body: '' }));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /sesion expiro/i })).toBeVisible();
  });

  test('sin permiso muestra la pantalla de acceso denegado', async ({ page }) => {
    await page.route('**/api/session', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'u', displayName: 'Usuario', profile: 'OTRO', permissions: [],
        }),
      }),
    );
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /no tiene acceso/i })).toBeVisible();
  });
});

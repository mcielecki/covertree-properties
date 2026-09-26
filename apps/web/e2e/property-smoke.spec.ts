import { expect, test } from '@playwright/test';

// SPEC §7.4. The api runs with WEATHER_PROVIDER=fake on the covertree_e2e database, which
// global-setup empties, so the flow starts from an empty list and uses no Weatherstack quota.
const STREET = '15528 E Golden Eagle Blvd';
const CITY = 'Fountain Hills';
const ADDRESS = `${STREET}, ${CITY}, AZ 85268`;

test('create, list, filter and delete a property', async ({ page }) => {
  // Create (AC-W.4, AC-5.1): a valid form navigates to the new property's details page.
  await page.goto('/properties/new');
  await page.getByLabel('Street').fill(STREET);
  await page.getByLabel('City').fill(CITY);
  await page.getByLabel('State').selectOption('AZ');
  await page.getByLabel('Zip code').fill('85268');
  await page.getByRole('button', { name: 'Create property' }).click();

  await expect(page).toHaveURL(/\/properties\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1, name: STREET })).toBeVisible();

  // List (AC-W.1): the new property is the first row, newest first.
  await page.goto('/');
  const rows = page.getByRole('table', { name: 'Properties' }).getByRole('row');
  const propertyRow = rows.filter({ hasText: STREET });
  await expect(rows.nth(1)).toContainText(STREET);
  await expect(rows.nth(1)).toContainText(CITY);

  // Filter by city, case-insensitive exact match (AC-W.2, AC-3.1): still shown.
  const filters = page.getByRole('form', { name: 'Filter properties' });
  await filters.getByLabel('City').fill('fountain hills');
  await filters.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/[?&]city=fountain\+hills/);
  await expect(propertyRow).toBeVisible();

  // Add another state (AC-W.2, AC-3.6): both must match, so it is gone.
  await filters.getByLabel('State').selectOption('CA');
  await expect(page).toHaveURL(/[?&]state=CA/);
  await expect(page.getByText('No properties match these filters.')).toBeVisible();
  await expect(propertyRow).toHaveCount(0);

  // Delete with confirmation (AC-W.6): the list is refetched without a reload.
  await filters.getByRole('button', { name: 'Clear filters' }).click();
  await expect(propertyRow).toBeVisible();
  await propertyRow.getByRole('button', { name: `Delete ${ADDRESS}` }).click();

  const dialog = page.getByRole('alertdialog', { name: 'Delete this property?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete property' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('No properties yet.')).toBeVisible();
  await expect(propertyRow).toHaveCount(0);
});

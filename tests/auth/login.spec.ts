import { test, expect } from '@fixtures/test';
import { users } from '@data/users';
import { CATALOGUE_SIZE } from '@data/products';
import { InventoryPage } from '@pages/InventoryPage';

test.describe('Authentication', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // A1
  test('standard_user logs in and sees the inventory page with the full product list @smoke', async ({
    loginPage,
    inventoryPage,
    page,
  }) => {
    await loginPage.login(users.standard);

    await expect(page).toHaveURL(InventoryPage.path);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.productList).toBeVisible();
    await expect(inventoryPage.productItems).toHaveCount(CATALOGUE_SIZE);
    await expect(inventoryPage.header.cartLink).toBeVisible();
  });

  // A2
  test('locked_out_user is rejected with a visible error and stays on the login page @smoke', async ({
    loginPage,
    inventoryPage,
    page,
  }) => {
    await loginPage.login(users.lockedOut);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Sorry, this user has been locked out.');
    await expect(page).toHaveURL(/\/$/);
    await expect(inventoryPage.productList).toBeHidden();
    await expect(inventoryPage.header.cartLink).toBeHidden();
  });

  // A2 (second invalid path)
  test('wrong password is rejected with a credential mismatch error and no authenticated access', async ({
    loginPage,
    inventoryPage,
    page,
  }) => {
    await loginPage.login(users.wrongPassword);

    await expect(loginPage.errorMessage).toContainText(
      'Username and password do not match any user in this service',
    );
    await expect(page).toHaveURL(/\/$/);
    await expect(inventoryPage.productList).toBeHidden();
  });

  // A2 (defence in depth): authenticated routes are not reachable without a session
  test('visiting the inventory URL without logging in redirects to login with an error', async ({
    inventoryPage,
    loginPage,
    page,
  }) => {
    await inventoryPage.goto();

    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.errorMessage).toContainText(
      "You can only access '/inventory.html' when you are logged in.",
    );
    await expect(inventoryPage.productList).toBeHidden();
  });
});

import { test, expect } from '@fixtures/test';
import { products } from '@data/products';
import { InventoryPage } from '@pages/InventoryPage';

/**
 * A6: logout and isolation.
 * The two "starts clean" tests deliberately share nothing: the first fills the cart
 * and ends without clearing it; the second asserts it still starts empty. Because they
 * run in any order (fullyParallel + per-test browser context) they prove that state does
 * not leak between tests.
 */
test.describe('Session cleanup and isolation', () => {
  test('logging out returns to the login page and blocks access to authenticated pages @smoke', async ({
    authenticatedPage: inventoryPage,
    loginPage,
    page,
  }) => {
    await inventoryPage.addToCart(products.backpack);
    await expect(inventoryPage.header.cartBadge).toHaveText('1');

    await inventoryPage.header.logout();

    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.usernameInput).toHaveValue('');
    await expect(inventoryPage.header.cartLink).toBeHidden();

    // Logout really ended the session: the session cookie is gone and a deep link is refused.
    const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
    expect(cookieNames).not.toContain('session-username');

    await inventoryPage.goto();
    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.errorMessage).toContainText('when you are logged in');
  });

  test('a test that leaves items in the cart does not affect other tests', async ({
    authenticatedPage: inventoryPage,
  }) => {
    await expect(inventoryPage.header.cartBadge).toBeHidden();
    await inventoryPage.addToCart(products.fleeceJacket);
    await inventoryPage.addToCart(products.redTShirt);
    await expect(inventoryPage.header.cartBadge).toHaveText('2');
    // Intentionally no cleanup: isolation must come from the framework, not from test discipline.
  });

  test('every test starts with a fresh session, empty cart and default sort order', async ({
    authenticatedPage: inventoryPage,
    page,
  }) => {
    await expect(page).toHaveURL(InventoryPage.path);
    await expect(inventoryPage.header.cartBadge).toBeHidden();
    await expect(inventoryPage.sortSelect).toHaveValue('az');

    const names = await inventoryPage.getDisplayedNames();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    const addButtons = page.getByRole('button', { name: 'Add to cart' });
    await expect(addButtons).toHaveCount(await inventoryPage.productItems.count());
    await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(0);

    const storedCart = await page.evaluate(() => window.localStorage.getItem('cart-contents'));
    expect(storedCart === null || JSON.parse(storedCart).length === 0).toBe(true);
  });
});

import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { users, type Credentials } from '../data/users';

interface PageFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
}

interface SessionFixtures {
  /** Credentials used by `authenticatedPage`. Override per file with `test.use({ user: users.problem })`. */
  user: Credentials;
  /**
   * An InventoryPage that is already logged in as `user`.
   * Playwright gives every test a fresh browser context, so cookies, localStorage and
   * therefore the SauceDemo cart never leak between tests. No shared storageState on purpose:
   * the login is cheap and keeping it per-test makes isolation explicit.
   */
  authenticatedPage: InventoryPage;
}

export const test = base.extend<PageFixtures & SessionFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  user: [users.standard, { option: true }],

  authenticatedPage: async ({ loginPage, inventoryPage, user }, use) => {
    await loginPage.goto();
    await loginPage.login(user);
    await expect(inventoryPage.productList).toBeVisible();
    await use(inventoryPage);
  },
});

export { expect };

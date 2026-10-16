import { test, expect } from '@fixtures/test';
import { users } from '@data/users';
import { products } from '@data/products';
import { checkoutCustomer } from '@data/checkout';
import { CheckoutPage } from '@pages/CheckoutPage';

/**
 * A7: exploratory check of the checkout flow with problem_user.
 *
 * These tests assert the CORRECT behaviour and are marked with `test.fail()` because
 * the defect is known and documented in BUG_REPORT.md. Playwright therefore reports them
 * as "expected failures" (suite stays green) and flips them to a hard failure the moment
 * the bug is fixed, which is the signal to remove the marker and promote the test.
 *
 * Run only these: `npm run test:exploratory`
 */
test.describe('Exploratory: problem_user @exploratory', () => {
  test.use({ user: users.problem });

  test('BUG-001: last name entered at checkout is stored in the last name field and checkout can continue', async ({
    authenticatedPage: inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    test.fail(true, 'Known defect BUG-001, see BUG_REPORT.md');

    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.header.openCart();
    await cartPage.checkout();
    await expect(page).toHaveURL(CheckoutPage.stepOnePath);

    await checkoutPage.fillCustomerInformation(checkoutCustomer);

    await expect(checkoutPage.firstNameInput).toHaveValue(checkoutCustomer.firstName);
    await expect(checkoutPage.lastNameInput).toHaveValue(checkoutCustomer.lastName);
    await expect(checkoutPage.postalCodeInput).toHaveValue(checkoutCustomer.postalCode);

    await checkoutPage.continueToOverview();
    await expect(checkoutPage.errorMessage).toBeHidden();
    await expect(page).toHaveURL(CheckoutPage.stepTwoPath);
  });

  test('BUG-002: sorting by price low to high re-orders the product list', async ({
    authenticatedPage: inventoryPage,
  }) => {
    test.fail(true, 'Known defect BUG-002, see BUG_REPORT.md');

    const pricesBefore = await inventoryPage.getDisplayedPrices();
    await inventoryPage.sortBy('lohi');

    await expect(inventoryPage.sortSelect).toHaveValue('lohi');
    await expect(inventoryPage.productPrices.first()).toHaveText(
      `$${Math.min(...pricesBefore).toFixed(2)}`,
    );
  });
});

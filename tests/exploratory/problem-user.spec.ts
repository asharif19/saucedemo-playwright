import { test, expect } from '@fixtures/test';
import { users } from '@data/users';
import { products } from '@data/products';
import { checkoutCustomer } from '@data/checkout';
import { CheckoutPage } from '@pages/CheckoutPage';

/**
 * A7: exploratory check with problem_user.
 *
 * These are DEFECT REPRODUCTIONS: each test asserts the buggy behaviour documented in
 * BUG_REPORT.md and passes while the bug exists. A failure here means one of two things,
 * both worth a human look: the defect was fixed (promote the test to the core suite), or
 * the reproduction itself broke (site change or outage). This is deliberately not
 * `test.fail()`, which would also swallow unrelated failures such as a login timeout.
 *
 * Run only these: `npm run test:exploratory`
 */
test.describe('Exploratory: problem_user defect reproductions', { tag: '@exploratory' }, () => {
  test.use({ user: users.problem });

  test('BUG-001 reproduction: last name typed at checkout lands in the first name field and blocks checkout', async ({
    authenticatedPage: inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG_REPORT.md#bug-001' });

    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.header.openCart();
    await cartPage.checkout();
    await expect(page).toHaveURL(CheckoutPage.stepOnePath);

    await checkoutPage.fillCustomerInformation(checkoutCustomer);

    await test.step('observed: last name overwrote first name, last name stayed empty', async () => {
      await expect(checkoutPage.firstNameInput).toHaveValue(checkoutCustomer.lastName);
      await expect(checkoutPage.lastNameInput).toHaveValue('');
      await expect(checkoutPage.postalCodeInput).toHaveValue(checkoutCustomer.postalCode);
    });

    await test.step('observed: Continue is rejected and the user cannot reach the overview', async () => {
      await checkoutPage.continueToOverview();
      await expect(checkoutPage.errorMessage).toContainText('Last Name is required');
      await expect(page).toHaveURL(CheckoutPage.stepOnePath);
    });
  });

  test('BUG-002 reproduction: selecting price low to high leaves the sort and the product order unchanged', async ({
    authenticatedPage: inventoryPage,
  }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG_REPORT.md#bug-002' });

    const pricesBefore = await inventoryPage.getDisplayedPrices();
    await inventoryPage.sortBy('lohi');

    await test.step('observed: select snaps back to A to Z and prices are not re-ordered', async () => {
      await expect(inventoryPage.sortSelect).toHaveValue('az');
      await expect(inventoryPage.productPrices).toHaveText(
        pricesBefore.map((price) => `$${price.toFixed(2)}`),
      );
    });
  });
});

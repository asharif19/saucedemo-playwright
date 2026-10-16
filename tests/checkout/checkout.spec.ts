import { test, expect } from '@fixtures/test';
import { products } from '@data/products';
import { checkoutCustomer, TAX_RATE } from '@data/checkout';
import { CheckoutPage } from '@pages/CheckoutPage';
import { roundMoney, sum } from '@utils/money';

test.describe('Checkout', () => {
  // A5
  test(
    'completing checkout shows a correct item total, tax and final total, then confirms the order',
    { tag: '@smoke' },
    async ({ authenticatedPage: inventoryPage, cartPage, checkoutPage, page }) => {
      const selection = [products.backpack, products.boltTShirt, products.onesie];

      const expected = await test.step('build the cart and derive expected totals from it', async () => {
        for (const product of selection) {
          await inventoryPage.addToCart(product);
        }
        await expect(inventoryPage.header.cartBadge).toHaveText(String(selection.length));

        await inventoryPage.header.openCart();
        await expect(cartPage.cartItems).toHaveCount(selection.length);
        // What the cart actually shows is the source of truth for the expected totals.
        const cartLines = await cartPage.getLines();
        const itemTotal = sum(cartLines.map((line) => line.price * line.quantity));
        const tax = roundMoney(itemTotal * TAX_RATE);
        return { itemTotal, tax, total: roundMoney(itemTotal + tax) };
      });

      await test.step('enter customer information', async () => {
        await cartPage.checkout();
        await expect(page).toHaveURL(CheckoutPage.stepOnePath);
        await checkoutPage.fillCustomerInformation(checkoutCustomer);
        await checkoutPage.continueToOverview();
      });

      await test.step('overview totals match the cart contents', async () => {
        await expect(page).toHaveURL(CheckoutPage.stepTwoPath);
        await expect(checkoutPage.summaryItems).toHaveCount(selection.length);
        await expect(checkoutPage.totalLabel).toBeVisible();

        const summary = await checkoutPage.getOrderSummary();
        expect(summary.itemTotal).toBeCloseTo(expected.itemTotal, 2);
        expect(summary.tax).toBeCloseTo(expected.tax, 2);
        expect(summary.total).toBeCloseTo(expected.total, 2);
        // Internal consistency of what the user sees, independent of our tax-rate assumption.
        expect(roundMoney(summary.itemTotal + summary.tax)).toBeCloseTo(summary.total, 2);
      });

      await test.step('finishing shows the confirmation and empties the cart', async () => {
        await checkoutPage.finish();
        await expect(page).toHaveURL(CheckoutPage.completePath);
        await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
        await expect(checkoutPage.completeText).toContainText('Your order has been dispatched');
        await expect(checkoutPage.header.cartBadge).toBeHidden();
      });
    },
  );

  test('checkout information step rejects submission when the first name is missing', async ({
    authenticatedPage: inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.addToCart(products.bikeLight);
    await inventoryPage.header.openCart();
    await cartPage.checkout();

    await checkoutPage.fillCustomerInformation({ ...checkoutCustomer, firstName: '' });
    await checkoutPage.continueToOverview();

    await expect(checkoutPage.errorMessage).toContainText('First Name is required');
    await expect(page).toHaveURL(CheckoutPage.stepOnePath);
  });
});

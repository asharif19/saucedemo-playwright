import { test, expect } from '@fixtures/test';
import { products } from '@data/products';
import { checkoutCustomer, TAX_RATE } from '@data/checkout';
import { CheckoutPage } from '@pages/CheckoutPage';
import { roundMoney, sum } from '@utils/money';

test.describe('Checkout', () => {
  // A5
  test('completing checkout shows a correct item total, tax and final total, then confirms the order @smoke', async ({
    authenticatedPage: inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    const selection = [products.backpack, products.boltTShirt, products.onesie];
    for (const product of selection) {
      await inventoryPage.addToCart(product);
    }
    await expect(inventoryPage.header.cartBadge).toHaveText(String(selection.length));

    await inventoryPage.header.openCart();
    // Use what the cart actually shows as the source of truth for the expected totals.
    const cartLines = await cartPage.getLines();
    expect(cartLines).toHaveLength(selection.length);
    const expectedItemTotal = sum(cartLines.map((line) => line.price * line.quantity));
    const expectedTax = roundMoney(expectedItemTotal * TAX_RATE);
    const expectedTotal = roundMoney(expectedItemTotal + expectedTax);

    await cartPage.checkout();
    await expect(page).toHaveURL(CheckoutPage.stepOnePath);
    await checkoutPage.fillCustomerInformation(checkoutCustomer);
    await checkoutPage.continueToOverview();

    await expect(page).toHaveURL(CheckoutPage.stepTwoPath);
    await expect(checkoutPage.summaryItems).toHaveCount(selection.length);
    const summary = await checkoutPage.getOrderSummary();
    expect(summary.itemTotal).toBeCloseTo(expectedItemTotal, 2);
    expect(summary.tax).toBeCloseTo(expectedTax, 2);
    expect(summary.total).toBeCloseTo(expectedTotal, 2);
    // Internal consistency of what the user sees, independent of our tax assumption.
    expect(roundMoney(summary.itemTotal + summary.tax)).toBeCloseTo(summary.total, 2);

    await checkoutPage.finish();
    await expect(page).toHaveURL(CheckoutPage.completePath);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.completeText).toContainText('Your order has been dispatched');
    await expect(checkoutPage.header.cartBadge).toBeHidden();
  });

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

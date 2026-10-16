import { test, expect } from '@fixtures/test';
import { products } from '@data/products';
import { CartPage } from '@pages/CartPage';

test.describe('Cart behaviour', () => {
  // A4
  test(
    'adding two products updates the badge and the cart lists correct names, prices and quantities',
    { tag: '@smoke' },
    async ({ authenticatedPage: inventoryPage, cartPage, page }) => {
      const first = products.backpack;
      const second = products.bikeLight;
      const selection = [first, second];

      await test.step('add two products and watch the badge increment', async () => {
        await expect(inventoryPage.header.cartBadge).toBeHidden();

        await inventoryPage.addToCart(first);
        await expect(inventoryPage.header.cartBadge).toHaveText('1');
        await expect(inventoryPage.removeFromCartButton(first)).toBeVisible();

        await inventoryPage.addToCart(second);
        await expect(inventoryPage.header.cartBadge).toHaveText('2');
        await expect(inventoryPage.removeFromCartButton(second)).toBeVisible();
      });

      await test.step('cart shows exactly the selected products', async () => {
        await inventoryPage.header.openCart();
        await expect(page).toHaveURL(CartPage.path);
        await expect(cartPage.title).toHaveText('Your Cart');
        await expect(cartPage.cartItems).toHaveCount(selection.length);

        const lines = await cartPage.getLines();
        expect(lines).toHaveLength(selection.length);
        expect(lines).toEqual(
          expect.arrayContaining(selection.map((p) => ({ name: p.name, price: p.price, quantity: 1 }))),
        );
      });
    },
  );

  test('removing a product from the cart page updates the badge and the remaining lines', async ({
    authenticatedPage: inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.addToCart(products.onesie);
    await expect(inventoryPage.header.cartBadge).toHaveText('2');

    await inventoryPage.header.openCart();
    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.cartItems
      .filter({ hasText: products.backpack.name })
      .getByRole('button', { name: 'Remove' })
      .click();

    await expect(cartPage.cartItems).toHaveCount(1);
    await expect(cartPage.header.cartBadge).toHaveText('1');
    expect(await cartPage.getLines()).toEqual([
      { name: products.onesie.name, price: products.onesie.price, quantity: 1 },
    ]);
  });
});

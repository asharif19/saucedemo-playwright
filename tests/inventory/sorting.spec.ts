import { test, expect } from '@fixtures/test';
import { CATALOGUE_SIZE } from '@data/products';
import { sortAscending, sortDescending } from '@utils/money';

test.describe('Product sorting', () => {
  // A3
  test(
    'sorting by price low to high orders every displayed price ascending',
    { tag: '@smoke' },
    async ({ authenticatedPage: inventoryPage }) => {
      const pricesBefore = await inventoryPage.getDisplayedPrices();
      expect(pricesBefore).toHaveLength(CATALOGUE_SIZE);

      // Precondition that makes the re-render guard below meaningful.
      const cheapest = Math.min(...pricesBefore);
      expect(pricesBefore[0]).not.toBe(cheapest);

      await inventoryPage.sortBy('lohi');
      await expect(inventoryPage.sortSelect).toHaveValue('lohi');

      // Web-first guard: wait until the first visible price is the cheapest known price,
      // which proves the re-render happened before we read the whole list.
      await expect(inventoryPage.productPrices.first()).toHaveText(`$${cheapest.toFixed(2)}`);

      const pricesAfter = await inventoryPage.getDisplayedPrices();

      // Equality with the numerically sorted original proves both ascending order and that
      // sorting only re-ordered (nothing added, dropped or altered).
      expect(pricesAfter).toEqual(sortAscending(pricesBefore));
    },
  );

  test('sorting by price high to low orders every displayed price descending', async ({
    authenticatedPage: inventoryPage,
  }) => {
    const pricesBefore = await inventoryPage.getDisplayedPrices();
    const mostExpensive = Math.max(...pricesBefore);
    expect(pricesBefore[0]).not.toBe(mostExpensive);

    await inventoryPage.sortBy('hilo');
    await expect(inventoryPage.sortSelect).toHaveValue('hilo');
    await expect(inventoryPage.productPrices.first()).toHaveText(`$${mostExpensive.toFixed(2)}`);

    const pricesAfter = await inventoryPage.getDisplayedPrices();
    expect(pricesAfter).toEqual(sortDescending(pricesBefore));
  });
});

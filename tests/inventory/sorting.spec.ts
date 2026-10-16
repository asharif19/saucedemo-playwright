import { test, expect } from '@fixtures/test';
import { CATALOGUE_SIZE } from '@data/products';
import { isSortedAscending } from '@utils/money';

test.describe('Product sorting', () => {
  // A3
  test('sorting by price low to high orders every displayed price ascending @smoke', async ({
    authenticatedPage: inventoryPage,
  }) => {
    const pricesBefore = await inventoryPage.getDisplayedPrices();
    expect(pricesBefore).toHaveLength(CATALOGUE_SIZE);

    await inventoryPage.sortBy('lohi');
    await expect(inventoryPage.sortSelect).toHaveValue('lohi');

    // Web-first assertion: wait until the first visible price is the cheapest known price,
    // which proves the re-render happened before we read the whole list.
    const cheapest = Math.min(...pricesBefore);
    await expect(inventoryPage.productPrices.first()).toHaveText(`$${cheapest.toFixed(2)}`);

    const pricesAfter = await inventoryPage.getDisplayedPrices();

    expect(pricesAfter).toHaveLength(CATALOGUE_SIZE);
    expect(isSortedAscending(pricesAfter)).toBe(true);
    // Sorting must only re-order, never add, drop or alter prices.
    expect([...pricesAfter].sort((a, b) => a - b)).toEqual([...pricesBefore].sort((a, b) => a - b));
    expect(pricesAfter).toEqual([...pricesBefore].sort((a, b) => a - b));
  });

  test('sorting by price high to low orders every displayed price descending', async ({
    authenticatedPage: inventoryPage,
  }) => {
    const pricesBefore = await inventoryPage.getDisplayedPrices();

    await inventoryPage.sortBy('hilo');
    const mostExpensive = Math.max(...pricesBefore);
    await expect(inventoryPage.productPrices.first()).toHaveText(`$${mostExpensive.toFixed(2)}`);

    const pricesAfter = await inventoryPage.getDisplayedPrices();
    expect(pricesAfter).toEqual([...pricesBefore].sort((a, b) => b - a));
  });
});

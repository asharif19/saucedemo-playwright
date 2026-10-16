import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Product } from '../data/products';
import { parseMoney } from '../utils/money';

/** Option values of the product sort <select>. */
export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage extends BasePage {
  static readonly path = '/inventory.html';

  readonly title: Locator;
  readonly productList: Locator;
  readonly productItems: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly productImages: Locator;
  readonly sortSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.productList = page.getByTestId('inventory-list');
    this.productItems = page.getByTestId('inventory-item');
    this.productNames = page.getByTestId('inventory-item-name');
    this.productPrices = page.getByTestId('inventory-item-price');
    this.productImages = this.productItems.getByRole('img');
    this.sortSelect = page.getByTestId('product-sort-container');
  }

  async goto(): Promise<void> {
    await this.page.goto(InventoryPage.path);
  }

  addToCartButton(product: Product): Locator {
    return this.page.getByTestId(`add-to-cart-${product.slug}`);
  }

  removeFromCartButton(product: Product): Locator {
    return this.page.getByTestId(`remove-${product.slug}`);
  }

  async addToCart(product: Product): Promise<void> {
    await this.addToCartButton(product).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async getDisplayedPrices(): Promise<number[]> {
    const texts = await this.productPrices.allTextContents();
    return texts.map(parseMoney);
  }

  async getDisplayedNames(): Promise<string[]> {
    return this.productNames.allTextContents();
  }
}

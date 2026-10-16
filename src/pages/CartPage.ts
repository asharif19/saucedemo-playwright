import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseMoney } from '../utils/money';

export interface CartLine {
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export class CartPage extends BasePage {
  static readonly path = '/cart.html';

  readonly title: Locator;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.cartItems = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
  }

  async goto(): Promise<void> {
    await this.page.goto(CartPage.path);
  }

  /** Reads every cart line as structured data so tests compare values, not formatted strings. */
  async getLines(): Promise<CartLine[]> {
    const rows = await this.cartItems.all();
    return Promise.all(
      rows.map(async (row) => ({
        name: (await row.getByTestId('inventory-item-name').innerText()).trim(),
        price: parseMoney(await row.getByTestId('inventory-item-price').innerText()),
        quantity: Number.parseInt(await row.getByTestId('item-quantity').innerText(), 10),
      })),
    );
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}

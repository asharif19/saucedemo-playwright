import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { CheckoutCustomer } from '@data/checkout';
import { parseMoney } from '@utils/money';

export interface OrderSummary {
  readonly itemTotal: number;
  readonly tax: number;
  readonly total: number;
}

/**
 * Covers the three checkout screens: information (step one), overview (step two)
 * and completion. They form one linear flow, so a single page object keeps the
 * test readable while locators stay grouped by screen.
 */
export class CheckoutPage extends BasePage {
  static readonly stepOnePath = '/checkout-step-one.html';
  static readonly stepTwoPath = '/checkout-step-two.html';
  static readonly completePath = '/checkout-complete.html';

  // Step one: customer information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly errorMessage: Locator;

  // Step two: overview
  readonly summaryItems: Locator;
  readonly itemTotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;

  // Completion
  readonly completeHeader: Locator;
  readonly completeText: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.errorMessage = page.getByTestId('error');

    this.summaryItems = page.getByTestId('inventory-item');
    this.itemTotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });

    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
  }

  async fillCustomerInformation(customer: CheckoutCustomer): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.postalCode);
  }

  async continueToOverview(): Promise<void> {
    await this.continueButton.click();
  }

  async getOrderSummary(): Promise<OrderSummary> {
    return {
      itemTotal: parseMoney(await this.itemTotalLabel.innerText()),
      tax: parseMoney(await this.taxLabel.innerText()),
      total: parseMoney(await this.totalLabel.innerText()),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}

export interface CheckoutCustomer {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

export const checkoutCustomer: CheckoutCustomer = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '1815',
};

/** SauceDemo applies a flat 8% sales tax to the item subtotal. */
export const TAX_RATE = 0.08;

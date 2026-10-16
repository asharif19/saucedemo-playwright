/**
 * Parses a currency string such as "$29.99" or "Item total: $39.98" into a number.
 * Throws instead of returning NaN so a broken locator fails loudly with context.
 */
export function parseMoney(text: string): number {
  const match = /\$\s*(\d[\d,]*(?:\.\d+)?)/.exec(text);
  const amount = match?.[1];
  if (amount === undefined) {
    throw new Error(`Could not parse a money value from "${text}"`);
  }
  return Number.parseFloat(amount.replace(/,/g, ''));
}

/** Rounds to 2 decimals to avoid 0.1 + 0.2 style floating point drift in comparisons. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sum(values: readonly number[]): number {
  return roundMoney(values.reduce((acc, v) => acc + v, 0));
}

export function sortAscending(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function sortDescending(values: readonly number[]): number[] {
  return [...values].sort((a, b) => b - a);
}

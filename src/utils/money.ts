/**
 * Parses a currency string such as "$29.99" or "Item total: $39.98" into a number.
 * Throws instead of returning NaN so a broken locator fails loudly with context.
 */
export function parseMoney(text: string): number {
  const match = text.match(/\$\s*(\d[\d,]*(?:\.\d+)?)/);
  if (!match || match[1] === undefined) {
    throw new Error(`Could not parse a money value from "${text}"`);
  }
  return Number.parseFloat(match[1].replace(/,/g, ''));
}

/** Rounds to 2 decimals to avoid 0.1 + 0.2 style floating point drift in comparisons. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sum(values: readonly number[]): number {
  return roundMoney(values.reduce((acc, v) => acc + v, 0));
}

export function isSortedAscending(values: readonly number[]): boolean {
  return values.every((value, index) => index === 0 || (values[index - 1] as number) <= value);
}

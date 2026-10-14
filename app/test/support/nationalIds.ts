import { faker } from '@faker-js/faker';

/** The 13th digit of a Thai national id, from its first 12 digits (same rule as src/domain/thaiNationalId.ts). */
export function checksumDigit(first12: string): number {
  const sum = [...first12].reduce((acc, digit, i) => acc + Number(digit) * (13 - i), 0);
  return (11 - (sum % 11)) % 10;
}

/** A random national id that always passes isValidThaiNationalId. */
export function aValidNationalId(): string {
  const first12 = faker.string.numeric({ length: 12, allowLeadingZeros: false });
  return first12 + checksumDigit(first12);
}

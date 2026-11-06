import { ZERO, type Decimal } from './decimal';

export type Sign = 1 | -1;

export interface SignedArea {
  sign: Sign;
  sqft: Decimal;
}

/** Add and subtract parcels (all already in square feet). May be negative. */
export function combineAreas(parcels: readonly SignedArea[]): Decimal {
  return parcels.reduce<Decimal>((acc, p) => (p.sign === 1 ? acc.plus(p.sqft) : acc.minus(p.sqft)), ZERO);
}

export function isNegativeArea(value: Decimal): boolean {
  return value.isNegative() && !value.isZero();
}
